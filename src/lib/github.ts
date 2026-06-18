import axios from 'axios';
import { z } from 'zod';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_BASE = 'https://api.github.com';

const repoSchema = z.object({
  owner: z.string(),
  name: z.string(),
});

function getHeaders() {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  return headers;
}

export async function fetchRepoMeta(owner: string, name: string) {
  const url = `${API_BASE}/repos/${owner}/${name}`;
  const res = await axios.get(url, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function fetchAllCommits(owner: string, name: string) {
  const perPage = 100;
  let page = 1;
  const commits: any[] = [];
  // Cap at 3 pages (300 commits) to keep processing fast and avoid rate limiting
  const maxPages = 3;
  while (page <= maxPages) {
    const url = `${API_BASE}/repos/${owner}/${name}/commits?per_page=${perPage}&page=${page}`;
    try {
      const { data } = await axios.get(url, {
        headers: getHeaders(),
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

export async function fetchPullRequests(owner: string, name: string) {
  const perPage = 100;
  let page = 1;
  const prs: any[] = [];
  const maxPages = 2;
  while (page <= maxPages) {
    const url = `${API_BASE}/repos/${owner}/${name}/pulls?state=all&per_page=${perPage}&page=${page}`;
    try {
      const { data } = await axios.get(url, {
        headers: getHeaders(),
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

export async function fetchContributors(owner: string, name: string) {
  const perPage = 100;
  let page = 1;
  const contributors: any[] = [];
  const maxPages = 2;
  while (page <= maxPages) {
    const url = `${API_BASE}/repos/${owner}/${name}/contributors?per_page=${perPage}&page=${page}`;
    try {
      const { data } = await axios.get(url, {
        headers: getHeaders(),
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
