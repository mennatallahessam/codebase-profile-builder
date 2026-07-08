import axios from 'axios';
import { z } from 'zod';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_BASE = 'https://api.github.com';

const repoSchema = z.object({
  owner: z.string(),
  name: z.string(),
});

function getHeaders(customToken?: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  const token = (customToken && customToken.trim() !== '') ? customToken : GITHUB_TOKEN;
  if (token && token !== 'your_github_pat' && token.trim() !== '') {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

export async function fetchRepoMeta(owner: string, name: string, customToken?: string) {
  const url = `${API_BASE}/repos/${owner}/${name}`;
  const res = await axios.get(url, {
    headers: getHeaders(customToken),
  });
  return res.data;
}

export async function fetchAllCommits(owner: string, name: string, customToken?: string) {
  const perPage = 100;
  let page = 1;
  const commits: any[] = [];
  // Cap at 3 pages (300 commits) to keep processing fast and avoid rate limiting
  const maxPages = 3;
  while (page <= maxPages) {
    const url = `${API_BASE}/repos/${owner}/${name}/commits?per_page=${perPage}&page=${page}`;
    try {
      const { data } = await axios.get(url, {
        headers: getHeaders(customToken),
      });
      if (!data || data.length === 0) break;
      commits.push(...data);
      if (data.length < perPage) break;
      page++;
    } catch (err) {
      console.error(`Error fetching commits on page ${page}:`, err);
      break;
    }
  }
  return commits;
}

export async function fetchPullRequests(owner: string, name: string, customToken?: string) {
  const perPage = 100;
  let page = 1;
  const prs: any[] = [];
  const maxPages = 2;
  while (page <= maxPages) {
    const url = `${API_BASE}/repos/${owner}/${name}/pulls?state=all&per_page=${perPage}&page=${page}`;
    try {
      const { data } = await axios.get(url, {
        headers: getHeaders(customToken),
      });
      if (!data || data.length === 0) break;
      prs.push(...data);
      if (data.length < perPage) break;
      page++;
    } catch (err) {
      console.error(`Error fetching PRs on page ${page}:`, err);
      break;
    }
  }
  return prs;
}

export async function fetchContributors(owner: string, name: string, customToken?: string) {
  const perPage = 100;
  let page = 1;
  const contributors: any[] = [];
  const maxPages = 2;
  while (page <= maxPages) {
    const url = `${API_BASE}/repos/${owner}/${name}/contributors?per_page=${perPage}&page=${page}`;
    try {
      const { data } = await axios.get(url, {
        headers: getHeaders(customToken),
      });
      if (!data || data.length === 0) break;
      contributors.push(...data);
      if (data.length < perPage) break;
      page++;
    } catch (err) {
      console.error(`Error fetching contributors on page ${page}:`, err);
      break;
    }
  }
  return contributors;
}

export async function fetchContributorStats(owner: string, name: string, customToken?: string) {
  const url = `${API_BASE}/repos/${owner}/${name}/stats/contributors`;
  try {
    const res = await axios.get(url, {
      headers: getHeaders(customToken),
    });
    // GitHub stats endpoint can return 202 if it's compiling stats. We return empty array or data.
    if (res.status === 202) {
      console.warn('GitHub contributor stats returned 202 (Accepted). Retrying is skipped to maintain fast speed.');
      return [];
    }
    return res.data || [];
  } catch (err) {
    console.error('Error fetching contributor stats:', err);
    return [];
  }
}

export async function fetchPackageJson(owner: string, name: string, customToken?: string) {
  const url = `${API_BASE}/repos/${owner}/${name}/contents/package.json`;
  try {
    const res = await axios.get(url, {
      headers: getHeaders(customToken),
    });
    if (res.data && res.data.content) {
      const decoded = Buffer.from(res.data.content, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    }
    return null;
  } catch (err) {
    // If package.json doesn't exist, we return null
    return null;
  }
}

export async function fetchReadme(owner: string, name: string, customToken?: string): Promise<string | null> {
  const url = `${API_BASE}/repos/${owner}/${name}/readme`;
  try {
    const res = await axios.get(url, {
      headers: getHeaders(customToken),
    });
    if (res.data && res.data.content) {
      const decoded = Buffer.from(res.data.content, 'base64').toString('utf-8');
      // Truncate to save LLM context
      return decoded.slice(0, 3000);
    }
    return null;
  } catch (err) {
    return null;
  }
}


