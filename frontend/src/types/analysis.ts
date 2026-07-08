export interface Trait {
  name: string;
  score: number;
  description: string;
  evidence: string;
}

export interface AnalysisResult {
  id: number;
  repository: {
    owner: string;
    name: string;
    url: string;
    description?: string;
    stars?: number;
  };
  metrics: {
    commitFrequency: {
      perDay: { date: string; count: number }[];
      perWeek: { week: string; count: number }[];
    };
    timeOfDay: { period: string; percent: number }[];
    ratios: {
      fix: number;
      feature: number;
      refactor: number;
      test: number;
    };
    busFactor: number;
    collaborationIndex: number;
  };
  profile: {
    aboutProject?: string;
    techStack?: string[];
    archetype: string;
    summary: string;
    traits: Trait[];
    predictions: string[];
    shareableBadges: string[];
  };
  health: {
    riskScore: number;
    riskReasons: string[];
    hotspots: FileHotspot[];
    languages: { name: string; value: number }[];
    dependencies: DependencyInfo[];
  };
  contributors: ContributorDetail[];
  collaborationGraph: CollaborationEdge[];
  lastAnalyzed: string;
}

export interface FileHotspot {
  name: string;
  path: string;
  churn: number;
  size: number;
  lastModifiedDaysAgo: number;
}

export interface DependencyInfo {
  name: string;
  version: string;
  isDev: boolean;
  isStale: boolean;
}

export interface ContributorDetail {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  commitsCount: number;
  netLines: number;
  additions: number;
  deletions: number;
  averageCommitSize: number;
  prsMerged: number;
  averageTimeToMerge: number;
  heatmap: Record<string, number>;
  timeOfDay: { period: string; percent: number }[];
  ratios: {
    fix: number;
    feature: number;
    refactor: number;
    test: number;
  };
  streaks: {
    longestStreak: number;
    currentStreak: number;
  };
  mostActiveDay: { count: number };
  profile: {
    archetype: string;
    summary: string;
    contributionType?: string;
    featuresImplemented?: string[];
    traits: Trait[];
    superlatives: string[];
    funFact?: string;
  };
}

export interface CollaborationEdge {
  source: string;
  target: string;
  weight: number;
}

export type AnalysisStatus = 'idle' | 'scanning' | 'success' | 'error';
export type DashboardTab =
  | 'overview'
  | 'traits'
  | 'metrics'
  | 'predictions'
  | 'contributors'
  | 'health'
  | 'compare';
