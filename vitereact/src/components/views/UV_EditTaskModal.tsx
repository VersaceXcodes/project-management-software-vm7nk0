import React, { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";

const UV_EditTaskModal: React.FC = () => {
  const { task_id, project_id } = useParams<{ task_id: string; project_id: string }>();
  const auth_token = useSelector((state: RootState) => state.global.auth_token);

  // Local state to control modal visibility
  const [showModal, setShowModal] = useState(true);
  // Loading state and possible error for fetching task data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the task form data; pre-filled with task data once fetched
  const [taskFormData, setTaskFormData] = useState({
    task_id: "",
    name: "",
    description: "",
    due_date: "",
    assignee_id: "",
    priority: "Medium",
    status: "not_started",
    subtasks: [] as { id: string; name: string; completed: boolean }[],
  });

  // State for inline validation error messages
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    due_date: "",
    assignee_id: "",
    priority: "",
  });

  // On mount, fetch the task details from the backend using project_id and task_id.
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/projects/${project_id}/tasks`, {
          headers: { "Authorization": `Bearer ${auth_token}` },
        });
        if (!res.ok) {
          throw new Error("Error fetching tasks");
        }
        const tasks = await res.json();
        const task = tasks.find((t: any) => t.id === task_id);
        if (task) {
          // Format due_date for datetime-local input (YYYY-MM-DDTHH:MM)
          const dueDateFormatted = task.due_date ? task.due_date.substring(0, 16) : "";
          setTaskFormData({
            task_id: task.id,
            name: task.name || "",
            description: task.description || "",
            due_date: dueDateFormatted,
            assignee_id: task.assignee_id || "",
            priority: task.priority || "Medium",
            status: task.status || "not_started",
            subtasks: task.subtasks || [],
          });
          setLoading(false);
        } else {
          setError("Task not found");
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load task data");
        setLoading(false);
      }
    };
    if (auth_token && project_id && task_id) {
      fetchTaskData();
    }
  }, [auth_token, project_id, task_id]);

  // Handle changes for simple input fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for the changed field
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle changes for subtasks (text and checkbox)
  const handleSubtaskChange = (index: number, field: string, value: any) => {
    const newSubtasks = [...taskFormData.subtasks];
    (newSubtasks[index] as any)[field] = value;
    setTaskFormData((prev) => ({ ...prev, subtasks: newSubtasks }));
  };

  // Add a new subtask entry
  const addSubtask = () => {
    const newSubtask = { id: Date.now().toString(), name: "", completed: false };
    setTaskFormData((prev) => ({ ...prev, subtasks: [...prev.subtasks, newSubtask] }));
  };

  // Remove a subtask entry by index
  const removeSubtask = (index: number) => {
    const newSubtasks = [...taskFormData.subtasks];
    newSubtasks.splice(index, 1);
    setTaskFormData((prev) => ({ ...prev, subtasks: newSubtasks }));
  };

  // Validate mandatory fields before submitting the form
  const validateForm = () => {
    let errors = { name: "", due_date: "", assignee_id: "", priority: "" };
    let isValid = true;
    if (!taskFormData.name) {
      errors.name = "Task name is required";
      isValid = false;
    }
    if (!taskFormData.due_date) {
      errors.due_date = "Due date is required";
      isValid = false;
    }
    if (!taskFormData.assignee_id) {
      errors.assignee_id = "Assignee is required";
      isValid = false;
    }
    if (!taskFormData.priority) {
      errors.priority = "Priority is required";
      isValid = false;
    }
    setValidationErrors(errors);
    return isValid;
  };

  // Handle form submission: call backend to update task details
  const submitEditTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/tasks/${taskFormData.task_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth_token}`,
        },
        body: JSON.stringify(taskFormData),
      });
      if (!res.ok) {
        throw new Error("Failed to update task");
      }
      // If successful, close the modal (changes will reflect via realtime update)
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Error updating task");
    }
  };

  // Cancel editing and simply close the modal without saving changes
  const cancelEditTask = () => {
    setShowModal(false);
  };

  // If the modal is closed, do not render anything.
  if (!showModal) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Task</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <form onSubmit={submitEditTask}>
              <div className="mb-4">
                <label className="block text-gray-700">Task Name</label>
                <input
                  type="text"
                  name="name"
                  value={taskFormData.name}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm">{validationErrors.name}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={taskFormData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Due Date</label>
                <input
                  type="datetime-local"
                  name="due_date"
                  value={taskFormData.due_date}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                />
                {validationErrors.due_date && (
                  <p className="text-red-500 text-sm">{validationErrors.due_date}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Assignee ID</label>
                <input
                  type="text"
                  name="assignee_id"
                  value={taskFormData.assignee_id}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                />
                {validationErrors.assignee_id && (
                  <p className="text-red-500 text-sm">{validationErrors.assignee_id}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Priority</label>
                <select
                  name="priority"
                  value={taskFormData.priority}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                {validationErrors.priority && (
                  <p className="text-red-500 text-sm">{validationErrors.priority}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Status</label>
                <select
                  name="status"
                  value={taskFormData.status}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Subtasks</label>
                {taskFormData.subtasks.map((subtask, index) => (
                  <div key={subtask.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={(e) =>
                        handleSubtaskChange(index, "completed", e.target.checked)
                      }
                      className="mr-2"
                    />
                    <input
                      type="text"
                      value={subtask.name}
                      onChange={(e) =>
                        handleSubtaskChange(index, "name", e.target.value)
                      }
                      className="flex-grow border rounded px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="ml-2 text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSubtask} className="text-blue-500">
                  Add Subtask
                </button>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={cancelEditTask}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_EditTaskModal;