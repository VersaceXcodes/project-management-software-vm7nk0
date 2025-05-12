// server.mjs

// Import and configure environment variables
import dotenv from "dotenv";
dotenv.config();

// Import necessary packages
import express from "express";
import cors from "cors";
import morgan from "morgan";
import pkg from "pg";
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import fs from "fs";

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage directory exists for file uploads
const storageDir = path.join(__dirname, "storage");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir);
}

// Configure multer for file uploads
const upload = multer({ dest: storageDir });

// Initialize Express app
const app = express();

// PostgreSQL connection pool as specified
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Middlewares for CORS, logging and JSON parsing
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Secret configuration (default if not provided)
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware: Authenticate JWT token for protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Missing token" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// ===== REST API Endpoints =====

// User Registration Endpoint
/*
  Registers a new user.
  - Hashes the password with bcrypt.
  - Inserts a new record into the users table.
  - Returns a JWT token and user profile in JSON format.
*/
app.post("/api/auth/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, profile_picture_url } = req.body;
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    // Default notification_settings as empty JSON if not provided
    const notification_settings = JSON.stringify({});
    const queryText = `
      INSERT INTO users (id, first_name, last_name, email, password_hash, profile_picture_url, role, notification_settings, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, first_name, last_name, email, profile_picture_url, role, notification_settings, created_at, updated_at
    `;
    const values = [id, first_name, last_name, email, hashedPassword, profile_picture_url || null, role, notification_settings, created_at, updated_at];
    const result = await pool.query(queryText, values);
    const user = result.rows[0];
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// User Login Endpoint
/*
  Authenticates a user with email and password.
  - Verifies the provided password against the stored hash.
  - Returns a JWT token and user profile if successful.
*/
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const queryText = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(queryText, [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    // Remove password_hash before sending user data
    delete user.password_hash;
    res.json({ token, user });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get User Profile Endpoint
/*
  Retrieves the user profile based on user_id.
  - Requires valid JWT auth.
*/
app.get("/api/users/:user_id", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const queryText = `SELECT id, first_name, last_name, email, profile_picture_url, role, notification_settings, created_at, updated_at FROM users WHERE id = $1`;
    const result = await pool.query(queryText, [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in get user profile:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Update User Profile Endpoint
/*
  Updates a user's profile information.
  - Allows updating first name, last name, profile picture, and notification settings.
*/
app.put("/api/users/:user_id", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { first_name, last_name, profile_picture_url, notification_settings } = req.body;
    const updated_at = new Date().toISOString();
    const queryText = `
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          profile_picture_url = COALESCE($3, profile_picture_url),
          notification_settings = COALESCE($4, notification_settings),
          updated_at = $5
      WHERE id = $6
      RETURNING id, first_name, last_name, email, profile_picture_url, role, notification_settings, created_at, updated_at
    `;
    const values = [first_name, last_name, profile_picture_url, notification_settings ? JSON.stringify(notification_settings) : null, updated_at, user_id];
    const result = await pool.query(queryText, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in update user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

// Send Invitation Endpoint
/*
  Allows a project manager to invite a new user.
  - Inserts a record into the user_invitations table.
*/
app.post("/api/invitations", authenticateToken, async (req, res) => {
  try {
    const { invitee_email, role } = req.body;
    // Only project managers are allowed to send invites (authorization check)
    if (req.user.role !== "project_manager") {
      return res.status(403).json({ error: "Not authorized to send invitations" });
    }
    const id = uuidv4();
    const inviter_id = req.user.id;
    const status = "pending";
    const created_at = new Date().toISOString();
    const queryText = `
      INSERT INTO user_invitations (id, inviter_id, invitee_email, role, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, inviter_id, invitee_email, role, status, created_at
    `;
    const values = [id, inviter_id, invitee_email, role, status, created_at];
    const result = await pool.query(queryText, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in sending invitation:", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// Create Project Endpoint
/*
  Creates a new project.
  - Inserts project details into projects table.
  - If milestones are provided, inserts each milestone into the milestones table linked by project_id.
*/
app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const { title, description, start_date, end_date, milestones } = req.body;
    const id = uuidv4();
    const created_by = req.user.id;
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const archived = 0;
    const queryText = `
      INSERT INTO projects (id, title, description, start_date, end_date, archived, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const projectResult = await pool.query(queryText, [id, title, description || null, start_date, end_date, archived, created_by, created_at, updated_at]);
    const project = projectResult.rows[0];

    // If milestones are provided, insert them into the milestones table.
    let projectMilestones = [];
    if (milestones && Array.isArray(milestones)) {
      for (const milestone of milestones) {
        const milestone_id = uuidv4();
        const { title: msTitle, due_date, description: msDescription } = milestone;
        const msQuery = `
          INSERT INTO milestones (id, project_id, title, due_date, description)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const msResult = await pool.query(msQuery, [milestone_id, id, msTitle, due_date, msDescription || null]);
        projectMilestones.push(msResult.rows[0]);
      }
    }
    project.milestones = projectMilestones;
    res.json(project);
  } catch (error) {
    console.error("Error in create project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// List Projects Endpoint
/*
  Retrieves projects accessible to the user.
  - Filters projects by archived status if provided.
  - Considers both projects created by the user and projects where the user is a member.
  - Attaches milestone data to each project.
*/
app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const archived = req.query.archived ? Number(req.query.archived) : 0;
    const userId = req.user.id;
    const queryText = `
      SELECT * FROM projects 
      WHERE archived = $1 
      AND (created_by = $2 OR id IN (SELECT project_id FROM project_members WHERE user_id = $2))
      ORDER BY created_at DESC
    `;
    const projectResult = await pool.query(queryText, [archived, userId]);
    const projects = projectResult.rows;
    // For each project, attach related milestones
    for (let project of projects) {
      const msQuery = `SELECT * FROM milestones WHERE project_id = $1`;
      const msResult = await pool.query(msQuery, [project.id]);
      project.milestones = msResult.rows;
    }
    res.json(projects);
  } catch (error) {
    console.error("Error in list projects:", error);
    res.status(500).json({ error: "Failed to retrieve projects" });
  }
});

// Update Project Endpoint
/*
  Updates project details.
  - Updates fields in the projects table.
  - If milestones are provided in the update, old milestones are deleted and new ones are inserted.
*/
app.put("/api/projects/:project_id", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const { title, description, start_date, end_date, milestones } = req.body;
    const updated_at = new Date().toISOString();
    const queryText = `
      UPDATE projects 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          start_date = COALESCE($3, start_date),
          end_date = COALESCE($4, end_date),
          updated_at = $5
      WHERE id = $6
      RETURNING *
    `;
    const projectResult = await pool.query(queryText, [title, description, start_date, end_date, updated_at, project_id]);
    let project = projectResult.rows[0];

    // If milestones are provided, replace old milestones with new ones
    if (milestones && Array.isArray(milestones)) {
      // Delete existing milestones for the project
      await pool.query(`DELETE FROM milestones WHERE project_id = $1`, [project_id]);
      let projectMilestones = [];
      for (const milestone of milestones) {
        const milestone_id = uuidv4();
        const { title: msTitle, due_date, description: msDescription } = milestone;
        const msQuery = `
          INSERT INTO milestones (id, project_id, title, due_date, description)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const msResult = await pool.query(msQuery, [milestone_id, project_id, msTitle, due_date, msDescription || null]);
        projectMilestones.push(msResult.rows[0]);
      }
      project.milestones = projectMilestones;
    } else {
      // Otherwise, fetch existing milestones
      const msResult = await pool.query(`SELECT * FROM milestones WHERE project_id = $1`, [project_id]);
      project.milestones = msResult.rows;
    }
    res.json(project);
  } catch (error) {
    console.error("Error in update project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Archive (Delete) Project Endpoint
/*
  Archives a project by setting its archived field to 1.
*/
app.delete("/api/projects/:project_id", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const updated_at = new Date().toISOString();
    const queryText = `
      UPDATE projects 
      SET archived = 1,
          updated_at = $1
      WHERE id = $2
    `;
    await pool.query(queryText, [updated_at, project_id]);
    res.json({ message: "Project archived successfully" });
  } catch (error) {
    console.error("Error in archive project:", error);
    res.status(500).json({ error: "Failed to archive project" });
  }
});

// Create Task Endpoint
/*
  Creates a new task (or subtask) within a project.
  - Inserts a new task record into the tasks table.
  - Emits a realtime "task_update_event" via websockets.
*/
app.post("/api/projects/:project_id/tasks", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const { name, description, parent_task_id, assignee_id, due_date, priority, status } = req.body;
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const queryText = `
      INSERT INTO tasks (id, project_id, parent_task_id, name, description, assignee_id, due_date, priority, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const taskResult = await pool.query(queryText, [id, project_id, parent_task_id || null, name, description || null, assignee_id || null, due_date, priority, status, created_at, updated_at]);
    const task = taskResult.rows[0];
    // Emit realtime task update event
    io.emit("task_update_event", task);
    res.json(task);
  } catch (error) {
    console.error("Error in create task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// List Tasks for a Project Endpoint
/*
  Retrieves all tasks (and subtasks) for a given project.
*/
app.get("/api/projects/:project_id/tasks", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const queryText = `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at`;
    const result = await pool.query(queryText, [project_id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error in list tasks:", error);
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

// Update Task Endpoint
/*
  Updates task details including status (e.g., via Kanban drag-and-drop).
  - Updates the tasks table and emits a realtime "task_update_event".
*/
app.put("/api/tasks/:task_id", authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.params;
    const { name, description, parent_task_id, assignee_id, due_date, priority, status } = req.body;
    const updated_at = new Date().toISOString();
    const queryText = `
      UPDATE tasks
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          parent_task_id = COALESCE($3, parent_task_id),
          assignee_id = COALESCE($4, assignee_id),
          due_date = COALESCE($5, due_date),
          priority = COALESCE($6, priority),
          status = COALESCE($7, status),
          updated_at = $8
      WHERE id = $9
      RETURNING *
    `;
    const result = await pool.query(queryText, [name, description, parent_task_id, assignee_id, due_date, priority, status, updated_at, task_id]);
    const updatedTask = result.rows[0];
    // Emit realtime task update event
    io.emit("task_update_event", updatedTask);
    res.json(updatedTask);
  } catch (error) {
    console.error("Error in update task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete Task Endpoint
/*
  Deletes a task.
  - Performs a deletion from the tasks table.
*/
app.delete("/api/tasks/:task_id", authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.params;
    await pool.query(`DELETE FROM tasks WHERE id = $1`, [task_id]);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error in delete task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Add Task Comment Endpoint
/*
  Adds a comment to a task.
  - Inserts a new record into the task_comments table.
  - Emits a realtime "comment_event" to notify clients.
*/
app.post("/api/tasks/:task_id/comments", authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.params;
    const { comment_text } = req.body;
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const queryText = `
      INSERT INTO task_comments (id, task_id, user_id, comment_text, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(queryText, [id, task_id, req.user.id, comment_text, created_at]);
    const comment = result.rows[0];
    // Emit realtime comment event
    io.emit("comment_event", comment);
    res.json(comment);
  } catch (error) {
    console.error("Error in add comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// File Attachment Upload Endpoint
/*
  Attaches a file to a task.
  - Uses multer middleware to handle file uploads.
  - Stores file on local storage and records metadata in task_attachments table.
*/
app.post("/api/tasks/:task_id/attachments", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const { task_id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const id = uuidv4();
    const user_id = req.user.id;
    const file_name = req.file.originalname;
    const file_type = path.extname(req.file.originalname).substring(1);
    const uploaded_at = new Date().toISOString();
    // Construct file URL to be served statically
    const file_url = `${req.protocol}://${req.get("host")}/storage/${req.file.filename}`;
    const queryText = `
      INSERT INTO task_attachments (id, task_id, user_id, file_name, file_url, file_type, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(queryText, [id, task_id, user_id, file_name, file_url, file_type, uploaded_at]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in upload attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// List Notifications Endpoint
/*
  Retrieves all notifications for the authenticated user.
*/
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const queryText = `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(queryText, [user_id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error in list notifications:", error);
    res.status(500).json({ error: "Failed to retrieve notifications" });
  }
});

// Mark Notification as Read Endpoint
/*
  Marks a specific notification as read by updating its read_status to 1.
*/
app.put("/api/notifications/:notification_id", authenticateToken, async (req, res) => {
  try {
    const { notification_id } = req.params;
    // Allow overriding read_status if provided; default to 1
    const read_status = req.body.read_status !== undefined ? req.body.read_status : 1;
    const queryText = `
      UPDATE notifications
      SET read_status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(queryText, [read_status, notification_id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in mark notification read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// ===== Serve Static Files and SPA Routing =====
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== Create HTTP Server and Initialize Socket.IO =====
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
});

// Socket.IO middleware for authentication using query parameter token
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    socket.user = decoded;
    // Join a room specific to the user's id for targeted events
    socket.join(decoded.id);
    next();
  });
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// ===== Start the Server =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});