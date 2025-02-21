
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GitHubService } from "@/services/github";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      const github = new GitHubService(token);
      return github.getBranches(selectedRepo);
    },
    enabled: !!selectedRepo && isOpen,
  });

  const { data: workflowDispatch, isLoading } = useQuery({
    queryKey: ["workflow-dispatch", selectedRepo, workflowId],
    queryFn: async () => {
      const github = new GitHubService(token);
      const result = await github.getWorkflowDispatch(selectedRepo, workflowId);
      
      // Initialize default values if they exist
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

      // Validate required fields
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
      await github.triggerWorkflow(selectedRepo, workflowId, workflowInputs);
      
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
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Run workflow: {workflowName}</DialogTitle>
              <DialogDescription>
                Configure the workflow run parameters below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Loading workflow parameters...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center text-sm font-medium">
                      Use workflow from
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            Branch: {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {workflowDispatch?.inputs && Object.entries(workflowDispatch.inputs).map(([name, input]) => (
                    <div key={name} className="space-y-2">
                      <Label className="flex items-center text-sm font-medium">
                        {input.description || name}
                        {input.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Select 
                        value={workflowInputs[name] || ''} 
                        onValueChange={(value) => setWorkflowInputs(prev => ({ ...prev, [name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {input.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          )) || (
                            <SelectItem value={input.default || ''}>
                              {input.default || `Enter ${name.toLowerCase()}`}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}

                  <Button 
                    onClick={handleSubmit} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
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
