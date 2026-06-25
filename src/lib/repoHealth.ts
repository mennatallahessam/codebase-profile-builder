import { Commit } from '../../types';

export interface FileHotspot {
  name: string;
  path: string;
  churn: number; // number of modifications
  size: number;  // estimated code lines/changes
  lastModifiedDaysAgo: number;
}

export interface DependencyInfo {
  name: string;
  version: string;
  isDev: boolean;
  isStale: boolean; // computed signal
}

export interface RepoHealthMetrics {
  hotspots: FileHotspot[];
  languages: { name: string; value: number }[];
  dependencies: DependencyInfo[];
  riskScore: number;
  riskReasons: string[];
}

export function computeRepoHealth(
  commits: Commit[],
  packageJsonData: any // passed from GitHub API content
): RepoHealthMetrics {
  // 1. Churn and Hotspots Map
  const fileStats = new Map<string, { churn: number; size: number; lastModified: Date }>();
  
  const latestDate = commits.length > 0 && commits[0].commit?.author?.date 
    ? new Date(commits[0].commit.author.date) 
    : new Date();

  commits.forEach((c) => {
    if (!c.files || !Array.isArray(c.files)) return;
    const date = c.commit?.author?.date ? new Date(c.commit.author.date) : latestDate;
    
    c.files.forEach((f) => {
      if (!f.filename) return;
      
      const changes = f.changes || (f.additions + f.deletions) || 0;
      const stats = fileStats.get(f.filename) || { churn: 0, size: 0, lastModified: date };
      
      stats.churn += 1;
      stats.size += changes;
      if (date.getTime() > stats.lastModified.getTime()) {
        stats.lastModified = date;
      }
      fileStats.set(f.filename, stats);
    });
  });

  const hotspots: FileHotspot[] = Array.from(fileStats.entries())
    .map(([path, stats]) => {
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      const diffTime = Math.abs(latestDate.getTime() - stats.lastModified.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        name,
        path,
        churn: stats.churn,
        size: stats.size,
        lastModifiedDaysAgo: diffDays,
      };
    })
    .sort((a, b) => b.churn - a.churn)
    .slice(0, 15); // Top 15 hotspots

  // 2. Language/extension composition
  const extCounts = new Map<string, number>();
  fileStats.forEach((_, path) => {
    const idx = path.lastIndexOf('.');
    if (idx !== -1) {
      const ext = path.slice(idx + 1).toLowerCase();
      if (ext.length > 0 && ext.length < 6) {
        extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
      }
    }
  });

  const languages = Array.from(extCounts.entries())
    .map(([ext, count]) => {
      let name = ext.toUpperCase();
      if (ext === 'ts') name = 'TypeScript';
      else if (ext === 'tsx') name = 'TypeScript (React)';
      else if (ext === 'js') name = 'JavaScript';
      else if (ext === 'jsx') name = 'JavaScript (React)';
      else if (ext === 'css') name = 'CSS';
      else if (ext === 'json') name = 'JSON';
      else if (ext === 'md') name = 'Markdown';
      return { name, value: count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // 3. Dependency snapshot
  const dependencies: DependencyInfo[] = [];
  if (packageJsonData) {
    const deps = packageJsonData.dependencies || {};
    const devDeps = packageJsonData.devDependencies || {};
    
    // Simple mock staleness evaluation: flag specific common packages if versions look old
    const checkStale = (name: string, ver: string) => {
      const cleanVer = ver.replace(/[\^~]/, '');
      const firstNum = parseInt(cleanVer.split('.')[0]);
      
      // Basic check: flag React <= 17, Next <= 12, Tailwind <= 2, ESLint <= 7 as old
      if (name === 'react' && firstNum <= 17) return true;
      if (name === 'next' && firstNum <= 12) return true;
      if (name === 'tailwind' && firstNum <= 2) return true;
      if (name === 'eslint' && firstNum <= 7) return true;
      return false;
    };

    Object.entries(deps).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: version as string,
        isDev: false,
        isStale: checkStale(name, version as string),
      });
    });

    Object.entries(devDeps).forEach(([name, version]) => {
      dependencies.push({
        name,
        version: version as string,
        isDev: true,
        isStale: checkStale(name, version as string),
      });
    });
  }

  // 4. Overall Risk Score computation (0-100)
  let baseRisk = 20; // baseline risk for any project
  const riskReasons: string[] = [];

  // Evaluate Bus Factor
  const authorCounts = new Map<string, number>();
  commits.forEach((c) => {
    const author = c.author?.login || c.commit?.author?.name || 'unknown';
    authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
  });
  const totalCommits = commits.length;
  const sortedAuthors = Array.from(authorCounts.values()).sort((a, b) => b - a);
  
  let cumulative = 0;
  let busFactor = 0;
  for (const count of sortedAuthors) {
    cumulative += count;
    busFactor++;
    if (cumulative >= totalCommits * 0.5) break;
  }

  if (busFactor === 1) {
    baseRisk += 30;
    riskReasons.push('Critical Bus Factor: A single author owns >50% of the codebase.');
  } else if (busFactor === 2) {
    baseRisk += 15;
    riskReasons.push('Low Bus Factor: Only 2 authors own >50% of the code.');
  }

  // Evaluate testing keywords
  const testCommits = commits.filter((c) => {
    const msg = c.commit?.message?.toLowerCase() || '';
    return ['test', 'spec', 'jest', 'cypress', 'mocha', 'assert'].some((kw) => msg.includes(kw));
  }).length;
  const testRatio = totalCommits > 0 ? (testCommits / totalCommits) * 100 : 0;

  if (testRatio < 2) {
    baseRisk += 25;
    riskReasons.push('Extreme Test Phobia: Less than 2% of commit logs mention tests.');
  } else if (testRatio < 7) {
    baseRisk += 10;
    riskReasons.push('Low Test Coverage: Under 7% of commit messages relate to specs/testing.');
  }

  // Evaluate Churn Hotspots
  const highChurnCount = hotspots.filter((h) => h.churn >= 8).length;
  if (highChurnCount >= 5) {
    baseRisk += 15;
    riskReasons.push('High Code Churn: Multiple files are modified frequently, indicating structural instability.');
  }

  // Evaluate Bug Fix Ratios
  const fixCommits = commits.filter((c) => {
    const msg = c.commit?.message?.toLowerCase() || '';
    return ['fix', 'bug', 'patch', 'error', 'resolve'].some((kw) => msg.includes(kw));
  }).length;
  const fixRatio = totalCommits > 0 ? (fixCommits / totalCommits) * 100 : 0;

  if (fixRatio > 45) {
    baseRisk += 15;
    riskReasons.push('High Anxiety Level: Over 45% of changes are bug fixes, suggesting production unstableness.');
  }

  const riskScore = Math.min(Math.round(baseRisk), 100);

  if (riskReasons.length === 0) {
    riskReasons.push('Healthy code indicators: Code ownership is distributed and tests are routinely logged.');
  }

  return {
    hotspots,
    languages,
    dependencies,
    riskScore,
    riskReasons,
  };
}
