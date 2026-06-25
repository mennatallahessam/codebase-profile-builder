import { NextRequest, NextResponse } from 'next/server';
import { fetchRepoMeta, fetchAllCommits, fetchPullRequests, fetchContributors, fetchContributorStats, fetchPackageJson } from '../../../lib/github';
import { computeAllMetrics } from '../../../lib/metrics';
import { computeContributorMetrics, computeCollaborationGraph } from '../../../lib/contributors';
import { computeRepoHealth } from '../../../lib/repoHealth';
import prisma from '../../../lib/prisma';
import { buildPrompt, buildContributorsPrompt } from '../../../lib/prompt';
import { callOpenAI, callOpenAIForContributors } from '../../../lib/openai';

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
    const [meta, commits, prs, contributors, stats, packageJson] = await Promise.all([
      fetchRepoMeta(owner, name),
      fetchAllCommits(owner, name),
      fetchPullRequests(owner, name),
      fetchContributors(owner, name),
      fetchContributorStats(owner, name),
      fetchPackageJson(owner, name),
    ]);

    // 2️⃣ Compute Metrics
    const metrics = computeAllMetrics(commits, prs, contributors);
    const contributorMetrics = computeContributorMetrics(commits, prs, stats, contributors);
    const collaborationGraph = computeCollaborationGraph(commits);
    const health = computeRepoHealth(commits, packageJson);

    // 3️⃣ Construct LLM prompts
    const prompt = buildPrompt({ owner, name, meta, metrics, commits });
    const contributorsPrompt = buildContributorsPrompt(contributorMetrics);

    // 4️⃣ Call OpenAI (or fall back to mock)
    const [llmResponse, contributorsLlmResponse] = await Promise.all([
      callOpenAI(prompt),
      callOpenAIForContributors(contributorsPrompt, contributorMetrics),
    ]);

    // Map AI profiles back onto contributor metric objects
    const contributorsProfilesMap = new Map<string, any>();
    if (contributorsLlmResponse && Array.isArray(contributorsLlmResponse.contributors)) {
      contributorsLlmResponse.contributors.forEach((prof: any) => {
        if (prof.username) {
          contributorsProfilesMap.set(prof.username.toLowerCase(), prof);
        }
      });
    }

    const contributorsCombined = contributorMetrics.map((c) => {
      const profile = contributorsProfilesMap.get(c.username.toLowerCase()) || {
        archetype: 'The Developer',
        summary: 'A developer contributing changes to the repository.',
        traits: [
          { name: 'Fix Anxiety', score: 30, description: 'Normal bug fix rates.' },
          { name: 'Testing Discipline', score: 40, description: 'Standard unit tests.' },
        ],
        superlatives: ['Developer'],
        funFact: 'Contributes code consistently.',
      };
      return {
        ...c,
        profile,
      };
    });

    const fullResult = {
      id: 0,
      repository: {
        owner,
        name,
        url: meta.html_url,
        description: meta.description,
        stars: meta.stargazers_count,
      },
      metrics,
      profile: llmResponse,
      health,
      contributors: contributorsCombined,
      collaborationGraph,
      lastAnalyzed: new Date().toISOString(),
    };

    // 5️⃣ Attempt database persistence (gracefully degrade if DB fails)
    try {
      // Upsert main repo record
      const dbRepo = await prisma.repository.upsert({
        where: { owner_name: { owner, name } },
        update: {
          url: meta.html_url,
          profileJson: JSON.stringify(llmResponse),
          metricsJson: JSON.stringify(metrics),
          healthJson: JSON.stringify(health),
        },
        create: {
          owner,
          name,
          url: meta.html_url,
          profileJson: JSON.stringify(llmResponse),
          metricsJson: JSON.stringify(metrics),
          healthJson: JSON.stringify(health),
        },
      });

      fullResult.id = dbRepo.id;

      // Persist contributors, details & profiles
      for (const c of contributorsCombined) {
        const dbCont = await prisma.contributor.upsert({
          where: {
            repositoryId_username: {
              repositoryId: dbRepo.id,
              username: c.username,
            },
          },
          update: {
            avatarUrl: c.avatarUrl,
            displayName: c.displayName,
          },
          create: {
            repositoryId: dbRepo.id,
            username: c.username,
            avatarUrl: c.avatarUrl,
            displayName: c.displayName,
          },
        });

        // Upsert Contributor Metrics
        await prisma.contributorMetric.upsert({
          where: { contributorId: dbCont.id },
          update: {
            detailsJson: JSON.stringify({
              commitsCount: c.commitsCount,
              additions: c.additions,
              deletions: c.deletions,
              netLines: c.netLines,
              averageCommitSize: c.averageCommitSize,
              largestCommit: c.largestCommit,
              longestGap: c.longestGap,
              timeOfDay: c.timeOfDay,
              dayOfWeek: c.dayOfWeek,
              ratios: c.ratios,
              languages: c.languages,
              prsOpened: c.prsOpened,
              prsMerged: c.prsMerged,
              prsReviewed: c.prsReviewed,
              averageTimeToMerge: c.averageTimeToMerge,
              reviewCommentsGiven: c.reviewCommentsGiven,
              reviewCommentsReceived: c.reviewCommentsReceived,
              heatmap: c.heatmap,
              streaks: c.streaks,
              mostActiveDay: c.mostActiveDay,
            }),
          },
          create: {
            contributorId: dbCont.id,
            detailsJson: JSON.stringify({
              commitsCount: c.commitsCount,
              additions: c.additions,
              deletions: c.deletions,
              netLines: c.netLines,
              averageCommitSize: c.averageCommitSize,
              largestCommit: c.largestCommit,
              longestGap: c.longestGap,
              timeOfDay: c.timeOfDay,
              dayOfWeek: c.dayOfWeek,
              ratios: c.ratios,
              languages: c.languages,
              prsOpened: c.prsOpened,
              prsMerged: c.prsMerged,
              prsReviewed: c.prsReviewed,
              averageTimeToMerge: c.averageTimeToMerge,
              reviewCommentsGiven: c.reviewCommentsGiven,
              reviewCommentsReceived: c.reviewCommentsReceived,
              heatmap: c.heatmap,
              streaks: c.streaks,
              mostActiveDay: c.mostActiveDay,
            }),
          },
        });

        // Upsert Contributor Profile
        await prisma.contributorProfile.upsert({
          where: { contributorId: dbCont.id },
          update: {
            archetype: c.profile.archetype,
            summary: c.profile.summary,
            traitsJson: JSON.stringify(c.profile.traits),
            superlativesJson: JSON.stringify(c.profile.superlatives),
            funFact: c.profile.funFact,
          },
          create: {
            contributorId: dbCont.id,
            archetype: c.profile.archetype,
            summary: c.profile.summary,
            traitsJson: JSON.stringify(c.profile.traits),
            superlativesJson: JSON.stringify(c.profile.superlatives),
            funFact: c.profile.funFact,
          },
        });
      }
    } catch (dbError) {
      console.warn('Prisma database operations failed, skipping persistent cache:', dbError);
      // Give a random mock ID for session consistency if DB isn't active
      fullResult.id = Math.floor(Math.random() * 1000000) + 1;
    }

    // 6️⃣ Respond
    return NextResponse.json(fullResult);

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

