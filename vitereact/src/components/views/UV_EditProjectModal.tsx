import React, { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { RootState } from "@/store/main";

interface Milestone {
  title: string;
  due_date: string;
  description: string;
}

interface ProjectFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  milestones: Milestone[];
}

const UV_EditProjectModal: React.FC = () => {
  // Get project_id from route parameters
  const { project_id } = useParams<{ project_id: string }>();
  // Retrieve the auth_token from global state
  const auth_token = useSelector((state: RootState) => state.global.auth_token);

  // Local state to control modal visibility.
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Local state for the project form data.
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    milestones: [],
  });

  // Local state for inline validation error messages.
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Local state to indicate submission status.
  const [submissionStatus, setSubmissionStatus] = useState<string>("idle");

  // Get the API base url from environment variables
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Effect to fetch project details when modal opens and project_id is available.
  useEffect(() => {
    if (isModalOpen && project_id && !projectFormData.title) {
      axios
        .get(`${apiBaseUrl}/api/projects?archived=0`, {
          headers: {
            Authorization: `Bearer ${auth_token}`,
          },
        })
        .then((response) => {
          const projects = response.data;
          const project = projects.find((p: any) => p.id === project_id);
          if (project) {
            setProjectFormData({
              title: project.title,
              description: project.description || "",
              start_date: project.start_date,
              end_date: project.end_date,
              milestones: project.milestones || [],
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching project details:", error);
          setValidationErrors({ api: "Failed to fetch project details." });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, project_id, auth_token]);

  // Function to handle form submission for updating the project.
  const submitProjectUpdate = (e: FormEvent) => {
    e.preventDefault();
    let errors: Record<string, string> = {};

    // Basic validations for required fields.
    if (!projectFormData.title.trim()) {
      errors.title = "Title is required.";
    }
    if (!projectFormData.start_date) {
      errors.start_date = "Start date is required.";
    }
    if (!projectFormData.end_date) {
      errors.end_date = "End date is required.";
    }
    if (projectFormData.start_date && projectFormData.end_date) {
      if (new Date(projectFormData.start_date) > new Date(projectFormData.end_date)) {
        errors.date = "Start date must be before end date.";
      }
    }
    // Validate milestones: ensure each milestone has a title.
    projectFormData.milestones.forEach((ms, index) => {
      if (!ms.title.trim()) {
        errors[`milestone_${index}`] = "Milestone title is required.";
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSubmissionStatus("submitting");

    axios
      .put(
        `${apiBaseUrl}/api/projects/${project_id}`,
        {
          title: projectFormData.title,
          description: projectFormData.description,
          start_date: projectFormData.start_date,
          end_date: projectFormData.end_date,
          milestones: projectFormData.milestones,
        },
        {
          headers: {
            Authorization: `Bearer ${auth_token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        setSubmissionStatus("success");
        alert("Project updated successfully.");
        setIsModalOpen(false);
        // Immediately refresh the view to reflect changes in UV_ProjectDetail and UV_Dashboard.
        window.location.reload();
      })
      .catch((error) => {
        setSubmissionStatus("error");
        const apiError = error.response?.data?.error || "Failed to update project.";
        setValidationErrors({ api: apiError });
      });
  };

  return (
    <>
      {/* A button to launch the Edit Project Modal */}
      {!isModalOpen && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="m-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Open Edit Project Modal
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            <form onSubmit={submitProjectUpdate}>
              {/* Title Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={projectFormData.title}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, title: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-sm">{validationErrors.title}</p>
                )}
              </div>
              {/* Description Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, description: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
              </div>
              {/* Start Date Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={projectFormData.start_date}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, start_date: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                {validationErrors.start_date && (
                  <p className="text-red-500 text-sm">{validationErrors.start_date}</p>
                )}
              </div>
              {/* End Date Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={projectFormData.end_date}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, end_date: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded p-2"
                />
                {validationErrors.end_date && (
                  <p className="text-red-500 text-sm">{validationErrors.end_date}</p>
                )}
              </div>
              {/* Milestones Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Milestones</label>
                {projectFormData.milestones.map((ms, index) => (
                  <div key={index} className="border border-gray-200 p-2 rounded mb-2">
                    <div className="mb-2">
                      <label className="text-sm font-medium">Title</label>
                      <input
                        type="text"
                        value={ms.title}
                        onChange={(e) => {
                          const updatedMilestones = [...projectFormData.milestones];
                          updatedMilestones[index].title = e.target.value;
                          setProjectFormData({ ...projectFormData, milestones: updatedMilestones });
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                      />
                      {validationErrors[`milestone_${index}`] && (
                        <p className="text-red-500 text-sm">
                          {validationErrors[`milestone_${index}`]}
                        </p>
                      )}
                    </div>
                    <div className="mb-2">
                      <label className="text-sm font-medium">Due Date</label>
                      <input
                        type="date"
                        value={ms.due_date}
                        onChange={(e) => {
                          const updatedMilestones = [...projectFormData.milestones];
                          updatedMilestones[index].due_date = e.target.value;
                          setProjectFormData({ ...projectFormData, milestones: updatedMilestones });
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={ms.description}
                        onChange={(e) => {
                          const updatedMilestones = [...projectFormData.milestones];
                          updatedMilestones[index].description = e.target.value;
                          setProjectFormData({ ...projectFormData, milestones: updatedMilestones });
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedMilestones = projectFormData.milestones.filter((_, i) => i !== index);
                        setProjectFormData({ ...projectFormData, milestones: updatedMilestones });
                      }}
                      className="text-red-500 text-sm"
                    >
                      Remove Milestone
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setProjectFormData({
                      ...projectFormData,
                      milestones: [
                        ...projectFormData.milestones,
                        { title: "", due_date: "", description: "" },
                      ],
                    })
                  }
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Add Milestone
                </button>
              </div>
              {validationErrors.date && (
                <p className="text-red-500 text-sm mb-4">{validationErrors.date}</p>
              )}
              {validationErrors.api && (
                <p className="text-red-500 text-sm mb-4">{validationErrors.api}</p>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionStatus === "submitting"}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  {submissionStatus === "submitting" ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_EditProjectModal;