// types.ts – basic typings for GitHub data used in the metrics engine
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url?: string;
  // Additional fields omitted for brevity
}

export interface CommitAuthor {
  name: string;
  email: string;
  date: string; // ISO timestamp
}

export interface CommitInfo {
  author: CommitAuthor | null;
  committer: CommitAuthor | null;
  message: string;
  url: string;
}

export interface Commit {
  sha: string;
  node_id?: string;
  commit: CommitInfo;
  author?: GitHubUser | null;
  committer?: GitHubUser | null;
  files?: { filename: string; additions: number; deletions: number; changes: number }[];
  // Additional fields omitted
}

export interface PullRequest {
  id: number;
  number: number;
  state: string;
  title: string;
  created_at: string;
  merged_at?: string | null;
  // Additional fields omitted
}

export interface Contributor {
  login: string;
  contributions: number;
  // Additional fields omitted
}
