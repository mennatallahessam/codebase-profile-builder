export function buildPrompt({
  owner,
  name,
  meta,
  metrics,
  commits,
}: {
  owner: string;
  name: string;
  meta: any;
  metrics: any;
  commits: any[];
}) {
  const recentCommitsSummary = commits
    .slice(0, 15)
    .map((c: any) => `- "${c.commit?.message || ''}" (by ${c.commit?.author?.name || 'unknown'})`)
    .join('\n');

  const ratios = metrics.ratios;

  return `You are the Codebase Personality Profiler, a witty, sarcastic, and highly insightful AI bot. Analyze the codebase metrics and recent commit history for "${owner}/${name}" to generate a hilarious, roasting, yet accurate developer personality profile.

Repository: ${owner}/${name}
Description: ${meta.description || 'No description provided.'}
Stars: ${meta.stargazers_count || 0}
Open Issues: ${meta.open_issues_count || 0}

Metrics computed:
- Fix Ratio: ${ratios.fix.toFixed(1)}% (percentage of commits containing hotfixes, bugs, fixes, resolving errors)
- Feature Ratio: ${ratios.feature.toFixed(1)}% (commits implementing features, adding code)
- Refactor Ratio: ${ratios.refactor.toFixed(1)}% (commits cleaning up code, refactoring)
- Test Ratio: ${ratios.test.toFixed(1)}% (commits writing tests, specs, jest/cypress)
- Bus Factor: ${metrics.busFactor} (number of devs who own >50% of the commits)
- Collaboration Index: ${metrics.collaborationIndex.toFixed(2)} (average authors per file)
- Commit Distribution: ${JSON.stringify(metrics.timeOfDay)}

Recent Commit Messages:
${recentCommitsSummary}

Generate a JSON response representing the codebase's personality. Keep it light-hearted, humorous, and highly engaging. Respond with EXACTLY this JSON structure:
{
  "archetype": "string (name of the personality archetype, e.g., 'The Nocturnal Firefighter', 'The Bureaucratic Architect', 'The Lone Cowboy', 'The Refactoring Addict')",
  "summary": "string (a witty paragraph roasting/describing the codebase based on its metrics and commit history)",
  "traits": [
    {
      "name": "string (name of the trait, e.g., 'Developer Anxiety', 'Test Phobia', 'Lone Wolf Syndrome', 'Code Hoarding')",
      "score": number (0 to 100),
      "description": "string (a funny description explaining why they got this score, referencing the metrics)",
      "evidence": "string (referencing specific commit messages, authors, or metrics as hilarious proof)"
    }
  ],
  "predictions": [
    "string (funny future predictions for the project)"
  ],
  "shareableBadges": [
    "string (2-3 short funny badges/tags, e.g., 'Midnight Coder', 'Production Tester', 'Git Anarchist')"
  ]
}

Return ONLY the raw JSON. Do not include markdown code block syntax (like \`\`\`json) in your response. Just return the valid JSON string.`;
}

export function buildContributorsPrompt(contributorsMetrics: any[]) {
  const summarizedMetrics = contributorsMetrics.map((c) => ({
    username: c.username,
    commitsCount: c.commitsCount,
    additions: c.additions,
    deletions: c.deletions,
    avgCommitSize: c.averageCommitSize,
    fixRatio: c.ratios.fix.toFixed(1) + '%',
    featRatio: c.ratios.feature.toFixed(1) + '%',
    refactorRatio: c.ratios.refactor.toFixed(1) + '%',
    testRatio: c.ratios.test.toFixed(1) + '%',
    longestStreak: c.streaks.longestStreak,
    prsOpened: c.prsOpened,
    prsMerged: c.prsMerged,
    topLanguage: c.languages[0]?.language || 'unknown',
  }));

  return `You are the Codebase Personality Profiler, a witty and highly sarcastic AI bot. Analyze the metrics of each contributor in the repository to generate hilarious, roasting, yet accurate developer personality profiles.

Contributors data:
${JSON.stringify(summarizedMetrics, null, 2)}

Generate a JSON response containing an array of contributor profiles under a "contributors" key. Keep it extremely light-hearted, humorous, and highly engaging. Respond with EXACTLY this JSON structure:
{
  "contributors": [
    {
      "username": "string (matching the username in the input data)",
      "archetype": "string (name of the personality archetype, e.g., 'The Midnight Refactorer', 'The Drive-By Committer', 'The Test Whisperer', 'The One-Line Hero')",
      "summary": "string (a witty paragraph roasting/describing their developer style based on their stats)",
      "traits": [
        {
          "name": "string (name of the trait, e.g., 'Anxiety Index', 'Review Allergy', 'Line Bloater')",
          "score": number (0 to 100),
          "description": "string (funny description explaining why they got this score)"
        }
      ],
      "superlatives": [
        "string (2 funny tags, e.g., 'Night Owl', 'Weekend Warrior', 'Git Anarchist')"
      ],
      "funFact": "string (one specific, true, stat-derived observation, e.g., 'Writes commits that are 90% deletion and 10% coding')"
    }
  ]
}

Return ONLY the raw JSON. Do not include markdown code block syntax (like \`\`\`json) in your response. Just return the valid JSON string.`;
}

