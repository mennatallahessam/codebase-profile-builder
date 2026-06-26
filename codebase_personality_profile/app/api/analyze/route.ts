// File: app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRepoData } from '../../../lib/github';
import { callOpenAI } from '../../../lib/openai';

interface ContributorCache {
  contributorMetrics?: { detailsJson: string };
  contributorProfile?: { archetype: string };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo query params required' }, { status: 400 });
  }

  const cached = await getRepoData(owner, repo);
  const health = cached.healthJson ? JSON.parse(cached.healthJson as string) : null;

  const contributors = (cached.contributors as ContributorCache[]).map((c: ContributorCache) => {
    const cMetrics = c.contributorMetrics ? JSON.parse(c.contributorMetrics.detailsJson) : null;
    const cProfile = c.contributorProfile ? { archetype: c.contributorProfile.archetype } : null;
    return { metrics: cMetrics, profile: cProfile };
  });

  const analysis = await callOpenAI({ owner, repo, health, contributors });
  return NextResponse.json({ analysis });
}
