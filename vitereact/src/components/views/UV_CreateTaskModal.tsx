import React, { useState, useEffect, FormEvent } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { useMatch } from "react-router-dom";

const UV_CreateTaskModal: React.FC = () => {
  // Global state from Redux
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const current_user = useSelector((state: RootState) => state.global.current_user);

  // Get the project_id from the current route using useMatch.
  const match = useMatch("/projects/:project_id*");
  const project_id = match?.params.project_id;

  // Local state for modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);

  // Local state for the task form data
  const [taskFormData, setTaskFormData] = useState({
    name: "",
    description: "",
    due_date: "",
    assignee_id: "",
    priority: "Medium",
    status: "not_started",
  });

  // Local state for validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Local state for submission status ("idle", "submitting", "success", "error")
  const [submissionStatus, setSubmissionStatus] = useState<string>("idle");

  // Local state for assignee options (simulate using current_user if available)
  const [assigneeOptions, setAssigneeOptions] = useState<Array<{ id: string; name: string }>>([]);

  // Initialize the assignee options when the component mounts or when current_user changes.
  useEffect(() => {
    // Here we simulate a minimal dropdown; in a real scenario you might fetch the full team members list.
    const options = [{ id: "", name: "Unassigned" }];
    if (current_user) {
      options.push({ id: current_user.id, name: `${current_user.first_name} ${current_user.last_name}` });
    }
    setAssigneeOptions(options);
  }, [current_user]);

  // Handle change for input fields using the "name" attribute to update taskFormData.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle form submission: validate and then call the backend API.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Clear previous errors.
    setValidationErrors({});
    // Basic validations: Task Name is required.
    const errors: Record<string, string> = {};
    if (!taskFormData.name.trim()) {
      errors.name = "Task name is required.";
    }
    // You can add additional validations (e.g., date format) if necessary.
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    if (!project_id) {
      setValidationErrors({ api: "Project identifier not found." });
      return;
    }
    setSubmissionStatus("submitting");
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/projects/${project_id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth_token}`,
        },
        body: JSON.stringify(taskFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setValidationErrors({ api: errorData.error || "Failed to create task." });
        setSubmissionStatus("error");
        return;
      }
      // Task created successfully.
      const createdTask = await response.json();
      setSubmissionStatus("success");
      // Optionally, you could clear the form data here.
      setTaskFormData({
        name: "",
        description: "",
        due_date: "",
        assignee_id: "",
        priority: "Medium",
        status: "not_started",
      });
      // Close the modal so that the parent UV_ProjectDetail handles the real-time update.
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error while creating task:", error);
      setValidationErrors({ api: "An unexpected error occurred." });
      setSubmissionStatus("error");
    }
  };

  // Cancel handler to close the modal without saving.
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // If the modal is not open, render nothing.
  if (!isModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-gray-900 opacity-50"></div>
        {/* Modal container */}
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 z-10">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Create New Task</h2>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Task Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={taskFormData.name}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              />
              {validationErrors.name && <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>}
            </div>
            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={taskFormData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              ></textarea>
            </div>
            {/* Due Date */}
            <div className="mb-4">
              <label htmlFor="due_date" className="block text-gray-700 font-medium mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={taskFormData.due_date}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            {/* Assignee Selection */}
            <div className="mb-4">
              <label htmlFor="assignee_id" className="block text-gray-700 font-medium mb-1">
                Assignee
              </label>
              <select
                id="assignee_id"
                name="assignee_id"
                value={taskFormData.assignee_id}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              >
                {assigneeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Priority */}
            <div className="mb-4">
              <label htmlFor="priority" className="block text-gray-700 font-medium mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={taskFormData.priority}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            {/* Status */}
            <div className="mb-4">
              <label htmlFor="status" className="block text-gray-700 font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={taskFormData.status}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            {/* API Error Message */}
            {validationErrors.api && (
              <div className="mb-4">
                <p className="text-red-500 text-sm">{validationErrors.api}</p>
              </div>
            )}
            {/* Submission Status */}
            {submissionStatus === "submitting" && (
              <div className="mb-4">
                <p className="text-blue-500 text-sm">Submitting...</p>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_CreateTaskModal;