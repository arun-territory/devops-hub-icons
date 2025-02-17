
import { useState } from "react";
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
  { icon: Github, label: "GitHub", href: "#github" },
  { icon: GitBranch, label: "CI/CD Pipeline", href: "#cicd" },
  { icon: Container, label: "Docker", href: "#docker" },
  { icon: Cloud, label: "GCP Cloud", href: "#gcp" },
  { icon: Server, label: "GKE Cluster", href: "#gke" },
  { icon: Settings, label: "Settings", href: "#settings" },
  { icon: Video, label: "Teams Meeting", href: "#teams" },
  { icon: Bell, label: "Notifications", href: "#notifications" },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

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
        <h2 className={cn(
          "font-semibold text-lg mb-8 transition-opacity duration-200",
          collapsed ? "opacity-0" : "opacity-100"
        )}>
          DevOps Hub
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <item.icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
              <span
                className={cn(
                  "ml-3 transition-opacity duration-200",
                  collapsed ? "opacity-0 hidden" : "opacity-100"
                )}
              >
                {item.label}
              </span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};
