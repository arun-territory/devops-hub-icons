
import { WorkflowRun } from "@/types/github";
import { CheckCircle2, XCircle, Clock, GitBranch, ExternalLink, RefreshCw } from "lucide-react";

interface WorkflowRunCardProps {
  run: WorkflowRun;
}

export const WorkflowRunCard = ({ run }: WorkflowRunCardProps) => {
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
        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
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
