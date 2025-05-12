import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";

const UV_CreateProjectModal: React.FC = () => {
  const auth_token = useSelector((state: RootState) => state.global.auth_token);

  // Local state for modal visibility
  const [showModal, setShowModal] = useState(true);

  // Local state for form data
  const [projectFormData, setProjectFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    milestones: [] as { title: string; due_date: string; description: string }[],
  });

  // Local state for validation errors and submission status
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState("idle");

  // Handle input changes for project fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProjectFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle changes in milestone fields
  const handleMilestoneChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedMilestones = [...projectFormData.milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setProjectFormData((prev) => ({ ...prev, milestones: updatedMilestones }));
  };

  // Add a new empty milestone entry
  const addMilestone = () => {
    setProjectFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: "", due_date: "", description: "" },
      ],
    }));
  };

  // Remove a milestone entry by index
  const removeMilestone = (index: number) => {
    const updatedMilestones = projectFormData.milestones.filter(
      (_, i) => i !== index
    );
    setProjectFormData((prev) => ({ ...prev, milestones: updatedMilestones }));
  };

  // Validate the form inputs and set validation errors if any
  const validateForm = () => {
    let errors: Record<string, string> = {};
    if (!projectFormData.title.trim()) {
      errors.title = "Project title is required";
    }
    if (!projectFormData.start_date) {
      errors.start_date = "Start date is required";
    }
    if (!projectFormData.end_date) {
      errors.end_date = "End date is required";
    }
    if (
      projectFormData.start_date &&
      projectFormData.end_date &&
      projectFormData.start_date > projectFormData.end_date
    ) {
      errors.date_order = "Start date cannot be later than end date";
    }
    // Validate each milestone entry
    projectFormData.milestones.forEach((ms, idx) => {
      if (!ms.title.trim()) {
        errors[`milestone_title_${idx}`] = "Milestone title is required";
      }
      if (!ms.due_date) {
        errors[`milestone_due_date_${idx}`] = "Milestone due date is required";
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission to create a new project
  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSubmissionStatus("submitting");
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post(
        `${apiBase}/api/projects`,
        projectFormData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth_token,
          },
        }
      );
      // On successful creation, set submission status and close the modal after a short delay
      setSubmissionStatus("success");
      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    } catch (error: any) {
      console.error("Error in project creation:", error);
      setSubmissionStatus("error");
      setValidationErrors({
        submit: "Failed to create project. Please try again.",
      });
    }
  };

  // Cancel action to simply close the modal
  const cancel = () => {
    setShowModal(false);
  };

  if (!showModal) {
    return <></>;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6">
          <h2 className="text-2xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={submitProject} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block font-medium text-gray-700"
              >
                Project Title{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={projectFormData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {validationErrors.title && (
                <p className="text-red-500 text-sm">{validationErrors.title}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="description"
                className="block font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={projectFormData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start_date"
                  className="block font-medium text-gray-700"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={projectFormData.start_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {validationErrors.start_date && (
                  <p className="text-red-500 text-sm">
                    {validationErrors.start_date}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="end_date"
                  className="block font-medium text-gray-700"
                >
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={projectFormData.end_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {validationErrors.end_date && (
                  <p className="text-red-500 text-sm">
                    {validationErrors.end_date}
                  </p>
                )}
              </div>
            </div>
            {validationErrors.date_order && (
              <p className="text-red-500 text-sm">{validationErrors.date_order}</p>
            )}
            <div>
              <h3 className="text-xl font-semibold mt-4">Milestones</h3>
              {projectFormData.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="border p-3 rounded-md mt-2"
                >
                  <div>
                    <label className="block font-medium text-gray-700">
                      Milestone Title{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) =>
                        handleMilestoneChange(index, "title", e.target.value)
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {validationErrors[`milestone_title_${index}`] && (
                      <p className="text-red-500 text-sm">
                        {validationErrors[`milestone_title_${index}`]}
                      </p>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block font-medium text-gray-700">
                      Due Date{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={milestone.due_date}
                      onChange={(e) =>
                        handleMilestoneChange(index, "due_date", e.target.value)
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {validationErrors[`milestone_due_date_${index}`] && (
                      <p className="text-red-500 text-sm">
                        {validationErrors[`milestone_due_date_${index}`]}
                      </p>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) =>
                        handleMilestoneChange(index, "description", e.target.value)
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={addMilestone}
                  className="bg-green-500 text-white px-3 py-1 rounded-md"
                >
                  Add Milestone
                </button>
              </div>
            </div>
            {validationErrors.submit && (
              <p className="text-red-500 text-sm">{validationErrors.submit}</p>
            )}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={cancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submissionStatus === "submitting"}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                {submissionStatus === "submitting" ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_CreateProjectModal;