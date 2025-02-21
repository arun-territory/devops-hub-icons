
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GitHubService } from "@/services/github";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { WorkflowDispatchDialog } from "./workflow-dispatch/WorkflowDispatchDialog";

interface WorkflowDispatchPanelProps {
  selectedRepo: string;
  token: string;
  workflowId: number;
  workflowName: string;
}

export const WorkflowDispatchPanel = ({ selectedRepo, token, workflowId, workflowName }: WorkflowDispatchPanelProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [workflowInputs, setWorkflowInputs] = useState<Record<string, string>>({});

  const { data: branches } = useQuery({
    queryKey: ["branches", selectedRepo],
    queryFn: async () => {
      console.log('Fetching branches for:', selectedRepo);
      const github = new GitHubService(token);
      const branches = await github.getBranches(selectedRepo);
      console.log('Fetched branches:', branches);
      return branches;
    },
    enabled: !!selectedRepo && isOpen,
  });

  const { data: workflowDispatch, isLoading } = useQuery({
    queryKey: ["workflow-dispatch", selectedRepo, workflowId],
    queryFn: async () => {
      console.log('Fetching workflow dispatch for:', { selectedRepo, workflowId });
      const github = new GitHubService(token);
      const result = await github.getWorkflowDispatch(selectedRepo, workflowId);
      console.log('Fetched workflow dispatch:', result);
      
      if (result?.inputs) {
        const defaultInputs = Object.entries(result.inputs).reduce((acc, [name, input]) => {
          if (input.default) {
            acc[name] = input.default;
          }
          return acc;
        }, {} as Record<string, string>);
        setWorkflowInputs(defaultInputs);
      }
      
      return result;
    },
    enabled: !!workflowId && isOpen,
  });

  const handleSubmit = async () => {
    try {
      if (!selectedBranch) {
        toast({
          title: "Branch Required",
          description: "Please select a branch to run the workflow",
          variant: "destructive",
        });
        return;
      }

      if (workflowDispatch?.inputs) {
        const missingRequired = Object.entries(workflowDispatch.inputs)
          .filter(([name, input]) => input.required && !workflowInputs[name])
          .map(([name]) => name);

        if (missingRequired.length > 0) {
          toast({
            title: "Missing Required Fields",
            description: `Please fill in: ${missingRequired.join(', ')}`,
            variant: "destructive",
          });
          return;
        }
      }

      const github = new GitHubService(token);
      await github.triggerWorkflow(selectedRepo, workflowId, {
        ...workflowInputs,
        ref: selectedBranch,
      });
      
      toast({
        title: "Workflow Triggered",
        description: "The workflow has been successfully triggered",
      });
      
      setWorkflowInputs({});
      setIsOpen(false);
    } catch (error) {
      console.error('Error triggering workflow:', error);
      toast({
        title: "Error",
        description: "Failed to trigger workflow",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setWorkflowInputs(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {workflowName}
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Run workflow
            </Button>
          </DialogTrigger>
          <WorkflowDispatchDialog
            workflowName={workflowName}
            branches={branches}
            workflowDispatch={workflowDispatch}
            isLoading={isLoading}
            selectedBranch={selectedBranch}
            workflowInputs={workflowInputs}
            onBranchChange={setSelectedBranch}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        </Dialog>
      </div>
      <p className="text-sm text-gray-600">
        This workflow has a workflow_dispatch event trigger.
      </p>
    </div>
  );
};
