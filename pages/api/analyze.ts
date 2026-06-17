import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchRepoMeta, fetchAllCommits, fetchPullRequests, fetchContributors } from './github';
import { computeAllMetrics } from './metrics';
import prisma from '../../lib/prisma';
import { buildPrompt } from '../../lib/prompt';
import { callOpenAI } from '../../lib/openai';

/**
 * API route: POST /api/analyze
 * Body: { repo: "owner/name" } or { url: "https://github.com/owner/name" }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repo, url } = req.body as { repo?: string; url?: string };
  if (!repo && !url) {
    return res.status(400).json({ error: 'Missing repo identifier' });
  }

  // Normalise to owner/name
  let owner: string, name: string;
  if (repo) {
    [owner, name] = repo.split('/');
  } else {
    const match = url!.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }
    [, owner, name] = match;
  }

  try {
    // 1️⃣ Fetch raw data from GitHub
    const [meta, commits, prs, contributors] = await Promise.all([
      fetchRepoMeta(owner, name),
      fetchAllCommits(owner, name),
      fetchPullRequests(owner, name),
      fetchContributors(owner, name),
    ]);

    // 2️⃣ Compute metrics
    const metrics = computeAllMetrics(commits, prs, contributors);

    // 3️⃣ Persist repository metadata (optional, for future features)
    await prisma.repository.upsert({
      where: { owner_name: { owner, name } },
      update: { url: meta.html_url },
      create: { owner, name, url: meta.html_url },
    });

    // 4️⃣ Build prompt for LLM
    const prompt = buildPrompt({ owner, name, meta, metrics, commits });

    // 5️⃣ Call OpenAI
    const llmResponse = await callOpenAI(prompt);

    // 6️⃣ Return structured result
    return res.status(200).json({
      repository: { owner, name, url: meta.html_url },
      metrics,
      profile: llmResponse,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: error.message ?? 'Internal server error' });
  }
}
