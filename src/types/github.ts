
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
  language: string | null;
  default_branch: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  head_branch: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  workflow_id: number;
}

export interface Workflow {
  id: number;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  path: string;
}

export interface WorkflowDispatch {
  inputs: Record<string, WorkflowDispatchInput>;
}

export interface WorkflowDispatchInput {
  name: string;
  description?: string;
  required?: boolean;
  default?: string;
  type: "string" | "number" | "boolean" | "choice";
  options?: string[];
}
