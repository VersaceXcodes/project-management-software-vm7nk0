-- DROP EXISTING TABLES IN REVERSE DEPENDENCY ORDER
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS task_attachments CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- CREATE TABLES

CREATE TABLE users (
    id text PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    profile_picture_url text,
    role text NOT NULL,
    notification_settings json,
    created_at text NOT NULL,
    updated_at text NOT NULL
);

CREATE TABLE user_invitations (
    id text PRIMARY KEY,
    inviter_id text NOT NULL,
    invitee_email text NOT NULL,
    role text NOT NULL,
    status text NOT NULL,
    created_at text NOT NULL,
    FOREIGN KEY (inviter_id) REFERENCES users(id)
);

CREATE TABLE projects (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_date text NOT NULL,
    end_date text NOT NULL,
    archived integer NOT NULL DEFAULT 0,
    created_by text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE milestones (
    id text PRIMARY KEY,
    project_id text NOT NULL,
    title text NOT NULL,
    due_date text NOT NULL,
    description text,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE project_members (
    id text PRIMARY KEY,
    project_id text NOT NULL,
    user_id text NOT NULL,
    role text NOT NULL,
    joined_at text NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE tasks (
    id text PRIMARY KEY,
    project_id text NOT NULL,
    parent_task_id text,
    name text NOT NULL,
    description text,
    assignee_id text,
    due_date text NOT NULL,
    priority text NOT NULL,
    status text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE TABLE task_dependencies (
    id text PRIMARY KEY,
    task_id text NOT NULL,
    depends_on_task_id text NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
);

CREATE TABLE task_comments (
    id text PRIMARY KEY,
    task_id text NOT NULL,
    user_id text NOT NULL,
    comment_text text NOT NULL,
    created_at text NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE task_attachments (
    id text PRIMARY KEY,
    task_id text NOT NULL,
    user_id text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    uploaded_at text NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    related_project_id text,
    related_task_id text,
    read_status integer NOT NULL DEFAULT 0,
    created_at text NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_project_id) REFERENCES projects(id),
    FOREIGN KEY (related_task_id) REFERENCES tasks(id)
);

-- SEED DATA

-- Users
INSERT INTO users (id, first_name, last_name, email, password_hash, profile_picture_url, role, notification_settings, created_at, updated_at) VALUES
('1', 'Alice', 'Johnson', 'alice@example.com', 'hash1', 'https://picsum.photos/seed/alice/200/300', 'project_manager', '{"email": true}', '2023-01-01T00:00:00Z', '2023-01-01T00:00:00Z'),
('2', 'Bob', 'Smith', 'bob@example.com', 'hash2', 'https://picsum.photos/seed/bob/200/300', 'team_member', '{"sms": true}', '2023-01-02T00:00:00Z', '2023-01-02T00:00:00Z'),
('3', 'Charlie', 'Brown', 'charlie@example.com', 'hash3', 'https://picsum.photos/seed/charlie/200/300', 'team_member', '{"push": true}', '2023-01-03T00:00:00Z', '2023-01-03T00:00:00Z'),
('4', 'Dana', 'White', 'dana@example.com', 'hash4', 'https://picsum.photos/seed/dana/200/300', 'guest', NULL, '2023-01-04T00:00:00Z', '2023-01-04T00:00:00Z'),
('5', 'Eva', 'Green', 'eva@example.com', 'hash5', 'https://picsum.photos/seed/eva/200/300', 'team_member', '{"email": false}', '2023-01-05T00:00:00Z', '2023-01-05T00:00:00Z');

-- User Invitations
INSERT INTO user_invitations (id, inviter_id, invitee_email, role, status, created_at) VALUES
('1', '1', 'guest_invite@example.com', 'guest', 'pending', '2023-02-01T10:00:00Z'),
('2', '1', 'new_member@example.com', 'team_member', 'accepted', '2023-02-05T10:00:00Z');

-- Projects
INSERT INTO projects (id, title, description, start_date, end_date, archived, created_by, created_at, updated_at) VALUES
('1', 'Project Alpha', 'First project', '2023-03-01', '2023-06-01', 0, '1', '2023-03-01T09:00:00Z', '2023-05-01T10:00:00Z'),
('2', 'Project Beta', 'Second project', '2023-04-01', '2023-07-01', 0, '1', '2023-04-01T09:00:00Z', '2023-05-02T10:00:00Z');

-- Milestones
INSERT INTO milestones (id, project_id, title, due_date, description) VALUES
('1', '1', 'Design Phase', '2023-04-01', 'Complete initial designs'),
('2', '1', 'Development Phase', '2023-05-15', 'Develop main features'),
('3', '2', 'Beta Launch', '2023-06-15', 'Launch beta version');

-- Project Members
INSERT INTO project_members (id, project_id, user_id, role, joined_at) VALUES
('1', '1', '1', 'project_manager', '2023-03-01T09:00:00Z'),
('2', '1', '2', 'team_member', '2023-03-02T10:00:00Z'),
('3', '1', '3', 'team_member', '2023-03-03T11:00:00Z'),
('4', '2', '1', 'project_manager', '2023-04-01T09:00:00Z'),
('5', '2', '5', 'team_member', '2023-04-02T10:00:00Z');

-- Tasks
INSERT INTO tasks (id, project_id, parent_task_id, name, description, assignee_id, due_date, priority, status, created_at, updated_at) VALUES
('1', '1', NULL, 'Setup repository', 'Initialize the repo and set up CI/CD', '2', '2023-03-05', 'High', 'in_progress', '2023-03-01T10:00:00Z', '2023-03-02T12:00:00Z'),
('2', '1', '1', 'Configure CI', 'Set up and test CI pipeline', '3', '2023-03-06', 'Medium', 'not_started', '2023-03-01T11:00:00Z', '2023-03-01T11:00:00Z'),
('3', '2', NULL, 'Develop landing page', 'Create a responsive landing page', '5', '2023-04-10', 'High', 'in_progress', '2023-04-01T10:00:00Z', '2023-04-05T12:00:00Z'),
('4', '2', NULL, 'Set up analytics', 'Integrate Google Analytics', '2', '2023-04-15', 'Low', 'not_started', '2023-04-01T12:00:00Z', '2023-04-01T12:00:00Z');

-- Task Dependencies
INSERT INTO task_dependencies (id, task_id, depends_on_task_id) VALUES
('1', '2', '1'),
('2', '4', '3');

-- Task Comments
INSERT INTO task_comments (id, task_id, user_id, comment_text, created_at) VALUES
('1', '1', '2', 'Repository initialized', '2023-03-01T10:30:00Z'),
('2', '3', '5', 'Landing page draft completed', '2023-04-03T14:00:00Z');

-- Task Attachments
INSERT INTO task_attachments (id, task_id, user_id, file_name, file_url, file_type, uploaded_at) VALUES
('1', '3', '5', 'landing_page_sketch.png', 'https://picsum.photos/seed/landing_page/200/300', 'png', '2023-04-03T15:00:00Z'),
('2', '1', '2', 'repo_setup.docx', 'https://picsum.photos/seed/repo_setup/200/300', 'docx', '2023-03-01T11:00:00Z');

-- Notifications
INSERT INTO notifications (id, user_id, type, message, related_project_id, related_task_id, read_status, created_at) VALUES
('1', '2', 'task_assignment', 'You have been assigned a new task in Project Alpha', '1', '1', 0, '2023-03-01T10:00:00Z'),
('2', '5', 'status_update', 'Your task has been updated in Project Beta', '2', '3', 0, '2023-04-05T12:00:00Z'),
('3', '4', 'deadline_alert', 'Project Alpha deadline approaching', '1', NULL, 0, '2023-05-01T08:00:00Z');