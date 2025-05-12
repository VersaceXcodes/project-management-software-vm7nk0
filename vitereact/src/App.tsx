import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";

/* Import shared global views */
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import GV_Breadcrumbs from '@/components/views/GV_Breadcrumbs.tsx';
import GV_NotificationDropdown from '@/components/views/GV_NotificationDropdown.tsx';

/* Import unique views */
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_Registration from '@/components/views/UV_Registration.tsx';
import UV_Dashboard from '@/components/views/UV_Dashboard.tsx';
import UV_ProjectDetail from '@/components/views/UV_ProjectDetail.tsx';
import UV_TaskDetail from '@/components/views/UV_TaskDetail.tsx';
import UV_Profile from '@/components/views/UV_Profile.tsx';
import UV_GanttChart from '@/components/views/UV_GanttChart.tsx';

/* Import modal views */
import UV_CreateProjectModal from '@/components/views/UV_CreateProjectModal.tsx';
import UV_EditProjectModal from '@/components/views/UV_EditProjectModal.tsx';
import UV_CreateTaskModal from '@/components/views/UV_CreateTaskModal.tsx';
import UV_EditTaskModal from '@/components/views/UV_EditTaskModal.tsx';
import UV_InvitationModal from '@/components/views/UV_InvitationModal.tsx';
import UV_Onboarding from '@/components/views/UV_Onboarding.tsx';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.global.is_authenticated);

  // Decide whether to show breadcrumbs.
  // GV_Breadcrumbs is shared by ProjectDetail, TaskDetail, and Profile views.
  // For ProjectDetail and TaskDetail, the path starts with "/projects/"
  // but we do not show breadcrumbs on the Gantt Chart view ending with "/gantt".
  const showBreadcrumbs =
    location.pathname.startsWith("/profile") ||
    (location.pathname.startsWith("/projects/") && !location.pathname.endsWith("/gantt"));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar (will display differently if unauthenticated) */}
      <GV_TopNav />
      {/* Global Notification Dropdown */}
      <GV_NotificationDropdown />

      {/* Conditionally render Breadcrumbs for detailed views */}
      {showBreadcrumbs && <GV_Breadcrumbs />}

      {/* Main content container */}
      <div className="flex-grow">
        <Routes>
          {/* Default redirect: if user is authenticated, go to dashboard; otherwise, go to login */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
          />
          <Route path="/login" element={<UV_Login />} />
          <Route path="/register" element={<UV_Registration />} />
          <Route path="/dashboard" element={<UV_Dashboard />} />
          <Route path="/projects/:project_id" element={<UV_ProjectDetail />} />
          <Route path="/projects/:project_id/tasks/:task_id" element={<UV_TaskDetail />} />
          <Route path="/profile" element={<UV_Profile />} />
          <Route path="/projects/:project_id/gantt" element={<UV_GanttChart />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* Footer is always displayed */}
      <GV_Footer />

      {/* Render modal components only when authenticated */}
      {isAuthenticated && (
        <>
          <UV_CreateProjectModal />
          <UV_EditProjectModal />
          <UV_CreateTaskModal />
          <UV_EditTaskModal />
          <UV_InvitationModal />
          <UV_Onboarding />
        </>
      )}
    </div>
  );
};

export default App;