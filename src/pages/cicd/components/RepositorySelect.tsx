
import { GitHubRepo } from "@/types/github";

interface RepositorySelectProps {
  repos: GitHubRepo[] | undefined;
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
}

export const RepositorySelect = ({ repos, selectedRepo, onRepoChange }: RepositorySelectProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-2">
        Select Repository
      </label>
      <select
        id="repo"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedRepo}
        onChange={(e) => onRepoChange(e.target.value)}
      >
        <option value="">Choose a repository</option>
        {repos?.map((repo) => (
          <option key={repo.id} value={repo.full_name}>
            {repo.full_name}
          </option>
        ))}
      </select>
    </div>
  );
};
