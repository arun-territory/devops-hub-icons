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
      
      console.log('Raw workflow content:', decodedContent);

      // Look for workflow_dispatch section with improved regex
      const workflowDispatchMatch = decodedContent.match(/on:\s*(?:\n\s+)?workflow_dispatch:\s*(?:\n\s+inputs:\s*([\s\S]*?)(?=\n\w|\s*$))?/);
      if (!workflowDispatchMatch) {
        console.log('No workflow_dispatch section found');
        return null;
      }

      const inputsSection = workflowDispatchMatch[1];
      if (!inputsSection) {
        console.log('No inputs section found');
        return { inputs: {} };
      }

      console.log('Found inputs section:', inputsSection);

      const inputs: Record<string, WorkflowDispatchInput> = {};
      // Improved regex to capture the entire input block
      const inputBlockRegex = /^\s*(\w+):\s*(?:\n\s+(.+(?:\n\s+.+)*)|(.+))$/gm;
      let match;

      while ((match = inputBlockRegex.exec(inputsSection)) !== null) {
        const [, name, multiLineDetails, singleLineDetails] = match;
        const details = (multiLineDetails || singleLineDetails || '').trim();
        console.log(`Processing input "${name}":`, details);

        const input: WorkflowDispatchInput = {
          name,
          type: 'string',
          required: false,
        };

        // Parse description (handling both single and double quotes)
        const descriptionMatch = details.match(/description:\s*(['"])(.*?)\1/);
        if (descriptionMatch) {
          input.description = descriptionMatch[2].trim();
        }

        // Parse required
        input.required = /required:\s*true/i.test(details);

        // Parse type
        const typeMatch = details.match(/type:\s*(\w+)/);
        if (typeMatch) {
          input.type = typeMatch[1].toLowerCase() as WorkflowDispatchInput['type'];
        }

        // Parse default value (handling both single and double quotes)
        const defaultMatch = details.match(/default:\s*(['"]?)([^'"]*)\1/);
        if (defaultMatch) {
          input.default = defaultMatch[2].trim();
        }

        // Parse options for choice type
        const optionsMatch = details.match(/options:\s*\[(.*?)\]/);
        if (optionsMatch) {
          input.options = optionsMatch[1]
            .split(',')
            .map(option => option.trim().replace(/^['"]|['"]$/g, ''));
          console.log(`Found options for ${name}:`, input.options);
        }

        inputs[name] = input;
        console.log(`Processed input complete:`, input);
      }

      console.log('Final parsed inputs:', inputs);
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
