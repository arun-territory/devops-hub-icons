
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Github, 
  GitBranch, 
  Container, 
  Cloud, 
  Server, 
  Settings, 
  Video, 
  Bell,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Github, label: "GitHub", route: "/github" },
  { icon: GitBranch, label: "CI/CD Pipeline", route: "/cicd" },
  { icon: Container, label: "Docker", route: "/docker" },
  { icon: Cloud, label: "GCP Cloud", route: "/gcp" },
  { icon: Server, label: "GKE Cluster", route: "/gke" },
  { icon: Settings, label: "Settings", route: "/settings" },
  { icon: Video, label: "Teams Meeting", route: "/teams" },
  { icon: Bell, label: "Notifications", route: "/notifications" },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div
      className={cn(
        "relative h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-4 top-6 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      <div className="p-4">
        <Link to="/" className="block">
          <h2 className={cn(
            "font-semibold text-lg mb-8 transition-opacity duration-200 text-gray-900 hover:text-gray-700",
            collapsed ? "opacity-0" : "opacity-100"
          )}>
            DevOps Hub
          </h2>
        </Link>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.route;
            return (
              <Link
                key={item.label}
                to={item.route}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive 
                    ? "text-gray-900" 
                    : "text-gray-500 group-hover:text-gray-700"
                )} />
                <span
                  className={cn(
                    "ml-3 transition-all duration-200",
                    collapsed ? "opacity-0 hidden" : "opacity-100",
                    isActive ? "font-medium" : "font-normal"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
