
import { GitHubRepo, GitHubBranch, GitHubCommit, Workflow, WorkflowRun, WorkflowDispatch } from "@/types/github";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getRepositories(): Promise<GitHubRepo[]> {
    return this.fetch<GitHubRepo[]>("/user/repos?sort=updated");
  }

  async getBranches(repo: string): Promise<GitHubBranch[]> {
    return this.fetch<GitHubBranch[]>(`/repos/${repo}/branches`);
  }

  async getCommits(repo: string): Promise<GitHubCommit[]> {
    return this.fetch<GitHubCommit[]>(`/repos/${repo}/commits`);
  }

  async getWorkflows(repo: string): Promise<Workflow[]> {
    return this.fetch<{ workflows: Workflow[] }>(`/repos/${repo}/actions/workflows`).then(res => res.workflows);
  }

  async getWorkflowRuns(repo: string): Promise<WorkflowRun[]> {
    return this.fetch<{ workflow_runs: WorkflowRun[] }>(`/repos/${repo}/actions/runs`).then(res => res.workflow_runs);
  }

  async getWorkflowDispatch(repo: string, workflowId: number): Promise<WorkflowDispatch | null> {
    try {
      const workflow = await this.fetch<{ path: string }>(`/repos/${repo}/actions/workflows/${workflowId}`);
      const response = await this.fetch<{ content: string }>(`/repos/${repo}/contents/${workflow.path}`);
      const content = atob(response.content);
      
      // Parse YAML content to find workflow_dispatch trigger and its inputs
      const match = content.match(/on:[\s\S]*?workflow_dispatch:[\s\S]*?inputs:([\s\S]*?)(\n\w|$)/);
      if (!match) return null;

      const inputsYaml = match[1];
      const inputs: Record<string, WorkflowDispatchInput> = {};
      
      // Parse input parameters
      const inputMatches = inputsYaml.matchAll(/(\w+):\s*\n(\s+[\s\S]*?)(?=\n\w|$)/g);
      for (const [, name, details] of inputMatches) {
        const input: WorkflowDispatchInput = {
          name,
          type: "string",
        };

        if (details.includes("required:")) {
          input.required = details.includes("required: true");
        }
        if (details.includes("description:")) {
          const descMatch = details.match(/description:\s*(.+)/);
          input.description = descMatch?.[1];
        }
        if (details.includes("default:")) {
          const defaultMatch = details.match(/default:\s*(.+)/);
          input.default = defaultMatch?.[1];
        }
        if (details.includes("type:")) {
          const typeMatch = details.match(/type:\s*(\w+)/);
          input.type = typeMatch?.[1] as WorkflowDispatchInput["type"];
        }

        inputs[name] = input;
      }

      return { inputs };
    } catch (error) {
      console.error('Error fetching workflow dispatch:', error);
      return null;
    }
  }

  async triggerWorkflow(repo: string, workflowId: number, inputs: Record<string, string>): Promise<void> {
    await this.fetch(`/repos/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs,
      }),
    });
  }
}
