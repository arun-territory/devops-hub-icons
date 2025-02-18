
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GitHubService } from "@/services/github";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowDispatchPanelProps {
  selectedRepo: string;
  token: string;
  workflowId: number;
  workflowName: string;
}

export const WorkflowDispatchPanel = ({ selectedRepo, token, workflowId, workflowName }: WorkflowDispatchPanelProps) => {
  const { toast } = useToast();
  const [workflowInputs, setWorkflowInputs] = useState<Record<string, string>>({});

  const { data: workflowDispatch } = useQuery({
    queryKey: ["workflow-dispatch", selectedRepo, workflowId],
    queryFn: async () => {
      const github = new GitHubService(token);
      return github.getWorkflowDispatch(selectedRepo, workflowId);
    },
    enabled: !!workflowId,
  });

  const handleWorkflowDispatch = async () => {
    try {
      const github = new GitHubService(token);
      await github.triggerWorkflow(selectedRepo, workflowId, workflowInputs);
      
      toast({
        title: "Workflow Triggered",
        description: "The workflow has been successfully triggered",
      });
      
      setWorkflowInputs({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger workflow",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {workflowName}
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Run workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run workflow: {workflowName}</DialogTitle>
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
                    Run workflow
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    This workflow has no input parameters.
                  </p>
                  <Button onClick={handleWorkflowDispatch} className="w-full">
                    Run workflow
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-sm text-gray-600">
        This workflow has a workflow_dispatch event trigger.
      </p>
    </div>
  );
};
