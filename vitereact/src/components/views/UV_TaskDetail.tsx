import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/main";

const UV_TaskDetail: React.FC = () => {
  const { project_id, task_id } = useParams<{ project_id: string; task_id: string }>();
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const socket_instance = useSelector((state: RootState) => state.global.socket_instance);
  const dispatch = useDispatch();

  const [taskData, setTaskData] = useState<any>({});
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [attachmentList, setAttachmentList] = useState<any[]>([]);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTaskData, setEditTaskData] = useState<any>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");

  // Function to fetch task details and subtasks from the project tasks endpoint
  const fetchTaskDetails = async () => {
    if (!project_id || !task_id) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/projects/${project_id}/tasks`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const tasks = await response.json();
      // Find the main task by matching task_id
      const mainTask = tasks.find((task: any) => task.id === task_id);
      if (!mainTask) throw new Error("Task not found");
      // Subtasks are tasks whose parent_task_id equals the current task_id
      const filteredSubtasks = tasks.filter((task: any) => task.parent_task_id === task_id);
      setTaskData(mainTask);
      setSubtasks(filteredSubtasks);
      setAttachmentList(mainTask.attachment_list || []);
      setCommentList(mainTask.comment_list || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch task details whenever project_id, task_id or auth_token changes
  useEffect(() => {
    if (project_id && task_id && auth_token) {
      fetchTaskDetails();
    }
  }, [project_id, task_id, auth_token]);

  // Subscribe to realtime events for task updates and comments
  useEffect(() => {
    if (!socket_instance) return;
    const handleTaskUpdate = (data: any) => {
      if (data.id === task_id) {
        setTaskData(data);
      }
    };
    const handleCommentEvent = (data: any) => {
      if (data.task_id === task_id) {
        setCommentList((prev: any[]) => [...prev, data]);
      }
    };
    socket_instance.on("task_update_event", handleTaskUpdate);
    socket_instance.on("comment_event", handleCommentEvent);
    return () => {
      socket_instance.off("task_update_event", handleTaskUpdate);
      socket_instance.off("comment_event", handleCommentEvent);
    };
  }, [socket_instance, task_id]);

  // Update task status handler using PUT /api/tasks/{task_id}
  const handleStatusChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error("Failed to update task status");
      const updatedTask = await response.json();
      setTaskData(updatedTask);
    } catch (err) {
      console.error(err);
    }
  };

  // Comment submission: POST /api/tasks/{task_id}/comments
  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (commentText.trim() === "") return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task_id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`,
          },
          body: JSON.stringify({ comment_text: commentText }),
        }
      );
      if (!response.ok) throw new Error("Failed to add comment");
      const newComment = await response.json();
      setCommentList((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  // File upload: POST /api/tasks/{task_id}/attachments
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task_id}/attachments`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${auth_token}`,
            },
            body: formData,
          }
        );
        if (!response.ok) throw new Error("File upload failed");
        const newAttachment = await response.json();
        setAttachmentList((prev) => [...prev, newAttachment]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Attachment removal (simulate DELETE endpoint)
  const handleRemoveAttachment = async (attachment_id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task_id}/attachments/${attachment_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${auth_token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to remove attachment");
      setAttachmentList((prev) => prev.filter((att) => att.id !== attachment_id));
    } catch (err) {
      console.error(err);
    }
  };

  // Open the edit modal and prefill with current task data
  const handleOpenEditModal = () => {
    setEditTaskData({ ...taskData });
    setShowEditModal(true);
  };

  // Handle changes inside the edit modal
  const handleEditModalChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditTaskData({
      ...editTaskData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit the edit modal form to update task details
  const handleEditModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`,
          },
          body: JSON.stringify(editTaskData),
        }
      );
      if (!response.ok) throw new Error("Failed to update task");
      const updatedTask = await response.json();
      setTaskData(updatedTask);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
  };

  // Comment editing
  const handleEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.comment_text);
  };

  const handleEditCommentSubmit = async (comment_id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task_id}/comments/${comment_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`,
          },
          body: JSON.stringify({ comment_text: editedCommentText }),
        }
      );
      if (!response.ok) throw new Error("Failed to update comment");
      const updatedComment = await response.json();
      setCommentList((prev) =>
        prev.map((c) => (c.id === comment_id ? updatedComment : c))
      );
      setEditingCommentId(null);
      setEditedCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  // Comment deletion (simulate DELETE endpoint)
  const handleDeleteComment = async (comment_id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task_id}/comments/${comment_id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${auth_token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete comment");
      setCommentList((prev) => prev.filter((c) => c.id !== comment_id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="p-4">Loading...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Task Detail</h1>
            <button
              onClick={handleOpenEditModal}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
          </div>
          <div className="mt-4">
            <p>
              <strong>Name:</strong> {taskData.name}
            </p>
            <p>
              <strong>Description:</strong> {taskData.description}
            </p>
            <p>
              <strong>Due Date:</strong> {taskData.due_date}
            </p>
            <p>
              <strong>Priority:</strong> {taskData.priority}
            </p>
            <p>
              <strong>Status:</strong> {taskData.status}
            </p>
            <div className="mt-2">
              <label className="mr-2 font-semibold">Update Status:</label>
              <select
                value={taskData.status}
                onChange={handleStatusChange}
                className="border rounded p-1"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Subtasks</h2>
            {subtasks.length === 0 ? (
              <p>No subtasks.</p>
            ) : (
              <ul>
                {subtasks.map((subtask) => (
                  <li key={subtask.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={subtask.status === "completed"}
                      readOnly
                      className="mr-2"
                    />
                    <span>{subtask.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Attachments</h2>
            <div className="mb-2">
              <input
                type="file"
                onChange={handleFileChange}
                className="border p-1"
              />
            </div>
            {attachmentList.length === 0 ? (
              <p>No attachments.</p>
            ) : (
              <ul>
                {attachmentList.map((att) => (
                  <li key={att.id} className="flex items-center mb-1">
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {att.file_name}
                    </a>
                    <button
                      className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => handleRemoveAttachment(att.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Comments</h2>
            {commentList.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              <ul>
                {commentList.map((comment) => (
                  <li key={comment.id} className="mb-2 border p-2 rounded">
                    {editingCommentId === comment.id ? (
                      <div>
                        <textarea
                          className="w-full border rounded p-1"
                          value={editedCommentText}
                          onChange={(e) => setEditedCommentText(e.target.value)}
                        ></textarea>
                        <div className="mt-1">
                          <button
                            className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                            onClick={() => handleEditCommentSubmit(comment.id)}
                          >
                            Save
                          </button>
                          <button
                            className="bg-gray-500 text-white px-2 py-1 rounded"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p>{comment.comment_text}</p>
                        <small className="text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </small>
                        <div>
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                            onClick={() => handleEditComment(comment)}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleCommentSubmit} className="mt-4">
              <textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full border rounded p-2"
              ></textarea>
              <button
                type="submit"
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Submit Comment
              </button>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 md:w-1/2">
            <h2 className="text-xl font-bold mb-4">Edit Task</h2>
            <form onSubmit={handleEditModalSubmit}>
              <div className="mb-2">
                <label className="block font-semibold">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editTaskData.name || ""}
                  onChange={handleEditModalChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold">Description:</label>
                <textarea
                  name="description"
                  value={editTaskData.description || ""}
                  onChange={handleEditModalChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold">Due Date:</label>
                <input
                  type="date"
                  name="due_date"
                  value={editTaskData.due_date ? editTaskData.due_date.substring(0, 10) : ""}
                  onChange={handleEditModalChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold">Priority:</label>
                <select
                  name="priority"
                  value={editTaskData.priority || "Medium"}
                  onChange={handleEditModalChange}
                  className="w-full border rounded p-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block font-semibold">Status:</label>
                <select
                  name="status"
                  value={editTaskData.status || "not_started"}
                  onChange={handleEditModalChange}
                  className="w-full border rounded p-2"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={handleEditModalClose}
                >
                  Cancel
                </button>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_TaskDetail;