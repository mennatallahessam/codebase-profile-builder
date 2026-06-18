import { Commit, PullRequest, Contributor } from '../../types';

/**
 * Utility helpers to compute various repository metrics.
 * These are simplified implementations – they capture the core ideas described in the spec.
 */

/** Commit frequency per day */
export function commitsPerDay(commits: Commit[]) {
  const map = new Map<string, number>(); // YYYY-MM-DD -> count
  commits.forEach((c) => {
    if (!c.commit?.author?.date) return;
    const date = new Date(c.commit.author.date).toISOString().slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

/** Commit frequency per week */
export function commitsPerWeek(commits: Commit[]) {
  const map = new Map<string, number>(); // year-week -> count
  commits.forEach((c) => {
    if (!c.commit?.author?.date) return;
    const d = new Date(c.commit.author.date);
    const year = d.getUTCFullYear();
    const week = getWeekNumber(d);
    const key = `${year}-W${week}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([week, count]) => ({ week, count }));
}

function getWeekNumber(d: Date) {
  // ISO week number algorithm
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCDate(target.getUTCDate() + ((4 - target.getUTCDay() + 7) % 7));
  }
  const weekNo = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return weekNo;
}

/** Time‑of‑day distribution */
export function timeOfDayDistribution(commits: Commit[]) {
  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  commits.forEach((c) => {
    if (!c.commit?.author?.date) return;
    const hour = new Date(c.commit.author.date).getUTCHours();
    if (hour >= 6 && hour < 12) buckets.morning++;
    else if (hour >= 12 && hour < 18) buckets.afternoon++;
    else if (hour >= 18 && hour < 24) buckets.evening++;
    else buckets.night++;
  });
  const total = commits.length || 1;
  return Object.entries(buckets).map(([period, count]) => ({ period, percent: (count / total) * 100 }));
}

/** Simple ratio helpers */
export function ratioByKeyword(commits: Commit[], keywords: string[]) {
  const total = commits.length || 1;
  const matching = commits.filter((c) => {
    if (!c.commit?.message) return false;
    const msg = c.commit.message.toLowerCase();
    return keywords.some((kw) => msg.includes(kw));
  }).length;
  return (matching / total) * 100;
}

/** Fix ratio */
export function fixRatio(commits: Commit[]) {
  return ratioByKeyword(commits, ['fix', 'bug', 'hotfix', 'patch', 'resolve', 'error']);
}
/** Feature ratio */
export function featureRatio(commits: Commit[]) {
  return ratioByKeyword(commits, ['feat', 'feature', 'add', 'implement', 'new']);
}
/** Refactor ratio */
export function refactorRatio(commits: Commit[]) {
  return ratioByKeyword(commits, ['refactor', 'cleanup', 'restructure', 'reorganize', 'optimise', 'optimize']);
}
/** Test ratio */
export function testRatio(commits: Commit[]) {
  return ratioByKeyword(commits, ['test', 'spec', 'testing', 'jest', 'cypress', 'mock']);
}

/** Bus factor – number of contributors that own >50% of commits */
export function busFactor(commits: Commit[]): number {
  const authorCounts = new Map<string, number>();
  commits.forEach((c) => {
    const author = c.author?.login || c.commit?.author?.name || 'unknown';
    authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
  });
  const total = commits.length;
  if (total === 0) return 0;
  const sorted = Array.from(authorCounts.values()).sort((a, b) => b - a);
  let cumulative = 0;
  let members = 0;
  for (const count of sorted) {
    cumulative += count;
    members++;
    if (cumulative >= total * 0.5) break;
  }
  return members;
}

/** Collaboration index – average number of distinct authors per file */
export function collaborationIndex(commits: Commit[]) {
  const fileAuthors = new Map<string, Set<string>>();
  commits.forEach((c) => {
    const author = c.author?.login || c.commit?.author?.name || 'unknown';
    const files = c.files?.map((f) => f.filename) ?? [];
    files.forEach((file) => {
      if (!fileAuthors.has(file)) fileAuthors.set(file, new Set());
      fileAuthors.get(file)!.add(author);
    });
  });
  const totals = Array.from(fileAuthors.values()).map((set) => set.size);
  if (totals.length === 0) return 0;
  return totals.reduce((a, b) => a + b, 0) / totals.length;
}

/** Export a single object containing all calculations */
export function computeAllMetrics(commits: Commit[], prs: PullRequest[], contributors: Contributor[]) {
  return {
    commitFrequency: {
      perDay: commitsPerDay(commits),
      perWeek: commitsPerWeek(commits),
    },
    timeOfDay: timeOfDayDistribution(commits),
    ratios: {
      fix: fixRatio(commits),
      feature: featureRatio(commits),
      refactor: refactorRatio(commits),
      test: testRatio(commits),
    },
    busFactor: busFactor(commits),
    collaborationIndex: collaborationIndex(commits),
  };
}
