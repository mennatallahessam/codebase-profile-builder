export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { fetchRepoMeta, fetchAllCommits, fetchPullRequests, fetchContributors } from '../../../lib/github';
import { computeAllMetrics } from '../../../lib/metrics';
import prisma from '../../../lib/prisma';
import { buildPrompt } from '../../../lib/prompt';
import { callOpenAI } from '../../../lib/openai';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { repo, url } = body as { repo?: string; url?: string };
    if (!repo && !url) {
      return NextResponse.json({ error: 'Missing repository identifier or URL' }, { status: 400 });
    }

    // Normalise to owner/name
    let owner = '';
    let name = '';
    if (repo) {
      const parts = repo.split('/');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return NextResponse.json({ error: 'Invalid repository format. Use "owner/name".' }, { status: 400 });
      }
      [owner, name] = parts;
    } else if (url) {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match || !match[1] || !match[2]) {
        return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
      }
      owner = match[1];
      name = match[2].replace(/\.git$/, ''); // Strip potential trailing .git
    }

    // 1️⃣ Fetch data from GitHub API
    const [meta, commits, prs, contributors] = await Promise.all([
      fetchRepoMeta(owner, name),
      fetchAllCommits(owner, name),
      fetchPullRequests(owner, name),
      fetchContributors(owner, name),
    ]);

    // 2️⃣ Compute Metrics
    const metrics = computeAllMetrics(commits, prs, contributors);

    // 3️⃣ Attempt database persistence (gracefully degrade if DB fails)
    try {
      await prisma.repository.upsert({
        where: { owner_name: { owner, name } },
        update: { url: meta.html_url },
        create: { owner, name, url: meta.html_url },
      });
    } catch (dbError) {
      console.warn('Prisma database operation failed, skipping persistence:', dbError);
    }

    // 4️⃣ Construct LLM prompt
    const prompt = buildPrompt({ owner, name, meta, metrics, commits });

    // 5️⃣ Call OpenAI (or fall back to mock)
    const llmResponse = await callOpenAI(prompt);

    // 6️⃣ Respond
    return NextResponse.json({
      repository: { owner, name, url: meta.html_url, description: meta.description, stars: meta.stargazers_count },
      metrics,
      profile: llmResponse,
    });

  } catch (error: any) {
    console.error('Analysis endpoint failure:', error);
    let message = 'Internal server error';
    let status = 500;

    if (error.response) {
      if (error.response.status === 404) {
        message = 'Repository not found. Ensure it is public and correct.';
        status = 404;
      } else if (error.response.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
        message = 'GitHub API rate limit exceeded. Try again later or set a GITHUB_TOKEN.';
        status = 429;
      } else if (error.response.status === 401) {
        message = 'GitHub access token is invalid.';
        status = 401;
      } else {
        message = error.response.data?.message || message;
        status = error.response.status;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
