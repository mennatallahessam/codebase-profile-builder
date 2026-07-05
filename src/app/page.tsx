'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import Heatmap from '../components/Heatmap';
import CollaborationGraph from '../components/CollaborationGraph';
import Treemap from '../components/Treemap';


interface Trait {
  name: string;
  score: number;
  description: string;
  evidence: string;
}

interface AnalysisResult {
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
    hotspots: any[];
    languages: { name: string; value: number }[];
    dependencies: any[];
  };
  contributors: any[];
  collaborationGraph: any[];
  lastAnalyzed: string;
}


const SCAN_MESSAGES = [
  'Establishing secure connection with GitHub API API...',
  'Retrieving repository metadata and stargazers...',
  'Fetching commit logs (capping at 300 commits for sanity)...',
  'Analyzing author signatures and commit times...',
  'Parsing pull requests and merging speed...',
  'Calculating bus factor (preparing warning sirens)...',
  'Running Codebase Metrics Engine v2.4.1...',
  'Detecting level of developer panic (fix ratios)...',
  'Analyzing testing behavior (or lack thereof)...',
  'Drafting LLM analysis report parameters...',
  'Sending metric payload to OpenAI Oracle (gpt-4o-mini)...',
  'Consulting sarcasm database...',
  'Synthesizing personality profile and predictions...',
  'Assembling visual dashboard and styling charts...',
];

