
import { GitHubRepo, GitHubBranch, GitHubCommit, Workflow, WorkflowRun, WorkflowDispatch, WorkflowDispatchInput } from "@/types/github";

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
      const errorBody = await response.text();
      console.error('GitHub API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
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
      // First get the workflow file path
      const workflow = await this.fetch<{ path: string }>(`/repos/${repo}/actions/workflows/${workflowId}`);
      
      // Get the raw workflow file content
      const content = await this.fetch<{ content: string }>(`/repos/${repo}/contents/${workflow.path}`);
      const decodedContent = atob(content.content);
      
      console.log('Workflow content:', decodedContent);

      // Look for workflow_dispatch section
      const workflowDispatchMatch = decodedContent.match(/workflow_dispatch:\s*\n(?:\s+[\s\S]*?)(?=\n\w|\s*$)/);
      if (!workflowDispatchMatch) {
        console.log('No workflow_dispatch section found');
        return null;
      }

      const workflowDispatchSection = workflowDispatchMatch[0];
      console.log('Workflow dispatch section:', workflowDispatchSection);

      // Look for inputs section
      const inputsMatch = workflowDispatchSection.match(/inputs:\s*\n([\s\S]*?)(?=\n\w|\s*$)/);
      if (!inputsMatch) {
        console.log('No inputs section found');
        return { inputs: {} };
      }

      const inputsSection = inputsMatch[1];
      console.log('Inputs section:', inputsSection);

      const inputs: Record<string, WorkflowDispatchInput> = {};
      const inputRegex = /(\w+):\s*\n([\s\S]*?)(?=\n\s*\w+:|\s*$)/g;
      let match;

      while ((match = inputRegex.exec(inputsSection)) !== null) {
        const [, name, details] = match;
        console.log(`Processing input ${name}:`, details);

        const input: WorkflowDispatchInput = {
          name,
          type: 'string',
          required: false
        };

        // Parse description
        const descriptionMatch = details.match(/description:\s*(['"]?)(.+?)\1\s*(?:\n|$)/);
        if (descriptionMatch) {
          input.description = descriptionMatch[2].trim();
        }

        // Parse required
        if (details.includes('required: true')) {
          input.required = true;
        }

        // Parse type
        const typeMatch = details.match(/type:\s*(\w+)/);
        if (typeMatch) {
          input.type = typeMatch[1] as WorkflowDispatchInput['type'];
        }

        // Parse default
        const defaultMatch = details.match(/default:\s*(['"]?)(.+?)\1\s*(?:\n|$)/);
        if (defaultMatch) {
          input.default = defaultMatch[2].trim();
        }

        // Parse options for choice type
        const optionsMatch = details.match(/options:\s*\[(.*?)\]/);
        if (optionsMatch) {
          input.options = optionsMatch[1]
            .split(',')
            .map(option => option.trim().replace(/^['"]|['"]$/g, ''));
        }

        inputs[name] = input;
        console.log(`Processed input:`, input);
      }

      return { inputs };
    } catch (error) {
      console.error('Error fetching workflow dispatch:', error);
      return null;
    }
  }

  async triggerWorkflow(repo: string, workflowId: number, inputs: Record<string, string>): Promise<void> {
    const branches = await this.getBranches(repo);
    const defaultBranch = branches.find(b => b.name === 'main' || b.name === 'master')?.name || 'main';
    
    await this.fetch(`/repos/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: defaultBranch,
        inputs,
      }),
    });
  }
}
