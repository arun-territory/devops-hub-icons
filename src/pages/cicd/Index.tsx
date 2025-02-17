
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { GitHubService } from "@/services/github";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const CICDPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    if (!savedToken) {
      toast({
        title: "GitHub Connection Required",
        description: "Please connect your GitHub account first",
        variant: "destructive",
      });
      navigate("/github");
      return;
    }
    setToken(savedToken);
  }, [navigate, toast]);

  const { data: repos } = useQuery({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const github = new GitHubService(token!);
      return github.getRepositories();
    },
    enabled: !!token,
  });

  const { data: workflowRuns, isLoading } = useQuery({
    queryKey: ["workflow-runs", selectedRepo],
    queryFn: async () => {
      const github = new GitHubService(token!);
      return github.getWorkflowRuns(selectedRepo);
    },
    enabled: !!token && !!selectedRepo,
  });

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === "in_progress") return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    if (conclusion === "success") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (conclusion === "failure") return <XCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">CI/CD Pipeline</h1>
            <p className="mt-2 text-gray-600">
              Monitor and manage your GitHub Actions workflows
            </p>
          </header>

          {!token ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-700">
                Please connect to GitHub first to view your CI/CD pipelines.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Repository
                </label>
                <select
                  id="repo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                >
                  <option value="">Choose a repository</option>
                  {repos?.map((repo) => (
                    <option key={repo.id} value={repo.full_name}>
                      {repo.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRepo && (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-600">Loading workflows...</p>
                    </div>
                  ) : (
                    workflowRuns?.map((run) => (
                      <div
                        key={run.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(run.status, run.conclusion)}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {run.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <GitBranch className="h-4 w-4" />
                                <span>{run.head_branch}</span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={run.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                          <div>Started: {formatDate(run.created_at)}</div>
                          <div>Updated: {formatDate(run.updated_at)}</div>
                          <div className={`capitalize font-medium ${
                            run.conclusion === 'success' ? 'text-green-600' :
                            run.conclusion === 'failure' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {run.status === 'in_progress' ? 'Running' : run.conclusion || 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CICDPage;
