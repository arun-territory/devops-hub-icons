
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
        body: errorBody,
        endpoint
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
    return this.fetch<{ workflows: Workflow[] }>(`/repos/${repo}/actions/workflows`)
      .then(res => res.workflows);
  }

  async getWorkflowRuns(repo: string): Promise<WorkflowRun[]> {
    return this.fetch<{ workflow_runs: WorkflowRun[] }>(`/repos/${repo}/actions/runs`)
      .then(res => res.workflow_runs);
  }

  async getWorkflowDispatch(repo: string, workflowId: number): Promise<WorkflowDispatch | null> {
    try {
      console.log('Fetching workflow dispatch for:', { repo, workflowId });
      const workflow = await this.fetch<{ path: string }>(`/repos/${repo}/actions/workflows/${workflowId}`);
      console.log('Workflow file path:', workflow.path);
      
      const content = await this.fetch<{ content: string }>(`/repos/${repo}/contents/${workflow.path}`);
      const decodedContent = atob(content.content);
      console.log('Decoded workflow content:', decodedContent);

      // Improved regex to match workflow_dispatch section
      const workflowDispatchMatch = decodedContent.match(/workflow_dispatch:[\s\S]*?(?=\n\w+:|$)/);
      if (!workflowDispatchMatch) {
        console.log('No workflow_dispatch section found');
        return null;
      }

      const workflowDispatchContent = workflowDispatchMatch[0];
      console.log('Workflow dispatch section:', workflowDispatchContent);

      const inputs: Record<string, WorkflowDispatchInput> = {};
      
      // Extract inputs section
      const inputsMatch = workflowDispatchContent.match(/inputs:([\s\S]*?)(?=\n\w+:|$)/);
      if (!inputsMatch) {
        console.log('No inputs section found');
        return { inputs };
      }

      const inputsContent = inputsMatch[1];
      console.log('Inputs content:', inputsContent);

      // Parse each input block
      const inputLines = inputsContent.split('\n');
      let currentInput: string | null = null;
      let currentInputContent = '';

      for (const line of inputLines) {
        const inputMatch = line.match(/^\s+(\w+):/);
        if (inputMatch) {
          if (currentInput) {
            // Process previous input
            this.processInput(currentInput, currentInputContent, inputs);
          }
          currentInput = inputMatch[1];
          currentInputContent = line;
        } else if (currentInput && line.trim()) {
          currentInputContent += '\n' + line;
        }
      }

      // Process last input
      if (currentInput) {
        this.processInput(currentInput, currentInputContent, inputs);
      }

      console.log('Final parsed inputs:', inputs);
      return { inputs };
    } catch (error) {
      console.error('Error parsing workflow dispatch:', error);
      return null;
    }
  }

  private processInput(name: string, content: string, inputs: Record<string, WorkflowDispatchInput>) {
    console.log('Processing input:', { name, content });
    
    const input: WorkflowDispatchInput = {
      name,
      type: 'string',
      required: false
    };

    // Parse description
    const descMatch = content.match(/description:\s*['"](.+?)['"]/);
    if (descMatch) {
      input.description = descMatch[1];
    }

    // Parse required
    input.required = /required:\s*true/i.test(content);

    // Parse type
    const typeMatch = content.match(/type:\s*(\w+)/i);
    if (typeMatch) {
      input.type = typeMatch[1].toLowerCase() as WorkflowDispatchInput['type'];
    }

    // Parse default
    const defaultMatch = content.match(/default:\s*['"]?([^'"}\n]+)['"]?/);
    if (defaultMatch) {
      input.default = defaultMatch[1].trim();
    }

    // Parse options for choice type
    const optionsMatch = content.match(/options:\s*\[(.*?)\]/);
    if (optionsMatch) {
      input.options = optionsMatch[1]
        .split(',')
        .map(option => option.trim().replace(/^['"]|['"]$/g, ''));
      console.log('Parsed options:', input.options);
    }

    inputs[name] = input;
    console.log('Processed input result:', input);
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
