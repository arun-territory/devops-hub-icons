
import { GitHubRepo, GitHubBranch, GitHubCommit } from "@/types/github";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
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
}
