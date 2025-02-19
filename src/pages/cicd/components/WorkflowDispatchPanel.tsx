
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  const renderInput = (name: string, input: any) => {
    if (input.type === 'choice' && input.options) {
      return (
        <Select
          value={workflowInputs[name] || ''}
          onValueChange={(value) => setWorkflowInputs(prev => ({ ...prev, [name]: value }))}
        >
          <SelectTrigger>
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
          <SelectTrigger>
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Run workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Run workflow: {workflowName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {workflowDispatch?.inputs ? (
                <>
                  <div className="space-y-6">
                    {Object.entries(workflowDispatch.inputs).map(([name, input]) => (
                      <div key={name} className="space-y-2">
                        <Label htmlFor={name} className="flex items-center text-sm font-medium">
                          {input.description || name}
                          {input.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderInput(name, input)}
                        {input.type === 'choice' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Choose from: {input.options?.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleWorkflowDispatch} className="w-full mt-6 bg-green-600 hover:bg-green-700">
                    Run workflow
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    This workflow has no input parameters.
                  </p>
                  <Button onClick={handleWorkflowDispatch} className="w-full bg-green-600 hover:bg-green-700">
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
