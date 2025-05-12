import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { RootState, set_global_search_query, set_active_nav_item } from "@/store/main";

const GV_TopNav: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Global state selections
  const { 
    is_authenticated, 
    global_search_query, 
    active_nav_item, 
    current_user, 
    unread_notification_count, 
    notification_list 
  } = useSelector((state: RootState) => state.global);

  // Local component state
  const [searchInput, setSearchInput] = useState<string>(global_search_query);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Handle clicking the logo: navigate to Dashboard and update active nav item.
  const handleLogoClick = () => {
    dispatch(set_active_nav_item("dashboard"));
    navigate("/dashboard");
  };

  // Handle navigation link clicks and update active nav item accordingly.
  const handleNavLinkClick = (navItem: string) => {
    dispatch(set_active_nav_item(navItem));
    if (navItem === "dashboard") {
      navigate("/dashboard");
    } else if (navItem === "projects") {
      // Assuming projects view routing to dashboard with projects filter.
      navigate("/dashboard?view=projects");
    } else if (navItem === "tasks") {
      // Assuming tasks view routing to dashboard with tasks filter.
      navigate("/dashboard?view=tasks");
    }
  };

  // Update search input local state and dispatch global search query update.
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    dispatch(set_global_search_query(e.target.value));
  };

  // Toggle the display of the notifications dropdown.
  const toggleNotificationDropdown = () => {
    setShowNotifications(!showNotifications);
  };

  // Navigate to the profile page when profile icon is clicked.
  const handleProfileIconClick = () => {
    navigate("/profile");
  };

  // Handle clicking on a notification item: navigate to the relevant project/task detail.
  const handleNotificationClick = (notif: {
    id: string;
    related_project_id?: string;
    related_task_id?: string;
    created_at: string;
    message: string;
  }) => {
    if (notif.related_task_id && notif.related_project_id) {
      navigate(`/projects/${notif.related_project_id}/tasks/${notif.related_task_id}`);
    } else if (notif.related_project_id) {
      navigate(`/projects/${notif.related_project_id}`);
    }
    setShowNotifications(false);
  };

  return (
    <>
      <nav className="w-full fixed top-0 bg-white shadow px-4 py-2 flex justify-between items-center z-50">
        {is_authenticated ? (
          <>
            <div className="flex items-center">
              <div onClick={handleLogoClick} className="cursor-pointer flex items-center">
                <img src="https://picsum.photos/seed/logo/40/40" alt="Logo" className="w-10 h-10 mr-2" />
                <span className="font-bold text-xl">ProjectPro</span>
              </div>
              <div className="ml-6 space-x-4">
                <button
                  onClick={() => handleNavLinkClick("dashboard")}
                  className={`hover:text-blue-500 ${
                    active_nav_item === "dashboard" ? "text-blue-500 font-bold" : "text-gray-700"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavLinkClick("projects")}
                  className={`hover:text-blue-500 ${
                    active_nav_item === "projects" ? "text-blue-500 font-bold" : "text-gray-700"
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => handleNavLinkClick("tasks")}
                  className={`hover:text-blue-500 ${
                    active_nav_item === "tasks" ? "text-blue-500 font-bold" : "text-gray-700"
                  }`}
                >
                  Tasks
                </button>
              </div>
            </div>
            <div className="flex items-center flex-grow justify-center mx-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={handleSearchInput}
                className="w-full max-w-md px-3 py-1 border rounded"
              />
            </div>
            <div className="flex items-center space-x-4 relative">
              <div className="relative">
                <button onClick={toggleNotificationDropdown} className="relative focus:outline-none">
                  <svg
                    className="w-6 h-6 text-gray-700 hover:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C8.67 6.165 8 7.388 8 8.75v5.408a2.032 2.032 0 01-.595 1.437L6 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unread_notification_count > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unread_notification_count}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-50">
                    <div className="p-2">
                      {notification_list.length > 0 ? (
                        notification_list.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className="cursor-pointer p-2 hover:bg-gray-100 border-b last:border-0"
                          >
                            <p className="text-sm text-gray-800">{notif.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handleProfileIconClick} className="focus:outline-none">
                {current_user && current_user.profile_picture_url ? (
                  <img
                    src={current_user.profile_picture_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm text-gray-700">
                    {current_user ? current_user.first_name.charAt(0).toUpperCase() : "P"}
                  </div>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center w-full">
            <div onClick={handleLogoClick} className="cursor-pointer flex items-center">
              <img src="https://picsum.photos/seed/logo/40/40" alt="Logo" className="w-10 h-10 mr-2" />
              <span className="font-bold text-xl">ProjectPro</span>
            </div>
            <div className="space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-500">
                Login
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-blue-500">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default GV_TopNav;