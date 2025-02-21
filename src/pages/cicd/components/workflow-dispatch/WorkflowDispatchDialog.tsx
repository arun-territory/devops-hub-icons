
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GitHubBranch, WorkflowDispatch } from "@/types/github";
import { BranchSelect } from "./BranchSelect";
import { WorkflowInput } from "./WorkflowInput";

interface WorkflowDispatchDialogProps {
  workflowName: string;
  branches?: GitHubBranch[];
  workflowDispatch?: WorkflowDispatch;
  isLoading: boolean;
  selectedBranch: string;
  workflowInputs: Record<string, string>;
  onBranchChange: (branch: string) => void;
  onInputChange: (name: string, value: string) => void;
  onSubmit: () => void;
}

export const WorkflowDispatchDialog = ({
  workflowName,
  branches,
  workflowDispatch,
  isLoading,
  selectedBranch,
  workflowInputs,
  onBranchChange,
  onInputChange,
  onSubmit,
}: WorkflowDispatchDialogProps) => {
  return (
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
            <BranchSelect
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchChange={onBranchChange}
            />

            {workflowDispatch?.inputs && Object.entries(workflowDispatch.inputs).map(([name, input]) => (
              <WorkflowInput
                key={name}
                name={name}
                input={input}
                value={workflowInputs[name] || ''}
                onChange={(value) => onInputChange(name, value)}
              />
            ))}

            <Button 
              onClick={onSubmit} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Run workflow
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  );
};
