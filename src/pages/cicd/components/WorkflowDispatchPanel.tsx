
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

  const renderInput = (name: string, input: any) => {
    // Always use Select for inputs with options or boolean type
    if ((input.type === 'choice' && input.options) || input.type === 'boolean') {
      let options = input.options;
      
      // If it's a boolean type, provide true/false options
      if (input.type === 'boolean') {
        options = ['true', 'false'];
      }
      
      // If no options are provided but there's a default value, create a single option
      if (!options && input.default) {
        options = [input.default];
      }

      return (
        <Select
          value={workflowInputs[name] || ''}
          onValueChange={(value) => setWorkflowInputs(prev => ({ ...prev, [name]: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${name}`} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
            {/* If it's a choice type but no options provided, show default as option */}
            {!options && input.default && (
              <SelectItem value={input.default}>
                {input.default}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      );
    }

    // For environment type, we could potentially fetch available environments
    if (input.type === 'environment') {
      return (
        <Select
          value={workflowInputs[name] || ''}
          onValueChange={(value) => setWorkflowInputs(prev => ({ ...prev, [name]: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${name}`} />
          </SelectTrigger>
          <SelectContent>
            {input.default && (
              <SelectItem value={input.default}>
                {input.default}
              </SelectItem>
            )}
            {/* Common environment names */}
            {['production', 'staging', 'development'].map((env) => (
              <SelectItem key={env} value={env}>
                {env}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For number type, show a range if min/max are provided
    if (input.type === 'number') {
      return (
        <Input
          type="number"
          min={input.minimum}
          max={input.maximum}
          step={input.step || 1}
          placeholder={input.default || `Enter ${name}`}
          value={workflowInputs[name] || ''}
          onChange={(e) => setWorkflowInputs(prev => ({ ...prev, [name]: e.target.value }))}
          required={input.required}
        />
      );
    }

    // Default to text input with default value as placeholder
    return (
      <Input
        type="text"
        placeholder={input.default || `Enter ${name}`}
        value={workflowInputs[name] || ''}
        onChange={(e) => setWorkflowInputs(prev => ({ ...prev, [name]: e.target.value }))}
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
                            {branch.name}
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
                      {renderInput(name, input)}
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
