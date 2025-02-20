
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { GitHubService } from "@/services/github";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { WorkflowRunCard } from "./components/WorkflowRunCard";
import { WorkflowSelect } from "./components/WorkflowSelect";
import { WorkflowDispatchPanel } from "./components/WorkflowDispatchPanel";

const CICDPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");
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

  const { data: workflows } = useQuery({
    queryKey: ["workflows", selectedRepo],
    queryFn: async () => {
      const github = new GitHubService(token!);
      return github.getWorkflows(selectedRepo);
    },
    enabled: !!token && !!selectedRepo,
  });

  const { data: workflowRuns, isLoading } = useQuery({
    queryKey: ["workflow-runs", selectedRepo, selectedWorkflow],
    queryFn: async () => {
      const github = new GitHubService(token!);
      return github.getWorkflowRuns(selectedRepo);
    },
    enabled: !!token && !!selectedRepo && !!selectedWorkflow,
  });

  const handleRepoChange = (repo: string) => {
    setSelectedRepo(repo);
    setSelectedWorkflow("");
  };

  const selectedWorkflowData = workflows?.find(w => w.id.toString() === selectedWorkflow);

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
              <WorkflowSelect
                repos={repos}
                workflows={workflows}
                selectedRepo={selectedRepo}
                selectedWorkflow={selectedWorkflow}
                onRepoChange={handleRepoChange}
                onWorkflowChange={setSelectedWorkflow}
              />

              {selectedWorkflow && selectedWorkflowData && (
                <WorkflowDispatchPanel
                  selectedRepo={selectedRepo}
                  token={token}
                  workflowId={selectedWorkflowData.id}
                  workflowName={selectedWorkflowData.name}
                />
              )}

              {selectedWorkflow && (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-600">Loading workflow runs...</p>
                    </div>
                  ) : (
                    workflowRuns?.map((run) => (
                      <WorkflowRunCard
                        key={run.id}
                        run={run}
                      />
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
