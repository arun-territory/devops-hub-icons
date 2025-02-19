
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitHubRepo, Workflow } from "@/types/github";

interface WorkflowSelectProps {
  repos: GitHubRepo[] | undefined;
  workflows: Workflow[] | undefined;
  selectedRepo: string;
  selectedWorkflow: string;
  onRepoChange: (repo: string) => void;
  onWorkflowChange: (workflow: string) => void;
}

export const WorkflowSelect = ({
  repos,
  workflows,
  selectedRepo,
  selectedWorkflow,
  onRepoChange,
  onWorkflowChange,
}: WorkflowSelectProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <div className="space-y-2">
        <label htmlFor="repo" className="block text-sm font-medium text-gray-700">
          Select Repository
        </label>
        <Select value={selectedRepo} onValueChange={onRepoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a repository" />
          </SelectTrigger>
          <SelectContent>
            {repos?.map((repo) => (
              <SelectItem key={repo.id} value={repo.full_name}>
                {repo.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRepo && workflows && (
        <div className="space-y-2">
          <label htmlFor="workflow" className="block text-sm font-medium text-gray-700">
            Select Workflow
          </label>
          <Select value={selectedWorkflow} onValueChange={onWorkflowChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflows?.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id.toString()}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
