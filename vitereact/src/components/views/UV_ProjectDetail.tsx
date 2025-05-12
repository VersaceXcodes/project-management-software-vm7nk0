import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { RootState, set_breadcrumb_path } from "@/store/main";

const UV_ProjectDetail: React.FC = () => {
  // Get project_id from URL params
  const { project_id } = useParams<{ project_id: string }>();
  const dispatch = useDispatch();

  // Get auth token from global state for API authentication
  const auth_token = useSelector((state: RootState) => state.global.auth_token);

  // Local state variables
  const [project_data, setProjectData] = useState<any>({});
  const [task_list, setTaskList] = useState<any[]>([]);
  const [team_member_list, setTeamMemberList] = useState<any[]>([]);
  const [display_mode, setDisplayMode] = useState<"list" | "kanban">("list");
  const [loading, setLoading] = useState<boolean>(true);

  // Base URL from environment variable
  const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Function to fetch project details and tasks from the backend
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      // Fetch project details
      const projectRes = await axios.get(`${base_url}/api/projects/${project_id}`, {
        headers: { Authorization: `Bearer ${auth_token}` },
      });
      const project = projectRes.data;
      setProjectData(project);

      // Optionally, set team member list if available; here defaulting to empty array.
      setTeamMemberList(project.team_member_list || []);

      // Fetch tasks associated with the project
      const tasksRes = await axios.get(`${base_url}/api/projects/${project_id}/tasks`, {
        headers: { Authorization: `Bearer ${auth_token}` },
      });
      setTaskList(tasksRes.data);

      // Update breadcrumb path in the global state
      dispatch(
        set_breadcrumb_path([
          { name: "Dashboard", url: "/dashboard" },
          { name: project.title || "Project Detail", url: `/projects/${project_id}` },
        ])
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching project details:", error);
      setLoading(false);
    }
  };

  // Load project details on component mount or when project_id/auth_token changes
  useEffect(() => {
    if (project_id && auth_token) {
      fetchProjectDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project_id, auth_token]);

  // Functions to trigger modal views via CustomEvents
  const openEditProjectModal = () => {
    window.dispatchEvent(new CustomEvent("open_edit_project_modal", { detail: { project: project_data } }));
  };

  const openCreateTaskModal = () => {
    window.dispatchEvent(new CustomEvent("open_create_task_modal", { detail: { project_id } }));
  };

  const openInvitationModal = () => {
    window.dispatchEvent(new CustomEvent("open_invitation_modal", { detail: { project_id } }));
  };

  // For Kanban view: group tasks by status
  const statusColumns = ["not_started", "in_progress", "blocked", "completed"];
  const statusLabels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    blocked: "Blocked",
    completed: "Completed",
  };
  const tasksByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = task_list.filter((task) => task.status === status);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      {loading ? (
        <div className="p-4 text-center">
          <p>Loading project details...</p>
        </div>
      ) : (
        <div className="p-4">
          {/* Project Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{project_data.title}</h1>
              <p className="text-gray-600">{project_data.description}</p>
              <p className="text-sm text-gray-500">
                Start Date: {project_data.start_date} | End Date: {project_data.end_date}
              </p>
              {project_data.milestones && project_data.milestones.length > 0 && (
                <div className="mt-2">
                  <h2 className="text-xl font-semibold">Milestones</h2>
                  <ul className="list-disc list-inside">
                    {project_data.milestones.map((ms: any) => (
                      <li key={ms.id}>
                        <span className="font-medium">{ms.title}</span> - due: {ms.due_date}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={openEditProjectModal}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit Project
              </button>
              <button
                onClick={openCreateTaskModal}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Task
              </button>
              <button
                onClick={openInvitationModal}
                className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Invite Team Member
              </button>
            </div>
          </div>

          {/* Display Mode Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setDisplayMode(display_mode === "list" ? "kanban" : "list")}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Switch to {display_mode === "list" ? "Kanban" : "List"} View
            </button>
          </div>

          {/* Task Display */}
          {display_mode === "list" ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Task List</h2>
              {task_list.length === 0 ? (
                <p>No tasks available.</p>
              ) : (
                <ul className="space-y-2">
                  {task_list.map((task) => (
                    <li key={task.id} className="p-2 border rounded hover:bg-gray-100">
                      <Link
                        to={`/projects/${project_id}/tasks/${task.id}`}
                        className="text-lg font-medium text-blue-600 hover:underline"
                      >
                        {task.name}
                      </Link>
                      <p className="text-sm text-gray-600">
                        Due: {task.due_date} | Priority: {task.priority} | Status: {statusLabels[task.status]}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {statusColumns.map((status) => (
                <div key={status} className="bg-gray-100 p-2 rounded">
                  <h3 className="font-semibold mb-2">{statusLabels[status]}</h3>
                  {tasksByStatus[status] && tasksByStatus[status].length > 0 ? (
                    <ul className="space-y-2">
                      {tasksByStatus[status].map((task) => (
                        <li key={task.id} className="p-2 border rounded hover:bg-gray-200">
                          <Link
                            to={`/projects/${project_id}/tasks/${task.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {task.name}
                          </Link>
                          <p className="text-xs text-gray-500">Due: {task.due_date}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No tasks.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Team Member Section */}
          <div className="mt-4">
            <h2 className="text-xl font-semibold">Team Members</h2>
            {team_member_list.length === 0 ? (
              <p>No team members assigned.</p>
            ) : (
              <ul className="list-disc list-inside">
                {team_member_list.map((member: any) => (
                  <li key={member.id}>
                    {member.first_name} {member.last_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UV_ProjectDetail;