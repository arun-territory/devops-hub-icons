
import { WorkflowRun } from "@/types/github";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, CheckCircle2, XCircle, Clock, GitBranch, ExternalLink, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GitHubService } from "@/services/github";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowRunCardProps {
  run: WorkflowRun;
  token: string;
  selectedRepo: string;
}

export const WorkflowRunCard = ({ run, token, selectedRepo }: WorkflowRunCardProps) => {
  const { toast } = useToast();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [workflowInputs, setWorkflowInputs] = useState<Record<string, string>>({});

  const { data: workflowDispatch } = useQuery({
    queryKey: ["workflow-dispatch", selectedRepo, selectedWorkflowId],
    queryFn: async () => {
      if (!selectedWorkflowId) return null;
      const github = new GitHubService(token);
      return github.getWorkflowDispatch(selectedRepo, selectedWorkflowId);
    },
    enabled: !!selectedWorkflowId,
  });

  const handleWorkflowDispatch = async () => {
    if (!selectedWorkflowId) return;
    
    try {
      const github = new GitHubService(token);
      await github.triggerWorkflow(selectedRepo, selectedWorkflowId, workflowInputs);
      
      toast({
        title: "Workflow Triggered",
        description: "The workflow has been successfully triggered",
      });
      
      setSelectedWorkflowId(null);
      setWorkflowInputs({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger workflow",
        variant: "destructive",
      });
    }
  };

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {getStatusIcon(run.status, run.conclusion)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{run.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <GitBranch className="h-4 w-4" />
              <span>{run.head_branch}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Separate Run Workflow button with dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWorkflowId(run.workflow_id)}
              >
                <Play className="h-4 w-4 mr-1" />
                Run Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Workflow: {run.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {workflowDispatch?.inputs ? (
                  <>
                    <div className="space-y-4">
                      {Object.entries(workflowDispatch.inputs).map(([name, input]) => (
                        <div key={name} className="space-y-2">
                          <Label htmlFor={name}>
                            {input.description || name}
                            {input.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Input
                            id={name}
                            placeholder={input.default || ''}
                            value={workflowInputs[name] || ''}
                            onChange={(e) => setWorkflowInputs(prev => ({
                              ...prev,
                              [name]: e.target.value
                            }))}
                            required={input.required}
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleWorkflowDispatch} className="w-full mt-4">
                      Run Workflow
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      This workflow has no input parameters.
                    </p>
                    <Button onClick={handleWorkflowDispatch} className="w-full">
                      Run Workflow
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* View run details link */}
          <a
            href={run.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
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
  );
};
