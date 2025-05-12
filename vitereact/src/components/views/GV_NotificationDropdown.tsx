import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, mark_notification_read, set_notification_list } from "@/store/main";
import axios from "axios";
import { Link } from "react-router-dom";

const GV_NotificationDropdown: React.FC = () => {
  const dispatch = useDispatch();
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const global_notifications = useSelector((state: RootState) => state.global.notification_list);
  const unread_notification_count = useSelector((state: RootState) => state.global.unread_notification_count);

  // Local state for dropdown visibility and local copy of notifications.
  const [notificationsVisible, setNotificationsVisible] = useState<boolean>(false);
  const [localNotifications, setLocalNotifications] = useState(global_notifications);

  // Ref for detecting clicks outside the dropdown.
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync local copy with global notification_list.
  useEffect(() => {
    setLocalNotifications(global_notifications);
  }, [global_notifications]);

  // Handle click outside: close the dropdown.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  // Fetch notifications from the backend.
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/notifications`,
        { headers: { Authorization: `Bearer ${auth_token}` } }
      );
      dispatch(set_notification_list(response.data));
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  // Fetch notifications on mount and whenever the auth_token changes.
  useEffect(() => {
    if (auth_token) {
      fetchNotifications();
    }
  }, [auth_token]);

  // Toggle the visibility of the dropdown.
  const toggleDropdown = () => {
    setNotificationsVisible((prev) => !prev);
  };

  // Handle clicking on a notification:
  // marks the notification as read (both locally and with a backend PUT)
  // and then closes the dropdown.
  const handleNotificationClick = async (notifId: string) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notifId}`,
        { read_status: 1 },
        { headers: { Authorization: `Bearer ${auth_token}` } }
      );
      dispatch(mark_notification_read(notifId));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
    setNotificationsVisible(false);
  };

  return (
    <>
      <div className="relative inline-block">
        {/* Notification icon with unread badge; clicking toggles the dropdown */}
        <button onClick={toggleDropdown} className="focus:outline-none relative">
          <span className="text-2xl">🔔</span>
          {unread_notification_count > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1 text-xs">
              {unread_notification_count}
            </span>
          )}
        </button>
        {/* Dropdown panel */}
        {notificationsVisible && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {localNotifications.length === 0 ? (
                <div className="p-4 text-gray-500">No notifications.</div>
              ) : (
                localNotifications.map((notification) => {
                  // Determine destination link based on related IDs.
                  let destination = "#";
                  if (notification.related_task_id && notification.related_project_id) {
                    destination = `/projects/${notification.related_project_id}/tasks/${notification.related_task_id}`;
                  } else if (notification.related_project_id) {
                    destination = `/projects/${notification.related_project_id}`;
                  }
                  return (
                    <Link
                      key={notification.id}
                      to={destination}
                      onClick={() => handleNotificationClick(notification.id)}
                      className="block p-4 border-b border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          {notification.type === "task_assignment"
                            ? "📝"
                            : notification.type === "status_update"
                            ? "🔄"
                            : notification.type === "deadline_alert"
                            ? "⏰"
                            : "🔔"}
                        </div>
                        <div>
                          <p className={`text-sm ${notification.read_status === 0 ? "font-bold" : "text-gray-600"}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GV_NotificationDropdown;