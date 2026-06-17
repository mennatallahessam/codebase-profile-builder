import axios from 'axios';
import { z } from 'zod';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_BASE = 'https://api.github.com';

const repoSchema = z.object({
  owner: z.string(),
  name: z.string(),
});

export async function fetchRepoMeta(owner: string, name: string) {
  const url = `${API_BASE}/repos/${owner}/${name}`;
  const res = await axios.get(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  return res.data;
}

export async function fetchAllCommits(owner: string, name: string) {
  const perPage = 100;
  let page = 1;
  const commits: any[] = [];
  while (true) {
    const url = `${API_BASE}/repos/${owner}/${name}/commits?per_page=${perPage}&page=${page}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    if (data.length === 0) break;
    commits.push(...data);
    page++;
    // Respect rate limits – simple back‑off could be added later
  }
  return commits;
}

export async function fetchPullRequests(owner: string, name: string) {
  const perPage = 100;
  let page = 1;
  const prs: any[] = [];
  while (true) {
    const url = `${API_BASE}/repos/${owner}/${name}/pulls?state=all&per_page=${perPage}&page=${page}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    if (data.length === 0) break;
    prs.push(...data);
    page++;
  }
  return prs;
}

export async function fetchContributors(owner: string, name: string) {
  const perPage = 100;
  let page = 1;
  const contributors: any[] = [];
  while (true) {
    const url = `${API_BASE}/repos/${owner}/${name}/contributors?per_page=${perPage}&page=${page}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    if (data.length === 0) break;
    contributors.push(...data);
    page++;
  }
  return contributors;
}
