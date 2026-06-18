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
} from 'recharts';

interface Trait {
  name: string;
  score: number;
  description: string;
  evidence: string;
}

interface AnalysisResult {
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
    archetype: string;
    summary: string;
    traits: Trait[];
    predictions: string[];
    shareableBadges: string[];
  };
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
  const [activeTab, setActiveTab] = useState<'overview' | 'traits' | 'metrics' | 'predictions'>('overview');
  const [isMounted, setIsMounted] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
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
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const resetSearch = () => {
    setInput('');
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    setLogs([]);
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
        {status === 'error' && (
          <div className="w-full max-w-md bg-slate-950/60 border border-red-900/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">Analysis Failed</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {errorMsg || 'We encountered an error while indexing this repository. Make sure the name is correct and it is a public GitHub repository.'}
            </p>
            <button
              onClick={resetSearch}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm rounded-lg border border-slate-850 active:scale-[0.98] transition"
            >
              Try Another Repository
            </button>
          </div>
        )}

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

                {/* TAB 4: PREDICTIONS */}
                {activeTab === 'predictions' && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-slate-350 text-sm font-semibold mb-6 font-mono uppercase tracking-wider">
                      AI-Driven predictions & Forecasts
                    </h3>

                    <div className="space-y-4">
                      {result.profile.predictions.map((pred, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-4 p-4 rounded-xl border border-slate-900 bg-slate-950/50 hover:border-slate-850 transition duration-300"
                        >
                          <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg shrink-0 mt-0.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                              Forecast #{idx + 1}
                            </span>
                            <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                              {pred}
                            </p>
                          </div>
                        </div>
                      ))}
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
    </div>
  );
}
