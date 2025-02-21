
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GitHubBranch } from "@/types/github";

interface BranchSelectProps {
  branches?: GitHubBranch[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
}

export const BranchSelect = ({ branches, selectedBranch, onBranchChange }: BranchSelectProps) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center text-sm font-medium">
        Use workflow from
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <Select value={selectedBranch} onValueChange={onBranchChange}>
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
  );
};