export default function Home() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'traits' | 'metrics' | 'predictions' | 'contributors' | 'health' | 'compare'>('overview');
  const [isMounted, setIsMounted] = useState(false);
  const [hasGithubToken, setHasGithubToken] = useState<boolean | null>(null);

  // Settings credentials states
  const [showSettings, setShowSettings] = useState(false);
  const [clientGhToken, setClientGhToken] = useState('');
  const [clientOpenAiKey, setClientOpenAiKey] = useState('');

  // Track A: Contributor Intelligence state
  const [selectedContributor, setSelectedContributor] = useState<any | null>(null);
  const [contributorSort, setContributorSort] = useState<'commits' | 'lines' | 'chaos'>('commits');
  const [contributorFilter, setContributorFilter] = useState<'all' | 'active'>('all');
  const [selectedCompareUsers, setSelectedCompareUsers] = useState<string[]>([]);
  const [showCompareUsersPanel, setShowCompareUsersPanel] = useState(false);

  // Track B: Repo-to-repo comparison state
  const [comparisonInput, setComparisonInput] = useState('');
  const [comparisonStatus, setComparisonStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [comparisonErrorMsg, setComparisonErrorMsg] = useState('');
  const [comparisonResult, setComparisonResult] = useState<AnalysisResult | null>(null);
  const [comparisonLogs, setComparisonLogs] = useState<string[]>([]);
  const comparisonLogIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const logEndRef = useRef<HTMLDivElement>(null);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Load local credentials
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('custom_github_token') || '';
      const savedKey = localStorage.getItem('custom_openai_key') || '';
      setClientGhToken(savedToken);
      setClientOpenAiKey(savedKey);
    }

    // Check if GITHUB_TOKEN is configured on the server or client
    fetch('/api/status')
      .then(r => r.json())
      .then(d => {
        const serverHasToken = !!d.hasGithubToken;
        const clientHasToken = typeof window !== 'undefined' && !!localStorage.getItem('custom_github_token');
        setHasGithubToken(serverHasToken || clientHasToken);
      })
      .catch(() => {
        const clientHasToken = typeof window !== 'undefined' && !!localStorage.getItem('custom_github_token');
        setHasGithubToken(clientHasToken);
      });

    return () => {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startScanningLogs = () => {
    setLogs([]);
    let index = 0;
    setLogs([`[0.0s] ${SCAN_MESSAGES[0]}`]);

    logIntervalRef.current = setInterval(() => {
      index++;
      if (index < SCAN_MESSAGES.length) {
        const elapsed = (index * 0.4).toFixed(1);
        setLogs((prev) => [...prev, `[${elapsed}s] ${SCAN_MESSAGES[index]}`]);
      } else {
        if (logIntervalRef.current) clearInterval(logIntervalRef.current);
      }
    }, 450);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setStatus('scanning');
    setErrorMsg('');
    startScanningLogs();

    try {
      const payload = input.startsWith('http') ? { url: input.trim() } : { repo: input.trim() };
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('custom_github_token');
        const key = localStorage.getItem('custom_openai_key');
        if (token && token.trim() !== '') headers['x-github-token'] = token.trim();
        if (key && key.trim() !== '') headers['x-openai-key'] = key.trim();
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (logIntervalRef.current) clearInterval(logIntervalRef.current);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      setResult(data);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong while profiling the codebase.');
      setStatus('error');
    }
  };

  const startComparisonScanningLogs = () => {
    setComparisonLogs([]);
    let index = 0;
    setComparisonLogs([`[0.0s] ${SCAN_MESSAGES[0]}`]);

    comparisonLogIntervalRef.current = setInterval(() => {
      index++;
      if (index < SCAN_MESSAGES.length) {
        const elapsed = (index * 0.4).toFixed(1);
        setComparisonLogs((prev) => [...prev, `[${elapsed}s] ${SCAN_MESSAGES[index]}`]);
      } else {
        if (comparisonLogIntervalRef.current) clearInterval(comparisonLogIntervalRef.current);
      }
    }, 450);
  };

  const handleComparisonAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparisonInput.trim()) return;

    setComparisonStatus('scanning');
    setComparisonErrorMsg('');
    startComparisonScanningLogs();

    try {
      const payload = comparisonInput.startsWith('http') ? { url: comparisonInput.trim() } : { repo: comparisonInput.trim() };
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('custom_github_token');
        const key = localStorage.getItem('custom_openai_key');
        if (token && token.trim() !== '') headers['x-github-token'] = token.trim();
        if (key && key.trim() !== '') headers['x-openai-key'] = key.trim();
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (comparisonLogIntervalRef.current) clearInterval(comparisonLogIntervalRef.current);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      setComparisonResult(data);
      setComparisonStatus('success');
    } catch (err: any) {
      console.error(err);
      setComparisonErrorMsg(err.message || 'Something went wrong while profiling the comparison codebase.');
      setComparisonStatus('error');
    }
  };

  const resetSearch = () => {
    setInput('');
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    setLogs([]);
    setSelectedContributor(null);
    setComparisonInput('');
    setComparisonResult(null);
    setComparisonStatus('idle');
    setComparisonErrorMsg('');
    setComparisonLogs([]);
    setSelectedCompareUsers([]);
    setShowCompareUsersPanel(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('custom_github_token', clientGhToken.trim());
      localStorage.setItem('custom_openai_key', clientOpenAiKey.trim());
      
      const hasClientToken = clientGhToken.trim() !== '';
      setHasGithubToken(hasClientToken || null); // null or false to trigger status check, or set directly
      // Let's re-run status fetch or set it directly based on client token
      fetch('/api/status')
        .then(r => r.json())
        .then(d => {
          setHasGithubToken(!!d.hasGithubToken || hasClientToken);
        })
        .catch(() => {
          setHasGithubToken(hasClientToken);
        });
    }
    setShowSettings(false);
  };

  // Safe formatting for ratios
  const getRatioData = () => {
    if (!result) return [];
    const { ratios } = result.metrics;
    return [
      { name: 'Features', value: parseFloat(ratios.feature.toFixed(1)), color: '#3b82f6' },
      { name: 'Fixes/Bugs', value: parseFloat(ratios.fix.toFixed(1)), color: '#ef4444' },
      { name: 'Refactors', value: parseFloat(ratios.refactor.toFixed(1)), color: '#a855f7' },
      { name: 'Tests', value: parseFloat(ratios.test.toFixed(1)), color: '#10b981' },
    ];
  };

  const getRadarData = () => {
    if (!result) return [];
    return result.profile.traits.map((t) => ({
      subject: t.name,
      score: t.score,
      fullMark: 100,
    }));
  };

  const getTimeOfDayData = () => {
    if (!result) return [];
    return result.metrics.timeOfDay.map((t) => ({
      name: t.period.charAt(0).toUpperCase() + t.period.slice(1),
      Percentage: parseFloat(t.percent.toFixed(1)),
    }));
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[#030014]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[40%] rounded-full bg-pink-900/10 blur-[150px] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-900/80 bg-slate-950/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetSearch}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Antigravity
              </span>
              <span className="text-xs block text-slate-500 font-mono tracking-widest uppercase -mt-1">
                Profiler v1.0
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>API Credentials</span>
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 md:px-8">
        
        {/* State 1: Idle Search */}
        {status === 'idle' && (
          <div className="w-full max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-mono mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              AI-Powered Codebase Personality Analyzer
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 font-[family-name:var(--font-space-grotesk)]">
              Does your code have{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Personality?
              </span>
            </h1>
            
            <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto mb-10">
              Input a GitHub repository name or URL. We will calculate statistics, analyze your commit patterns, and generate a roasting profile.
            </p>

            <form onSubmit={handleAnalyze} className="relative max-w-xl mx-auto">
              <div className="relative group">
                {/* Glowing border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur group-hover:opacity-60 transition duration-1000" />
                
                <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md">
                  <div className="pl-3 text-slate-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. facebook/react or https://github.com/facebook/react"
                    className="w-full bg-transparent text-slate-100 placeholder-slate-500 pl-3 pr-2 py-2 focus:outline-none text-sm md:text-base"
                    required
                  />
                  
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium text-sm rounded-lg px-5 py-2.5 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition"
                  >
                    Analyze
                  </button>
                </div>
              </div>

              {/* Rate limit hint — only shown when no token is configured */}
              {hasGithubToken === false && (
                <p className="mt-4 text-slate-600 text-xs font-mono">
                  ⚡ No GitHub token detected — limited to 60 API calls/hr.{' '}
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="text-indigo-500 hover:text-indigo-400 underline bg-transparent border-none p-0 cursor-pointer font-mono"
                  >
                    Add a free token
                  </button>
                  {' '}for 5,000/hr. Previously analyzed repos load from cache.
                </p>
              )}
            </form>
          </div>
        )}


        {/* State 2: Scanning Loading Logs */}
        {status === 'scanning' && (
          <div className="w-full max-w-xl bg-slate-950/80 border border-slate-900 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <span className="font-mono text-sm font-semibold text-slate-300">Scanning Repository...</span>
              </div>
              <span className="font-mono text-xs text-slate-500">Console Output</span>
            </div>

            <div className="h-64 overflow-y-auto font-mono text-xs text-indigo-400/90 space-y-2.5 p-4 rounded-xl bg-black/60 border border-black/40 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-slate-600 mr-2">&gt;&gt;</span>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            <div className="mt-5 text-center">
              <p className="text-slate-500 text-xs animate-pulse">
                Please hold. Calculating codebase metrics and consulting the AI oracle.
              </p>
            </div>
          </div>
        )}

        {/* State 3: Error */}
        {status === 'error' && (() => {
          const isRateLimit = errorMsg.toLowerCase().includes('rate limit');
          const isNotFound = errorMsg.toLowerCase().includes('not found');
          return (
            <div className={`w-full max-w-lg bg-slate-950/60 border rounded-2xl p-6 shadow-2xl backdrop-blur-md ${isRateLimit ? 'border-amber-900/40' : 'border-red-900/40'}`}>
              <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-4 ${isRateLimit ? 'bg-amber-950/50 border-amber-500/30' : 'bg-red-950/50 border-red-500/30'}`}>
                {isRateLimit ? (
                  <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-200 mb-2 text-center">
                {isRateLimit ? '⚡ GitHub Rate Limit Hit' : 'Analysis Failed'}
              </h2>

              <p className="text-slate-400 text-sm mb-5 leading-relaxed text-center">
                {errorMsg || 'We encountered an error. Make sure the repo is public and the name is correct.'}
              </p>

              {isRateLimit && (
                <div className="mb-5 bg-slate-900/80 border border-amber-900/30 rounded-xl p-4 text-left">
                  <p className="text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-3">
                    🔑 Fix: Add a GitHub Token (free, takes 60 seconds)
                  </p>
                  <ol className="text-slate-300 text-xs space-y-2 leading-relaxed list-none">
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold shrink-0">1.</span>
                      <span>Go to <a href="https://github.com/settings/tokens/new?description=Codebase+Profiler&scopes=public_repo" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300">github.com/settings/tokens</a> → "Generate new token (classic)"</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold shrink-0">2.</span>
                      <span>Check <code className="bg-black/40 px-1 rounded text-amber-300">public_repo</code> scope → click "Generate token"</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold shrink-0">3.</span>
                      <span>Open <code className="bg-black/40 px-1 rounded text-slate-200">.env</code> in the project root and set:</span>
                    </li>
                  </ol>
                  <div className="mt-2 ml-5 bg-black/50 rounded-lg px-3 py-2 font-mono text-xs text-emerald-400 border border-black/40">
                    GITHUB_TOKEN=ghp_your_token_here
                  </div>
                  <p className="text-slate-500 text-[10px] mt-2 ml-5">Then restart the dev server with <code className="text-slate-400">npm run dev</code></p>
                </div>
              )}

              {isNotFound && (
                <div className="mb-5 bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-left">
                  <p className="text-slate-400 text-xs font-mono mb-2">💡 <strong className="text-slate-300">Tips:</strong></p>
                  <ul className="text-slate-400 text-xs space-y-1.5 list-none">
                    <li>• Use the format <code className="bg-black/40 px-1 rounded text-indigo-300">owner/repo</code> (e.g. <code className="bg-black/40 px-1 rounded text-indigo-300">facebook/react</code>)</li>
                    <li>• Or paste the full URL: <code className="bg-black/40 px-1 rounded text-indigo-300">https://github.com/owner/repo</code></li>
                    <li>• The repository must be <strong className="text-slate-300">public</strong></li>
                  </ul>
                </div>
              )}

              <button
                onClick={resetSearch}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm rounded-lg border border-slate-800 active:scale-[0.98] transition"
              >
                ← Try Another Repository
              </button>
            </div>
          );
        })()}


        {/* State 4: Profile Output Dashboard */}
        {status === 'success' && result && (
          <div className="w-full max-w-5xl space-y-8 animate-[fadeIn_0.5s_ease-out]">
            
            {/* Repo Header & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/30 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H7v-2h10v2zm0-4H7V8h10v2z" clipRule="evenodd" />
                  </svg>
                  <a
                    href={result.repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-sm flex items-center gap-1.5"
                  >
                    <span>{result.repository.owner}/{result.repository.name}</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-slate-200">
                  {result.repository.name}
                </h2>
                <p className="text-slate-400 text-xs mt-1 max-w-xl">
                  {result.repository.description || 'No repository description available.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">Stars</span>
                  <span className="text-lg font-bold text-yellow-500">{result.repository.stars ?? 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">Bus Factor</span>
                  <span className={`text-lg font-bold ${result.metrics.busFactor === 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {result.metrics.busFactor}
                  </span>
                </div>
                <button
                  onClick={resetSearch}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-2.5 rounded-xl text-slate-400 hover:text-white transition"
                  title="Search another repo"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Archetype Showcase Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-950/60 to-purple-950/60 border border-slate-900/60 rounded-3xl p-6 md:p-8 shadow-xl">
              {/* Decorative radial overlay */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative max-w-3xl">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Archetype Identified
                </span>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]">
                  {result.profile.archetype}
                </h1>
                
                <p className="text-slate-350 text-base md:text-lg leading-relaxed mb-6 font-light">
                  {result.profile.summary}
                </p>

                <div className="flex flex-wrap gap-2">
                  {result.profile.shareableBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-300 text-xs font-mono"
                    >
                      # {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Overview & Tech Stack Card */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-start">
                {/* Left: About Project */}
                <div className="flex-grow space-y-3">
                  <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Project Overview
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed font-light">
                    {result.profile.aboutProject || result.repository.description || 'No detailed overview available.'}
                  </p>
                </div>
                {/* Right: Tech Stack Badges */}
                <div className="md:w-72 shrink-0 space-y-3">
                  <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    Tech Stack Used
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(result.profile.techStack || (result.health?.languages?.map((l: any) => l.name) || ['JavaScript'])).map((tech: string, idx: number) => {
                      const colors = [
                        'from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20',
                        'from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20',
                        'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20',
                        'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20',
                        'from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20',
                      ];
                      const chosenStyle = colors[idx % colors.length];
                      return (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg border bg-gradient-to-tr text-xs font-mono font-medium ${chosenStyle}`}
                        >
                          {tech}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs & Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Navigation Tabs & Simple Visualizations */}
              <div className="md:col-span-4 space-y-4">
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-2.5 backdrop-blur-md flex md:flex-col gap-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                      activeTab === 'overview'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => { setSelectedContributor(null); setActiveTab('contributors'); }}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                      activeTab === 'contributors'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    Contributors
                  </button>
                  <button
                    onClick={() => setActiveTab('health')}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                      activeTab === 'health'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    Code Health & Risk
                  </button>
                  <button
                    onClick={() => setActiveTab('traits')}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                      activeTab === 'traits'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    Humorous Traits
                  </button>
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                      activeTab === 'metrics'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    Metrics Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('compare')}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                      activeTab === 'compare'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    Compare Repos
                  </button>
                  <button
                    onClick={() => setActiveTab('predictions')}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                      activeTab === 'predictions'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    Predictions & Roasts
                  </button>
                </div>

                {/* Micro Widget: Bus Factor Warning */}
                {result.metrics.busFactor === 1 && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-5 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-red-400 text-sm font-semibold mb-1">Bus Factor Alert</h4>
                        <p className="text-slate-450 text-xs leading-relaxed">
                          A bus factor of 1 means this entire empire is built inside one developer's mind. Pray they don't buy a lottery ticket or go offline.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Active Tab Display */}
              <div className="md:col-span-8">
                
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Radar Chart Card */}
                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Trait Radar</h3>
                        <div className="h-64 flex items-center justify-center">
                          {isMounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                              </RadarChart>
                            </ResponsiveContainer>
                          ) : (
                            <span className="text-slate-500 text-xs">Loading Radar...</span>
                          )}
                        </div>
                      </div>

                      {/* Commit Ratios Card */}
                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Commit Types (%)</h3>
                        
                        <div className="space-y-4 mt-6">
                          {getRatioData().map((item, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">{item.name}</span>
                                <span className="font-mono text-slate-300 font-bold">{item.value}%</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${item.value}%`,
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Callout Quotes */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Evidence Logs</h3>
                      <div className="space-y-4">
                        {result.profile.traits.slice(0, 2).map((trait, idx) => (
                          <div key={idx} className="p-4 bg-slate-900/50 rounded-xl border border-slate-850">
                            <span className="text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest block mb-1">
                              {trait.name} EVIDENCE
                            </span>
                            <p className="text-slate-300 text-xs italic font-mono leading-relaxed bg-black/35 p-3 rounded-lg border border-black/20">
                              "{trait.evidence}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Share & Embed Badge Controls */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md space-y-6">
                      <div>
                        <h3 className="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">Public Permalink</h3>
                        <p className="text-slate-400 text-xs mb-3">Share this exact profile report using a permanent read-only link:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={typeof window !== 'undefined' ? `${window.location.origin}/report/${result.id}` : ''}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 w-full focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/report/${result.id}`);
                              alert('Permalink copied to clipboard!');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 transition shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-4">
                        <h3 className="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">Embeddable README Badge</h3>
                        <p className="text-slate-400 text-xs mb-3">Add this live status badge to your repository's README.md:</p>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-xs text-slate-500 font-mono">Live Preview:</span>
                          <img
                            src={`/api/badge/${result.repository.owner}/${result.repository.name}`}
                            alt="Status Badge"
                            className="h-5"
                          />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block mb-1">Markdown</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                readOnly
                                value={typeof window !== 'undefined' ? `[![Codebase Profiler](${window.location.origin}/api/badge/${result.repository.owner}/${result.repository.name})](${window.location.origin}/report/${result.id})` : ''}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 w-full focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`[![Codebase Profiler](${window.location.origin}/api/badge/${result.repository.owner}/${result.repository.name})](${window.location.origin}/report/${result.id})`);
                                  alert('Markdown copied to clipboard!');
                                }}
                                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 transition shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: HUMOROUS TRAITS */}
                {activeTab === 'traits' && (
                  <div className="space-y-6">
                    {result.profile.traits.map((trait, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/40 border border-slate-900 hover:border-slate-850 rounded-2xl p-6 backdrop-blur-md transition"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-bold text-slate-200 font-[family-name:var(--font-space-grotesk)]">
                            {trait.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs font-mono">Severity:</span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                                trait.score > 75
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : trait.score > 40
                                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {trait.score}/100
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-350 text-sm leading-relaxed mb-4">
                          {trait.description}
                        </p>

                        <div className="bg-black/30 border border-black/20 rounded-xl p-3 flex items-start gap-2.5">
                          <span className="text-slate-650 font-mono text-xs select-none shrink-0 mt-0.5">&gt; Evidence:</span>
                          <span className="text-indigo-300 font-mono text-xs italic">
                            {trait.evidence}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: METRICS DASHBOARD */}
                {activeTab === 'metrics' && (
                  <div className="space-y-6">
                    {/* Time distribution Bar Chart */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">
                        Commit Time of Day Distribution
                      </h3>
                      <div className="h-64 w-full">
                        {isMounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getTimeOfDayData()}>
                              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#0f172a',
                                  borderColor: '#1e293b',
                                  borderRadius: '12px',
                                  color: '#e2e8f0',
                                }}
                              />
                              <Bar dataKey="Percentage" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <span className="text-slate-500 text-xs">Loading Chart...</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Stats grid */}
                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider mb-1">
                            Collaboration Index
                          </span>
                          <h4 className="text-2xl font-bold text-slate-200">
                            {result.metrics.collaborationIndex.toFixed(2)}
                          </h4>
                        </div>
                        <p className="text-slate-550 text-xs mt-3 leading-relaxed">
                          The average number of unique authors contributing to each touched file. Higher numbers represent collaborative coding; lower numbers indicate strict territorial silos.
                        </p>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider mb-1">
                            Developer Anxiety Index
                          </span>
                          <h4 className="text-2xl font-bold text-red-400">
                            {result.metrics.ratios.fix.toFixed(1)}%
                          </h4>
                        </div>
                        <p className="text-slate-550 text-xs mt-3 leading-relaxed">
                          The percentage of commit messages explicitly cataloged as bug fixes or patches. A high percentage implies aggressive debugging or chaotic development.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: PREDICTIONS & ROASTS */}
                {activeTab === 'predictions' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950/50 to-purple-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">AI Predictions & Future Roasts</h3>
                      </div>
                      <p className="text-slate-500 text-xs mb-6">Based on commit patterns, coding style, and developer personality metrics, the AI Oracle predicts the following futures for this codebase:</p>
                      <div className="space-y-4">
                        {result.profile.predictions.map((prediction, idx) => (
                          <div
                            key={idx}
                            className="relative p-4 bg-slate-900/50 border border-slate-900 rounded-xl overflow-hidden group hover:border-slate-800 transition"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-l-xl" />
                            <div className="pl-4">
                              <div className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5 font-mono text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                  #{String(idx + 1).padStart(2, '0')}
                                </span>
                                <p className="text-slate-300 text-sm leading-relaxed">{prediction}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shareable Badges */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Achievement Badges Unlocked</h3>
                      <div className="flex flex-wrap gap-3">
                        {result.profile.shareableBadges.map((badge, idx) => {
                          const colors = [
                            'from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-300',
                            'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-300',
                            'from-pink-500/10 to-rose-500/10 border-pink-500/20 text-pink-300',
                            'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300',
                            'from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-300',
                          ];
                          const color = colors[idx % colors.length];
                          return (
                            <span
                              key={idx}
                              className={`px-4 py-2 rounded-xl border bg-gradient-to-r ${color} text-xs font-mono font-semibold tracking-wide`}
                            >
                              🏆 #{badge}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fun roast copy button */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 text-center">
                      <p className="text-slate-500 text-xs mb-3">Export predictions for your team standup or post on your README:</p>
                      <button
                        onClick={() => {
                          const text = `🔮 AI Predictions for ${result.repository.owner}/${result.repository.name} (${result.profile.archetype}):\n\n${result.profile.predictions.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
                          navigator.clipboard.writeText(text);
                          alert('Predictions copied to clipboard!');
                        }}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-xs rounded-lg px-5 py-2.5 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition"
                      >
                        Copy All Predictions
                      </button>
                    </div>
                  </div>
                )}


                {/* TAB 5: CONTRIBUTORS */}
                {activeTab === 'contributors' && (
                  <div className="space-y-8">
                    {!selectedContributor ? (
                      <>
                        {/* Leaderboards and Bus Factor Explorer */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Leaderboards Panel */}
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">
                              Team Leaderboards
                            </h3>
                            <div className="space-y-4">
                              {/* Most Commits */}
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono block mb-2">MOST COMMITS</span>
                                <div className="space-y-1.5">
                                  {result.contributors.slice(0, 3).map((c, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg">
                                      <span className="text-slate-300 font-mono">#{i+1} {c.username}</span>
                                      <span className="font-bold text-indigo-400">{c.commitsCount} commits</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Longest Streak */}
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono block mb-2">LONGEST STREAK</span>
                                <div className="space-y-1.5">
                                  {[...result.contributors]
                                    .sort((a, b) => b.streaks.longestStreak - a.streaks.longestStreak)
                                    .slice(0, 3)
                                    .map((c, i) => (
                                      <div key={i} className="flex justify-between items-center text-xs bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg">
                                        <span className="text-slate-300 font-mono">#{i+1} {c.username}</span>
                                        <span className="font-bold text-purple-400">{c.streaks.longestStreak} days</span>
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* PR Speed */}
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono block mb-2">FASTEST PR MERGER</span>
                                <div className="space-y-1.5">
                                  {[...result.contributors]
                                    .filter(c => c.prsMerged > 0)
                                    .sort((a, b) => a.averageTimeToMerge - b.averageTimeToMerge)
                                    .slice(0, 3)
                                    .map((c, i) => (
                                      <div key={i} className="flex justify-between items-center text-xs bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg">
                                        <span className="text-slate-300 font-mono">#{i+1} {c.username}</span>
                                        <span className="font-bold text-emerald-400">{c.averageTimeToMerge} hrs avg</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bus Factor Explorer Chart */}
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">
                              Commit Share Concentration
                            </h3>
                            <p className="text-slate-500 text-[10px] mb-4">
                              Cumulative percentage of commits owned by ranked contributors. Steeper curves indicate higher concentration of code knowledge.
                            </p>
                            <div className="h-48 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={(() => {
                                    let sum = 0;
                                    const total = result.contributors.reduce((acc, c) => acc + c.commitsCount, 0) || 1;
                                    return result.contributors.map((c, idx) => {
                                      sum += c.commitsCount;
                                      return {
                                        rank: `#${idx + 1}`,
                                        name: c.username,
                                        Cumulative: parseFloat(((sum / total) * 100).toFixed(1)),
                                      };
                                    });
                                  })()}
                                >
                                  <XAxis dataKey="rank" stroke="#64748b" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#0f172a',
                                      borderColor: '#1e293b',
                                      borderRadius: '12px',
                                      color: '#e2e8f0',
                                    }}
                                  />
                                  <Area type="monotone" dataKey="Cumulative" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Filter & Sort Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/20 border border-slate-900 rounded-2xl p-4 backdrop-blur-md">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-slate-500 text-xs font-mono">Sort by:</span>
                            <button
                              onClick={() => setContributorSort('commits')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                contributorSort === 'commits' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
                              }`}
                            >
                              Commits
                            </button>
                            <button
                              onClick={() => setContributorSort('lines')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                contributorSort === 'lines' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
                              }`}
                            >
                              Lines Changed
                            </button>
                            <button
                              onClick={() => setContributorSort('chaos')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                contributorSort === 'chaos' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
                              }`}
                            >
                              Chaos Score
                            </button>
                          </div>

                          {/* Head to Head Compare Toggle */}
                          {selectedCompareUsers.length >= 2 && (
                            <button
                              onClick={() => setShowCompareUsersPanel(true)}
                              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg px-4 py-2 hover:shadow-lg transition active:scale-[0.98]"
                            >
                              Compare Selected ({selectedCompareUsers.length})
                            </button>
                          )}
                        </div>

                        {/* Head to Head Comparison Dashboard Overlay Modal */}
                        {showCompareUsersPanel && (
                          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
                              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                                <h2 className="text-xl font-bold text-slate-200 font-[family-name:var(--font-space-grotesk)]">
                                  Head-to-Head Developer Compare
                                </h2>
                                <button
                                  onClick={() => setShowCompareUsersPanel(false)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Radar Chart Comparing Overlay */}
                                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6">
                                  <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider text-center">Overlay Trait Radar</h3>
                                  <div className="h-64 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={(() => {
                                        const traitNames = ['Anxiety Factor', 'Test Discipline', 'Chaos Score'];
                                        return traitNames.map((name) => {
                                          const row: any = { subject: name };
                                          selectedCompareUsers.forEach((username) => {
                                            const uObj = result.contributors.find(c => c.username === username);
                                            if (uObj) {
                                              const tVal = uObj.profile.traits.find((t: any) => t.name === name)?.score ?? 50;
                                              row[username] = tVal;
                                            }
                                          });
                                          return row;
                                        });
                                      })()}>
                                        <PolarGrid stroke="#1e293b" />
                                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                                        {selectedCompareUsers.map((username, idx) => {
                                          const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];
                                          const color = colors[idx % colors.length];
                                          return (
                                            <Radar
                                              key={username}
                                              name={username}
                                              dataKey={username}
                                              stroke={color}
                                              fill={color}
                                              fillOpacity={0.15}
                                            />
                                          );
                                        })}
                                        <Legend />
                                      </RadarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* Comparison Stats Table */}
                                <div className="space-y-4">
                                  <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Key Stats Comparison</h3>
                                  <div className="overflow-x-auto border border-slate-900 rounded-xl">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                                          <th className="p-3">Contributor</th>
                                          <th className="p-3 text-right">Commits</th>
                                          <th className="p-3 text-right">Net Lines</th>
                                          <th className="p-3 text-right">Streak (Days)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedCompareUsers.map((username) => {
                                          const c = result.contributors.find(x => x.username === username);
                                          if (!c) return null;
                                          return (
                                            <tr key={username} className="border-b border-slate-900 hover:bg-slate-900/20">
                                              <td className="p-3 font-semibold text-slate-200">{username}</td>
                                              <td className="p-3 text-right text-indigo-400">{c.commitsCount}</td>
                                              <td className="p-3 text-right text-purple-400">{c.netLines}</td>
                                              <td className="p-3 text-right text-pink-400">{c.streaks.longestStreak}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Contributors Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[...result.contributors]
                            .sort((a, b) => {
                              if (contributorSort === 'lines') return b.netLines - a.netLines;
                              if (contributorSort === 'chaos') {
                                const aChaos = a.profile.traits.find((t: any) => t.name === 'Chaos Score')?.score ?? 0;
                                const bChaos = b.profile.traits.find((t: any) => t.name === 'Chaos Score')?.score ?? 0;
                                return bChaos - aChaos;
                              }
                              return b.commitsCount - a.commitsCount;
                            })
                            .map((c) => {
                              const isChecked = selectedCompareUsers.includes(c.username);
                              const chaos = c.profile.traits.find((t: any) => t.name === 'Chaos Score')?.score ?? 35;
                              return (
                                <div
                                  key={c.username}
                                  className="relative group bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-5 backdrop-blur-md transition flex flex-col justify-between"
                                >
                                  {/* Compare Checkbox */}
                                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSelectedCompareUsers(prev => prev.filter(u => u !== c.username));
                                        } else {
                                          setSelectedCompareUsers(prev => [...prev, c.username]);
                                        }
                                      }}
                                      className="rounded bg-slate-900 border-slate-800 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                                    />
                                    <span className="text-[9px] text-slate-500 font-mono">Compare</span>
                                  </div>

                                  <div className="cursor-pointer" onClick={() => setSelectedContributor(c)}>
                                    <div className="flex items-center gap-3.5 mb-4">
                                      <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
                                        {c.avatarUrl ? (
                                          <img src={c.avatarUrl} alt={c.username} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-300 font-bold text-lg font-mono">
                                            {c.username.slice(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-200 leading-snug">{c.displayName}</h4>
                                        <span className="text-xs text-indigo-400 font-mono">@{c.username}</span>
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                                        <span className="text-[9px] font-mono tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                                          {c.profile.archetype}
                                        </span>
                                        <span className="text-[9px] font-mono font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded">
                                          {c.profile.contributionType || 'General Code Contribution'}
                                        </span>
                                      </div>
                                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                                        {c.profile.summary}
                                      </p>
                                      {c.profile.featuresImplemented && c.profile.featuresImplemented.length > 0 && (
                                        <div className="mt-3.5 space-y-1">
                                          <span className="text-[9px] text-slate-500 font-mono block">Implemented Features:</span>
                                          <ul className="text-[10px] text-slate-350 font-light space-y-0.5 list-inside list-disc pl-1">
                                            {c.profile.featuresImplemented.slice(0, 2).map((feat: string, fIdx: number) => (
                                              <li key={fIdx} className="truncate" title={feat}>{feat}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/35 border border-slate-900 rounded-xl p-2.5 text-xs font-mono">
                                      <div>
                                        <span className="text-[8px] text-slate-500 block uppercase">Commits</span>
                                        <span className="font-bold text-slate-300">{c.commitsCount}</span>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-slate-500 block uppercase">Lines</span>
                                        <span className="font-bold text-slate-300">{c.netLines}</span>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-slate-500 block uppercase">Chaos</span>
                                        <span className={`font-bold ${chaos > 70 ? 'text-red-400' : 'text-emerald-400'}`}>{chaos}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </>
                    ) : (
                      /* Expanded Contributor detailed profile view */
                      <div className="space-y-6">
                        <button
                          onClick={() => setSelectedContributor(null)}
                          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          <span>Back to Team list</span>
                        </button>

                        {/* Detailed Contributor Hero Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/50 via-slate-950/60 to-purple-950/50 border border-slate-900 rounded-3xl p-6 md:p-8 shadow-xl">
                          <div className="relative flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-24 h-24 rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
                              {selectedContributor.avatarUrl ? (
                                <img src={selectedContributor.avatarUrl} alt={selectedContributor.username} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-300 font-bold text-3xl font-mono">
                                  {selectedContributor.username.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="flex-grow text-center md:text-left space-y-3">
                              <div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    {selectedContributor.profile.archetype}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                                    {selectedContributor.profile.contributionType || 'General Code Contribution'}
                                  </span>
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-slate-200 font-[family-name:var(--font-space-grotesk)]">
                                  {selectedContributor.displayName}
                                </h1>
                                <span className="text-sm font-mono text-slate-500">@{selectedContributor.username}</span>
                              </div>

                              <p className="text-slate-350 text-sm leading-relaxed max-w-2xl">
                                {selectedContributor.profile.summary}
                              </p>

                              {selectedContributor.profile.featuresImplemented && selectedContributor.profile.featuresImplemented.length > 0 && (
                                <div className="space-y-1 text-left">
                                  <span className="text-[10px] text-slate-500 font-mono block">Implemented Features:</span>
                                  <ul className="text-xs text-slate-350 font-light space-y-1 list-inside list-disc pl-1">
                                    {selectedContributor.profile.featuresImplemented.map((feat: string, fIdx: number) => (
                                      <li key={fIdx}>{feat}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                                {selectedContributor.profile.superlatives.map((badge: string, idx: number) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-md border border-slate-800 bg-slate-950/45 text-slate-400 text-[10px] font-mono">
                                    # {badge}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Specific Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md">
                            <span className="text-slate-500 text-[9px] block uppercase font-mono tracking-wider mb-1">Commit Volume</span>
                            <h4 className="text-2xl font-bold text-indigo-400">{selectedContributor.commitsCount} commits</h4>
                            <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">
                              Represents this developer's total share of changes. Avg size: {selectedContributor.averageCommitSize} changes.
                            </p>
                          </div>
                          
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md">
                            <span className="text-slate-500 text-[9px] block uppercase font-mono tracking-wider mb-1">Net Code Additions</span>
                            <h4 className="text-2xl font-bold text-purple-400">{selectedContributor.netLines} lines</h4>
                            <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">
                              Additions: {selectedContributor.additions} | Deletions: {selectedContributor.deletions}.
                            </p>
                          </div>

                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md">
                            <span className="text-slate-500 text-[9px] block uppercase font-mono tracking-wider mb-1">Longest Commit Streak</span>
                            <h4 className="text-2xl font-bold text-pink-400">{selectedContributor.streaks.longestStreak} days</h4>
                            <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">
                              Current streak: {selectedContributor.streaks.currentStreak} days. Most active day: {selectedContributor.mostActiveDay.count} pushes.
                            </p>
                          </div>
                        </div>

                        {/* Contribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Trait Radar */}
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Personal Traits</h3>
                            <div className="h-60 flex items-center justify-center">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedContributor.profile.traits.map((t: any) => ({ subject: t.name, score: t.score }))}>
                                  <PolarGrid stroke="#1e293b" />
                                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                                  <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Commit Categories Pie */}
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Commit Types</h3>
                            <div className="h-60 flex items-center justify-center">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Features', value: selectedContributor.ratios.feature },
                                      { name: 'Fixes', value: selectedContributor.ratios.fix },
                                      { name: 'Refactors', value: selectedContributor.ratios.refactor },
                                      { name: 'Tests', value: selectedContributor.ratios.test },
                                    ].filter(x => x.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                  >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#a855f7" />
                                    <Cell fill="#10b981" />
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Heatmap Activity Grid */}
                        <Heatmap data={selectedContributor.heatmap} />

                        {/* Personal Time of Day Comparison */}
                        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                          <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">
                            Time-of-day distribution vs Team wide
                          </h3>
                          <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={selectedContributor.timeOfDay.map((t: any) => {
                                  const repoPercent = result.metrics.timeOfDay.find(x => x.period.toLowerCase().includes(t.period.split(' ')[0].toLowerCase()))?.percent ?? 0;
                                  return {
                                    name: t.period.split(' ')[0],
                                    Author: parseFloat(t.percent.toFixed(1)),
                                    RepoWide: parseFloat(repoPercent.toFixed(1)),
                                  };
                                })}
                              >
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} axisLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderColor: '#1e293b',
                                    color: '#e2e8f0',
                                    borderRadius: '12px',
                                  }}
                                />
                                <Legend />
                                <Bar dataKey="Author" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="RepoWide" fill="#475569" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Network graph context callout */}
                        <CollaborationGraph
                          edges={result.collaborationGraph}
                          contributors={result.contributors}
                          highlightUser={selectedContributor.username}
                        />

                        {/* Copy/Share Roast controls */}
                        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 text-center max-w-2xl mx-auto space-y-4">
                          <h3 className="font-bold text-slate-200">Roast this contributor</h3>
                          <p className="text-slate-500 text-xs">Copy their generated AI summary profile to share on your Slack channel or Twitter.</p>
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                const text = `Developer profile of ${selectedContributor.displayName} (@${selectedContributor.username}) on "${result.repository.owner}/${result.repository.name}": Identified as: ${selectedContributor.profile.archetype}! 🤖\n"${selectedContributor.profile.summary}"`;
                                navigator.clipboard.writeText(text);
                                alert('Copied developer roast to clipboard!');
                              }}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300 hover:text-white active:scale-[0.98] transition"
                            >
                              Copy Roast Text
                            </button>
                            <button
                              onClick={() => {
                                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                  `My profile on ${result.repository.owner}/${result.repository.name} was identified as: ${selectedContributor.profile.archetype} (${selectedContributor.profile.superlatives.join(', ')}). Check yours out! 🚀`
                                )}`;
                                window.open(tweetUrl, '_blank');
                              }}
                              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg px-4 py-2 hover:shadow-lg transition active:scale-[0.98]"
                            >
                              Share on X
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: CODE HEALTH & RISK */}
                {activeTab === 'health' && result.health && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Overall Risk Score Circular Gauge */}
                      <div className="md:col-span-5 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider text-center">
                          Overall Risk Score
                        </h3>
                        
                        <div className="relative flex items-center justify-center h-48 w-48 mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="96"
                              cy="96"
                              r="80"
                              stroke="#1e293b"
                              strokeWidth="12"
                              fill="transparent"
                            />
                            <circle
                              cx="96"
                              cy="96"
                              r="80"
                              stroke={result.health.riskScore > 65 ? '#ef4444' : result.health.riskScore > 35 ? '#f59e0b' : '#10b981'}
                              strokeWidth="12"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 80}
                              strokeDashoffset={2 * Math.PI * 80 * (1 - result.health.riskScore / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-5xl font-extrabold text-white">{result.health.riskScore}</span>
                            <span className="text-[10px] text-slate-500 block uppercase font-mono mt-1">out of 100</span>
                          </div>
                        </div>

                        <div className="text-center space-y-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            result.health.riskScore > 65 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : result.health.riskScore > 35 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {result.health.riskScore > 65 ? 'HIGH RISK' : result.health.riskScore > 35 ? 'MEDIUM RISK' : 'LOW RISK'}
                          </span>
                        </div>
                      </div>

                      {/* Risk factors list */}
                      <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">
                          Key Risk Factors
                        </h3>
                        <div className="space-y-3">
                          {result.health.riskReasons.map((reason, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-xs">
                              <span className="shrink-0 mt-0.5">
                                <svg className={`w-4 h-4 ${result.health.riskScore > 50 ? 'text-amber-500' : 'text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </span>
                              <span className="text-slate-300 leading-normal">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Churn Treemap */}
                    <Treemap data={result.health.hotspots} />

                    {/* Growth Timeline Chart */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">
                        Repository Codebase Growth Timeline
                      </h3>
                      <p className="text-slate-500 text-[10px] mb-4">
                        Weekly commit activity tracking project development velocity.
                      </p>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={result.metrics.commitFrequency.perWeek.slice(-18)}>
                            <XAxis dataKey="week" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#1e293b',
                                color: '#e2e8f0',
                                borderRadius: '12px',
                              }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Commits" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Dependency Manifest List */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">
                            Codebase Manifest Dependencies
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Showing packages parsed from manifest files (e.g. package.json).
                          </span>
                        </div>
                        {result.health.dependencies.length > 0 && (
                          <span className="bg-slate-900 border border-slate-800 text-[10px] px-2.5 py-1 rounded font-mono text-slate-400">
                            {result.health.dependencies.length} packages
                          </span>
                        )}
                      </div>

                      {result.health.dependencies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {result.health.dependencies.slice(0, 36).map((dep, idx) => (
                            <div
                              key={idx}
                              className={`flex justify-between items-center px-3 py-2 bg-slate-900/35 border rounded-xl text-xs ${
                                dep.isStale ? 'border-red-900/40 hover:border-red-800/40 bg-red-950/5' : 'border-slate-900 hover:border-slate-800'
                              }`}
                            >
                              <div>
                                <span className={`font-semibold block ${dep.isStale ? 'text-red-300' : 'text-slate-300'}`}>{dep.name}</span>
                                <span className="text-[9px] text-slate-500 font-mono">{dep.isDev ? 'devDependencies' : 'dependencies'}</span>
                              </div>
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${dep.isStale ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                {dep.version}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-550 text-xs font-mono">
                          No package.json manifest dependencies found in this repository.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 7: COMPARE REPOS */}
                {activeTab === 'compare' && (
                  <div className="space-y-8">
                    {/* Input card for second repository */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-200 font-bold mb-2 font-[family-name:var(--font-space-grotesk)]">
                        Compare Repo with Another Public Codebase
                      </h3>
                      <p className="text-slate-500 text-xs mb-5">
                        Compare commit activity ratios, developer anxiety levels, bus factors, and overall metrics side-by-side.
                      </p>

                      {comparisonStatus === 'idle' && (
                        <form onSubmit={handleComparisonAnalyze} className="relative max-w-xl">
                          <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl opacity-25 blur group-hover:opacity-45 transition duration-1000" />
                            <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                              <input
                                type="text"
                                value={comparisonInput}
                                onChange={(e) => setComparisonInput(e.target.value)}
                                placeholder="e.g. vercel/next.js or https://github.com/vercel/next.js"
                                className="w-full bg-transparent text-slate-100 placeholder-slate-500 pl-3 pr-2 py-2 focus:outline-none text-xs md:text-sm"
                                required
                              />
                              <button
                                type="submit"
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium text-xs rounded-lg px-4 py-2.5 hover:shadow-lg active:scale-[0.98] transition shrink-0"
                              >
                                Compare
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Loading status */}
                      {comparisonStatus === 'scanning' && (
                        <div className="w-full max-w-lg bg-black/60 border border-slate-900 rounded-xl p-4 font-mono text-xs text-indigo-400 space-y-2">
                          {comparisonLogs.slice(-4).map((log, i) => (
                            <div key={i} className="leading-relaxed">
                              <span className="text-slate-600 mr-2">&gt;&gt;</span>
                              {log}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error state */}
                      {comparisonStatus === 'error' && (
                        <div className="space-y-4">
                          <div className="text-xs text-red-400 bg-red-950/15 border border-red-900/30 p-3 rounded-lg font-mono">
                            {comparisonErrorMsg || 'Failed to retrieve comparison repository.'}
                          </div>
                          <button
                            onClick={() => setComparisonStatus('idle')}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-800"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      {/* Success comparison screen */}
                      {comparisonStatus === 'success' && comparisonResult && (
                        <div className="pt-4 border-t border-slate-900 space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono text-slate-500">
                              COMPARING WITH: <span className="text-indigo-400">@{comparisonResult.repository.owner}/{comparisonResult.repository.name}</span>
                            </span>
                            <button
                              onClick={() => {
                                setComparisonResult(null);
                                setComparisonStatus('idle');
                                setComparisonInput('');
                              }}
                              className="text-xs font-mono text-red-400 hover:underline"
                            >
                              Reset Comparison
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Overlay Trait Radar */}
                            <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
                              <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider text-center">
                                Repo Archetype traits
                              </h3>
                              <div className="h-60 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.profile.traits.map((t, idx) => {
                                    const compTrait = comparisonResult.profile.traits.find(x => x.name.toLowerCase().includes(t.name.split(' ')[0].toLowerCase()))?.score ?? 50;
                                    return {
                                      subject: t.name.split(' ')[0],
                                      [result.repository.name]: t.score,
                                      [comparisonResult.repository.name]: compTrait,
                                    };
                                  })}>
                                    <PolarGrid stroke="#1e293b" />
                                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                                    <Radar name={result.repository.name} dataKey={result.repository.name} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                                    <Radar name={comparisonResult.repository.name} dataKey={comparisonResult.repository.name} stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} />
                                    <Legend />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Stat comparison table */}
                            <div className="space-y-4">
                              <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">
                                Metrics Matrix Comparison
                              </h3>
                              <div className="overflow-hidden border border-slate-900 rounded-xl">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                                      <th className="p-3">Metrics Parameter</th>
                                      <th className="p-3 text-right">{result.repository.name}</th>
                                      <th className="p-3 text-right">{comparisonResult.repository.name}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-slate-900">
                                      <td className="p-3 font-semibold text-slate-300">Archetype</td>
                                      <td className="p-3 text-right text-indigo-400">{result.profile.archetype}</td>
                                      <td className="p-3 text-right text-pink-400">{comparisonResult.profile.archetype}</td>
                                    </tr>
                                    <tr className="border-b border-slate-900">
                                      <td className="p-3 font-semibold text-slate-300">Stars Count</td>
                                      <td className="p-3 text-right text-yellow-500 font-mono">{result.repository.stars ?? 0}</td>
                                      <td className="p-3 text-right text-yellow-500 font-mono">{comparisonResult.repository.stars ?? 0}</td>
                                    </tr>
                                    <tr className="border-b border-slate-900">
                                      <td className="p-3 font-semibold text-slate-300">Bus Factor</td>
                                      <td className="p-3 text-right font-mono">{result.metrics.busFactor}</td>
                                      <td className="p-3 text-right font-mono">{comparisonResult.metrics.busFactor}</td>
                                    </tr>
                                    <tr className="border-b border-slate-900">
                                      <td className="p-3 font-semibold text-slate-300">Developer Anxiety (Fix Ratio)</td>
                                      <td className="p-3 text-right font-mono">{result.metrics.ratios.fix.toFixed(0)}%</td>
                                      <td className="p-3 text-right font-mono">{comparisonResult.metrics.ratios.fix.toFixed(0)}%</td>
                                    </tr>
                                    <tr className="border-b border-slate-900">
                                      <td className="p-3 font-semibold text-slate-300">Collaboration Index</td>
                                      <td className="p-3 text-right font-mono">{result.metrics.collaborationIndex.toFixed(2)}</td>
                                      <td className="p-3 text-right font-mono">{comparisonResult.metrics.collaborationIndex.toFixed(2)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Retro Share Card Section */}
            <div className="bg-slate-950/50 border border-slate-900 rounded-3xl p-6 text-center max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-slate-200 mb-2 font-[family-name:var(--font-space-grotesk)]">
                Share Your Codebase Profile
              </h3>
              <p className="text-slate-450 text-xs mb-6">
                Copy the details of your profiling results to roast your fellow contributors or share on socials.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    const text = `My codebase "${result.repository.owner}/${result.repository.name}" was profiled as: ${result.profile.archetype}! 🤖\nTraits include:\n${result.profile.traits.map(t => `- ${t.name}: ${t.score}/100`).join('\n')}\nCheck yours out!`;
                    navigator.clipboard.writeText(text);
                    alert('Copied profile report snippet to clipboard!');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold hover:text-white transition active:scale-[0.98]"
                >
                  Copy Report Text
                </button>
                
                <button
                  onClick={() => {
                    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `My codebase ${result.repository.owner}/${result.repository.name} was identified as: ${result.profile.archetype} (${result.profile.shareableBadges.join(', ')}). Profile yours now! 🚀`
                    )}`;
                    window.open(tweetUrl, '_blank');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/10 transition active:scale-[0.98]"
                >
                  Share on X / Twitter
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/40 bg-slate-950/20 py-6 text-center">
        <p className="text-slate-600 text-xs font-mono">
          Made with &hearts; by Antigravity AI Pair Programmer &copy; {new Date().getFullYear()}
        </p>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
            {/* Glowing border accent */}
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                API Credentials Setup
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={clientGhToken}
                  onChange={(e) => setClientGhToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-mono">
                  Used to bypass GitHub's 60 requests/hr unauthenticated rate limit.{' '}
                  <a
                    href="https://github.com/settings/tokens/new?description=Codebase+Profiler&scopes=public_repo"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Generate free PAT (classic)
                  </a>{' '}
                  with the <code className="text-slate-400">public_repo</code> scope.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  OpenAI API Key (Optional)
                </label>
                <input
                  type="password"
                  value={clientOpenAiKey}
                  onChange={(e) => setClientOpenAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-mono">
                  Optionally provide your own key to run analysis using GPT-4o-mini directly. Fallbacks to server-configured keys or sarcasm simulation mockup if empty.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-medium text-sm rounded-xl active:scale-[0.98] transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
