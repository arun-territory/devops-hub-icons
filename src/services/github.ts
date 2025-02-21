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
      const workflow = await this.fetch<{ path: string }>(`/repos/${repo}/actions/workflows/${workflowId}`);
      const content = await this.fetch<{ content: string }>(`/repos/${repo}/contents/${workflow.path}`);
      const decodedContent = atob(content.content);
      
      console.log('Raw workflow content:', decodedContent);

      // Parse the YAML content more accurately
      const workflowDispatchMatch = decodedContent.match(/on:[\s\S]*?workflow_dispatch:[\s\S]*?(?=\n\w|\s*$)/);
      if (!workflowDispatchMatch) {
        return null;
      }

      const workflowDispatchContent = workflowDispatchMatch[0];
      console.log('Workflow dispatch content:', workflowDispatchContent);

      const inputs: Record<string, WorkflowDispatchInput> = {};
      
      // Extract inputs section
      const inputsMatch = workflowDispatchContent.match(/inputs:([\s\S]*?)(?=\n\w|\s*$)/);
      if (!inputsMatch) {
        return { inputs };
      }

      const inputsContent = inputsMatch[1];
      const inputBlocks = inputsContent.match(/\s+\w+:[\s\S]*?(?=\s+\w+:|\s*$)/g) || [];

      for (const block of inputBlocks) {
        const nameMatch = block.match(/\s+(\w+):/);
        if (!nameMatch) continue;

        const name = nameMatch[1];
        const input: WorkflowDispatchInput = {
          name,
          type: 'string',
          required: false
        };

        // Parse description
        const descMatch = block.match(/description:\s*['"](.+?)['"]/);
        if (descMatch) {
          input.description = descMatch[1];
        }

        // Parse required
        input.required = /required:\s*true/.test(block);

        // Parse type
        const typeMatch = block.match(/type:\s*(\w+)/);
        if (typeMatch) {
          input.type = typeMatch[1].toLowerCase() as WorkflowDispatchInput['type'];
        }

        // Parse default
        const defaultMatch = block.match(/default:\s*['"]?([^'"}\n]+)['"]?/);
        if (defaultMatch) {
          input.default = defaultMatch[1];
        }

        // Parse options for choice type
        const optionsMatch = block.match(/options:\s*\[(.*?)\]/);
        if (optionsMatch) {
          input.options = optionsMatch[1]
            .split(',')
            .map(option => option.trim().replace(/^['"]|['"]$/g, ''));
        }

        inputs[name] = input;
      }

      console.log('Parsed inputs:', inputs);
      return { inputs };
    } catch (error) {
      console.error('Error parsing workflow dispatch:', error);
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
