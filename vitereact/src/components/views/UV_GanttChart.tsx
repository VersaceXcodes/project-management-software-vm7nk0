import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";

const UV_GanttChart: React.FC = () => {
  // Get the project_id from URL slugs
  const { project_id } = useParams<{ project_id: string }>();
  // Access the auth_token from the global Redux store
  const auth_token = useSelector((state: RootState) => state.global.auth_token);

  // Local state for gantt_data and zoom_level
  const [ganttData, setGanttData] = useState<{
    tasks: any[];
    milestones: any[];
    dependencies: any[];
  }>({ tasks: [], milestones: [], dependencies: [] });
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Function to fetch Gantt data from the backend
  const fetchGanttData = async () => {
    if (!project_id) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    try {
      // Attempt to call the Gantt chart endpoint
      const res = await fetch(`${apiBase}/api/projects/${project_id}/gantt`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth_token}`
        }
      });
      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        // Fallback: call the project detail endpoint
        const fallbackRes = await fetch(`${apiBase}/api/projects/${project_id}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
          }
        });
        const projectData = await fallbackRes.json();
        // Transform data to match gantt_data structure
        data = {
          tasks: projectData.tasks ? projectData.tasks : [],
          milestones: projectData.milestones ? projectData.milestones : [],
          dependencies: [] // No dependency data available in fallback
        };
      }
      setGanttData(data);
    } catch (error) {
      console.error("Error fetching Gantt data:", error);
    }
  };

  // Function to handle zoom level change based on user input
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zoom = parseFloat(e.target.value);
    setZoomLevel(zoom);
  };

  // Function to handle clicks on a task bar to show detailed task information
  const handleTaskClick = (task: any) => {
    alert(`Task clicked: ${task.name}`);
  };

  // Fetch data on view load or when project_id/auth_token changes
  useEffect(() => {
    fetchGanttData();
  }, [project_id, auth_token]);

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Gantt Chart</h1>
        <div className="mb-4">
          <label htmlFor="zoom" className="mr-2 font-semibold">
            Zoom: {zoomLevel}
          </label>
          <input
            type="range"
            id="zoom"
            name="zoom"
            min="0.5"
            max="3"
            step="0.1"
            value={zoomLevel}
            onChange={handleZoomChange}
            className="w-64"
          />
        </div>
        <div className="border rounded p-4 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-2">Tasks</h2>
          <div className="space-y-2">
            {ganttData.tasks && ganttData.tasks.length > 0 ? (
              ganttData.tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="bg-blue-500 text-white p-2 rounded cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="font-bold">{task.name}</div>
                  <div className="text-sm">Start: {task.created_at}</div>
                  <div className="text-sm">Due: {task.due_date}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No tasks available.</div>
            )}
          </div>
        </div>
        <div className="border rounded p-4 mt-4 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-2">Milestones</h2>
          <div className="space-y-2">
            {ganttData.milestones && ganttData.milestones.length > 0 ? (
              ganttData.milestones.map((ms: any) => (
                <div key={ms.id} className="bg-green-500 text-white p-2 rounded">
                  <div className="font-bold">{ms.title}</div>
                  <div className="text-sm">Due: {ms.due_date}</div>
                  {ms.description && <div className="text-sm">{ms.description}</div>}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No milestones available.</div>
            )}
          </div>
        </div>
        {ganttData.dependencies && ganttData.dependencies.length > 0 && (
          <div className="border rounded p-4 mt-4 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-2">Dependencies</h2>
            <div className="space-y-2">
              {ganttData.dependencies.map((dep: any, index: number) => (
                <div key={index} className="bg-yellow-500 text-white p-2 rounded">
                  <div className="font-bold">Dependency {index + 1}</div>
                  <div className="text-sm">{JSON.stringify(dep)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_GanttChart;