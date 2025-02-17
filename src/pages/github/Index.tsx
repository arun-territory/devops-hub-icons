
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { GitHubService } from "@/services/github";
import { GitHubRepo } from "@/types/github";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  GitFork, 
  Lock, 
  Unlock,
  ExternalLink 
} from "lucide-react";

const GitHubPage = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const github = new GitHubService(token);
      return github.getRepositories();
    },
    enabled: isAuthenticated,
  });

  const handleAuthenticate = () => {
    if (token) {
      localStorage.setItem("github_token", token);
      setIsAuthenticated(true);
      toast({
        title: "GitHub Connected",
        description: "Successfully connected to GitHub",
      });
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("github_token");
    setToken("");
    setIsAuthenticated(false);
    toast({
      title: "GitHub Disconnected",
      description: "Successfully disconnected from GitHub",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GitHub Integration</h1>
              <p className="mt-2 text-gray-600">
                Manage your repositories and monitor activity
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect
              </button>
            )}
          </header>

          {!isAuthenticated ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Connect to GitHub</h2>
              <div className="flex gap-4">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your GitHub token"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleAuthenticate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Need a token? Generate one in your{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GitHub Settings
                </a>
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading repositories...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  Failed to load repositories. Please check your token and try again.
                </div>
              )}

              {repos?.map((repo: GitHubRepo) => (
                <div
                  key={repo.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {repo.name}
                        </h3>
                        {repo.private ? (
                          <Lock className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Unlock className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <p className="mt-1 text-gray-600">{repo.description}</p>
                    </div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Updated {formatDate(repo.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      <span>{repo.default_branch}</span>
                    </div>
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span>{repo.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GitHubPage;
