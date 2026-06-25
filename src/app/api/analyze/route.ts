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

    // Read custom API credentials from headers
    const customGithubToken = req.headers.get('x-github-token') || undefined;
    const customOpenAiKey = req.headers.get('x-openai-key') || undefined;

    // Normalise to owner/name
    let owner = '';
    let name = '';
    if (repo) {
      const trimmed = repo.trim();
      const parts = trimmed.split('/');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return NextResponse.json({ error: 'Invalid repository format. Use "owner/name".' }, { status: 400 });
      }
      [owner, name] = parts;
    } else if (url) {
      // Strip trailing slashes, query strings, fragments and whitespace
      const cleanUrl = url.trim().replace(/[/?#].*$|\/+$/, (m, offset, str) => {
        // Only strip after the repo name segment
        const ghMatch = str.match(/github\.com\/([^/]+)\/([^/?#]+)/);
        return ghMatch ? '' : m;
      });
      const match = (url.trim()).match(/github\.com\/([^/\s?#]+)\/([^/\s?#]+)/);
      if (!match || !match[1] || !match[2]) {
        return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
      }
      owner = match[1];
      name = match[2].replace(/\.git$/, '').replace(/\s.*$/, ''); // Strip .git and anything after whitespace
    }

    // ✅ 0️⃣ Cache-first: return stored result if analyzed within the last hour
    try {
      const cached = await prisma.repository.findUnique({
        where: { owner_name: { owner, name } },
        include: {
          contributors: {
            include: {
              contributorMetrics: true,
              contributorProfile: true,
            },
          },
        },
      });

      if (cached && cached.profileJson && cached.metricsJson) {
        const ageMs = Date.now() - new Date(cached.createdAt).getTime();
        const ONE_HOUR = 60 * 60 * 1000;
        if (ageMs < ONE_HOUR) {
          console.log(`Cache hit for ${owner}/${name} (${Math.round(ageMs / 60000)}m old) — skipping GitHub API.`);
          const profile = JSON.parse(cached.profileJson as string);
          const metrics = JSON.parse(cached.metricsJson as string);
          const health = cached.healthJson ? JSON.parse(cached.healthJson as string) : null;

          const contributors = cached.contributors.map((c) => {
            const cMetrics = c.contributorMetrics ? JSON.parse(c.contributorMetrics.detailsJson as string) : {};
            const cProfile = c.contributorProfile ? {
              archetype: c.contributorProfile.archetype,
              summary: c.contributorProfile.summary,
              traits: JSON.parse(c.contributorProfile.traitsJson as string),
              superlatives: JSON.parse(c.contributorProfile.superlativesJson as string),
              funFact: c.contributorProfile.funFact,
            } : { archetype: 'The Developer', summary: '', traits: [], superlatives: [], funFact: '' };

            return { username: c.username, avatarUrl: c.avatarUrl, displayName: c.displayName, ...cMetrics, profile: cProfile };
          });

          return NextResponse.json({
            id: cached.id,
            repository: { owner, name, url: cached.url },
            metrics,
            profile,
            health,
            contributors,
            collaborationGraph: [],
            lastAnalyzed: cached.createdAt.toISOString(),
            fromCache: true,
          });
        }
      }
    } catch (cacheErr) {
      console.warn('Cache lookup failed, proceeding with fresh fetch:', cacheErr);
    }

    // 1️⃣ Fetch data from GitHub API
    const [meta, commits, prs, contributors, stats, packageJson] = await Promise.all([
      fetchRepoMeta(owner, name, customGithubToken),
      fetchAllCommits(owner, name, customGithubToken),
      fetchPullRequests(owner, name, customGithubToken),
      fetchContributors(owner, name, customGithubToken),
      fetchContributorStats(owner, name, customGithubToken),
      fetchPackageJson(owner, name, customGithubToken),
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
      callOpenAI(prompt, customOpenAiKey),
      callOpenAIForContributors(contributorsPrompt, contributorMetrics, customOpenAiKey),
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
        message = 'Repository not found. Make sure it is public and the name is correct (e.g. "facebook/react").';
        status = 404;
      } else if (error.response.status === 403) {
        const resetEpoch = parseInt(error.response.headers['x-ratelimit-reset'] || '0', 10);
        const remaining = error.response.headers['x-ratelimit-remaining'];
        const rateLimitMsg = error.response.data?.message || '';

        if (remaining === '0' || rateLimitMsg.toLowerCase().includes('rate limit')) {
          let resetInfo = '';
          if (resetEpoch) {
            const resetDate = new Date(resetEpoch * 1000);
            const mins = Math.ceil((resetDate.getTime() - Date.now()) / 60000);
            resetInfo = ` Resets in ~${mins} minute${mins !== 1 ? 's' : ''}.`;
          }
          message = `GitHub API rate limit exceeded (60 requests/hour for unauthenticated users).${resetInfo} Fix: add your GitHub Personal Access Token to the GITHUB_TOKEN variable in the .env file to get 5,000 requests/hour.`;
          status = 429;
        } else if (rateLimitMsg.toLowerCase().includes('too large')) {
          message = 'This repository is too large for GitHub\'s contributor API. Try a smaller repository.';
          status = 403;
        } else {
          message = rateLimitMsg || 'GitHub API returned 403 Forbidden. Your GITHUB_TOKEN may be invalid or lack repo read permissions.';
          status = 403;
        }
      } else if (error.response.status === 401) {
        message = 'GitHub access token is invalid. Check your GITHUB_TOKEN in the .env file.';
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

