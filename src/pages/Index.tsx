
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { 
  Github, 
  GitBranch, 
  Container, 
  Cloud, 
  Server, 
  Settings, 
  Video, 
  Bell 
} from "lucide-react";

const services = [
  {
    icon: Github,
    title: "GitHub",
    description: "Access your repositories and manage code",
    route: "/github"
  },
  {
    icon: GitBranch,
    title: "CI/CD Pipeline",
    description: "Monitor and manage your GitHub Actions workflows",
    route: "/cicd"
  },
  {
    icon: Container,
    title: "Docker",
    description: "Manage your containers and images",
    route: "/docker"
  },
  {
    icon: Cloud,
    title: "GCP Cloud",
    description: "Access your Google Cloud Platform resources",
    route: "/gcp"
  },
  {
    icon: Server,
    title: "GKE Cluster",
    description: "Manage your Kubernetes clusters",
    route: "/gke"
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Configure your dashboard preferences",
    route: "/settings"
  },
  {
    icon: Video,
    title: "Teams Meeting",
    description: "Join or schedule team meetings",
    route: "/teams"
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "View your system notifications",
    route: "/notifications"
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleServiceClick = (service: string, route: string) => {
    toast({
      title: `${service} Selected`,
      description: `Opening ${service.toLowerCase()} interface...`,
    });
    navigate(route);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">DevOps Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage all your DevOps tools and services in one place
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.title}
                icon={service.icon}
                title={service.title}
                description={service.description}
                onClick={() => handleServiceClick(service.title, service.route)}
                className="animate-fade-in"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
