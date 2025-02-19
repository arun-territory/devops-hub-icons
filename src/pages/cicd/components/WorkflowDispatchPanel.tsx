
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [workflowInputs, setWorkflowInputs] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);

  const { data: workflowDispatch, isLoading } = useQuery({
    queryKey: ["workflow-dispatch", selectedRepo, workflowId],
    queryFn: async () => {
      const github = new GitHubService(token);
      return github.getWorkflowDispatch(selectedRepo, workflowId);
    },
    enabled: !!workflowId && isOpen,
  });

  const handleWorkflowDispatch = async () => {
    try {
      // Validate required fields
      if (workflowDispatch?.inputs) {
        const missingRequired = Object.entries(workflowDispatch.inputs)
          .filter(([, input]) => input.required && !workflowInputs[input.name])
          .map(([, input]) => input.name);

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

  const renderInput = (name: string, input: any) => {
    if (input.type === 'choice' && input.options) {
      return (
        <Select
          value={workflowInputs[name] || ''}
          onValueChange={(value) => setWorkflowInputs(prev => ({ ...prev, [name]: value }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={input.default || `Select ${name}`} />
          </SelectTrigger>
          <SelectContent>
            {input.options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (input.type === 'boolean') {
      return (
        <Select
          value={workflowInputs[name] || ''}
          onValueChange={(value) => setWorkflowInputs(prev => ({ ...prev, [name]: value }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={input.default || 'Select true/false'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        id={name}
        type={input.type === 'number' ? 'number' : 'text'}
        placeholder={input.default || ''}
        value={workflowInputs[name] || ''}
        onChange={(e) => setWorkflowInputs(prev => ({
          ...prev,
          [name]: e.target.value
        }))}
        required={input.required}
      />
    );
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
              ) : workflowDispatch?.inputs && Object.keys(workflowDispatch.inputs).length > 0 ? (
                <>
                  <div className="space-y-6">
                    {Object.entries(workflowDispatch.inputs).map(([name, input]) => (
                      <div key={name} className="space-y-2">
                        <Label htmlFor={name} className="flex items-center text-sm font-medium">
                          {input.description || name}
                          {input.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderInput(name, input)}
                        {input.type === 'choice' && input.options && (
                          <p className="text-xs text-gray-500 mt-1">
                            Choose from: {input.options.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleWorkflowDispatch} 
                    className="w-full mt-6 bg-green-600 hover:bg-green-700"
                  >
                    Run workflow
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    This workflow has no input parameters.
                  </p>
                  <Button 
                    onClick={handleWorkflowDispatch} 
                    className="w-full bg-green-600 hover:bg-green-700"
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
