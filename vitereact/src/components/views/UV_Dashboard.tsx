import React, { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/main";

const UV_Dashboard: React.FC = () => {
  // Get global variables from redux store
  const { auth_token, global_search_query } = useSelector((state: RootState) => state.global);
  
  // useSearchParams for reading/updating URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  // Local state definitions
  const [project_list, setProjectList] = useState<any[]>([]);
  const [search_query, setSearchQuery] = useState<string>(initialSearch);

  // Effect: Sync local search_query with global search query if global changes
  useEffect(() => {
    if (global_search_query !== search_query) {
      setSearchQuery(global_search_query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global_search_query]);

  // Function: Fetch projects from the backend using GET /api/projects
  const fetchProjects = async () => {
    try {
      // Build endpoint using VITE_API_BASE_URL from environment variables
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      // Sending also a search parameter, even though backend officially supports "archived"
      const response = await axios.get(`${baseUrl}/api/projects`, {
        headers: { Authorization: `Bearer ${auth_token}` },
        params: { archived: 0, search: search_query }
      });
      setProjectList(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Effect: Fetch projects on mount, on search_query change, or if auth_token changes
  useEffect(() => {
    if (auth_token) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search_query, auth_token]);

  // Handle search input changes: update local state and URL parameters and re-fetch projects
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setSearchParams({ search: newQuery });
    // No need to call fetchProjects here explicitly because useEffect will catch the updated search_query
  };

  // Function to simulate the opening of the Create Project modal
  const openCreateProjectModal = () => {
    // In a real scenario, this would trigger showing the UV_CreateProjectModal.
    // For now, we just log a message.
    console.log("Create Project modal should be triggered here.");
    alert("Create Project modal triggered.");
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h1 className="text-3xl font-bold mb-4 sm:mb-0">Dashboard</h1>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search projects and tasks..."
              value={search_query}
              onChange={handleSearch}
              className="border border-gray-300 p-2 rounded mr-2 focus:outline-none focus:ring focus:border-blue-300"
            />
            <button
              onClick={openCreateProjectModal}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Create Project
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project_list.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block">
              <div className="bg-white rounded shadow p-4 hover:shadow-lg transition">
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-gray-600 mb-1">
                  Deadline: {new Date(project.end_date).toLocaleDateString()}
                </p>
                <p className="text-gray-600 mb-2">
                  Milestones: {project.milestones ? project.milestones.length : 0}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {project_list.length === 0 && (
          <div className="mt-8 text-center text-gray-500">
            No projects found.
          </div>
        )}
      </div>
    </>
  );
};

export default UV_Dashboard;