import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, set_breadcrumb_path } from "@/store/main";

const GV_Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const breadcrumbList = useSelector((state: RootState) => state.global.breadcrumb_path);

  useEffect(() => {
    // updateBreadcrumbs: refresh breadcrumb list based on current location pathname
    let crumbs: { name: string; url: string }[] = [];
    if (location.pathname.startsWith("/profile")) {
      crumbs = [
        { name: "Dashboard", url: "/dashboard" },
        { name: "Profile", url: "/profile" }
      ];
    } else if (location.pathname.startsWith("/projects/")) {
      const segments = location.pathname.split("/").filter(seg => seg !== "");
      // For project detail view: /projects/:project_id
      if (segments.length === 2) {
        crumbs = [
          { name: "Dashboard", url: "/dashboard" },
          { name: `Project ${segments[1]}`, url: location.pathname }
        ];
      }
      // For task detail view: /projects/:project_id/tasks/:task_id
      else if (segments.length === 4 && segments[2] === "tasks") {
        crumbs = [
          { name: "Dashboard", url: "/dashboard" },
          { name: `Project ${segments[1]}`, url: `/projects/${segments[1]}` },
          { name: `Task ${segments[3]}`, url: location.pathname }
        ];
      }
      // Fallback if pattern does not match expected routes
      else {
        crumbs = [
          { name: "Dashboard", url: "/dashboard" },
          { name: location.pathname, url: location.pathname }
        ];
      }
    }
    // Dispatch the new breadcrumb list to update the global state.
    dispatch(set_breadcrumb_path(crumbs));
  }, [location.pathname, dispatch]);

  return (
    <>
      <nav className="bg-gray-100 py-3 px-5">
        <ol className="flex space-x-2">
          {breadcrumbList &&
            breadcrumbList.map((crumb, index) => {
              const isLast = index === breadcrumbList.length - 1;
              return (
                <li key={index} className="flex items-center">
                  {!isLast ? (
                    <>
                      <Link to={crumb.url} className="text-blue-600 hover:underline">
                        {crumb.name}
                      </Link>
                      <span className="mx-2 text-gray-500">›</span>
                    </>
                  ) : (
                    <span className="text-gray-700 font-semibold">{crumb.name}</span>
                  )}
                </li>
              );
            })}
        </ol>
      </nav>
    </>
  );
};

export default GV_Breadcrumbs;