// File: lib/github.ts
export interface RepoData {
  healthJson?: string;
  contributors: ContributorCache[];
}

/**
 * Stub implementation – replace with real GitHub API logic.
 */
export async function getRepoData(owner: string, repo: string): Promise<RepoData> {
  return {
    healthJson: undefined,
    contributors: [],
  };
}
