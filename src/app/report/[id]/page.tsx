'use client';

import React, { useState, useEffect } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';

interface ReportPageProps {
  params: { id: string };
}

export default function ReportPage({ params }: ReportPageProps) {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'contributors' | 'health' | 'predictions'>('overview');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/report?id=${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Report not found');
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [params.id]);

  const getRadarData = () => {
    if (!report) return [];
    return report.profile.traits.map((t: any) => ({
      subject: t.name,
      score: t.score,
      fullMark: 100,
    }));
  };

  const getTimeOfDayData = () => {
    if (!report) return [];
    return report.metrics.timeOfDay.map((t: any) => ({
      name: t.period.charAt(0).toUpperCase() + t.period.slice(1),
      Percentage: parseFloat(t.percent.toFixed(1)),
    }));
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[#030014]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-900/80 bg-slate-950/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-3">
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
          </a>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Public Report
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-10 md:px-8 space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-slate-500 text-sm font-mono animate-pulse">Loading report...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M3.34 16h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-200">Report Not Found</h2>
            <p className="text-slate-400 text-sm max-w-sm">{error}</p>
            <a
              href="/"
              className="mt-2 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-sm hover:text-white hover:bg-slate-800 transition"
            >
              ← Analyze a new repository
            </a>
          </div>
        )}

        {/* Report Content */}
        {!loading && report && (
          <>
            {/* Read-only notice banner */}
            <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 font-mono">
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>This is a <strong className="text-slate-300">read-only public permalink</strong> for report #{report.id}. Generated on {new Date(report.lastAnalyzed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</span>
              <a href="/" className="ml-auto shrink-0 text-indigo-400 hover:text-indigo-300 hover:underline">Analyze your own →</a>
            </div>

            {/* Repo Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/30 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
              <div>
                <a
                  href={report.repository.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-sm flex items-center gap-1.5 mb-1.5"
                >
                  <span>{report.repository.owner}/{report.repository.name}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <h1 className="text-2xl font-bold text-slate-200">{report.repository.name}</h1>
              </div>
              <div className="flex items-center gap-3">
                {report.repository.stars !== undefined && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
                    <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">Stars</span>
                    <span className="text-lg font-bold text-yellow-500">{report.repository.stars}</span>
                  </div>
                )}
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">Bus Factor</span>
                  <span className={`text-lg font-bold ${report.metrics.busFactor === 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {report.metrics.busFactor}
                  </span>
                </div>
              </div>
            </div>

            {/* Archetype Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-950/60 to-purple-950/60 border border-slate-900/60 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative max-w-3xl">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Archetype Identified
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {report.profile.archetype}
                </h2>
                <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
                  {report.profile.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.profile.shareableBadges?.map((badge: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-300 text-xs font-mono">
                      #{badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Navigation + Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Sidebar tabs */}
              <div className="md:col-span-3">
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-2.5 backdrop-blur-md flex md:flex-col gap-1 overflow-x-auto">
                  {(['overview', 'contributors', 'health', 'predictions'] as const).map((tab) => {
                    const labels: Record<string, string> = {
                      overview: 'Overview',
                      contributors: 'Contributors',
                      health: 'Code Health',
                      predictions: 'Predictions',
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition ${
                          activeTab === tab
                            ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                        }`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab content */}
              <div className="md:col-span-9 space-y-6">
                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Trait Radar</h3>
                        <div className="h-60">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                              </RadarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Commit Time of Day</h3>
                        <div className="h-60">
                          {isMounted && (
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
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Commit Ratios */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-5 font-mono uppercase tracking-wider">Commit Type Ratios</h3>
                      <div className="space-y-4">
                        {[
                          { name: 'Features', value: report.metrics.ratios.feature, color: '#3b82f6' },
                          { name: 'Fixes / Bugs', value: report.metrics.ratios.fix, color: '#ef4444' },
                          { name: 'Refactors', value: report.metrics.ratios.refactor, color: '#a855f7' },
                          { name: 'Tests', value: report.metrics.ratios.test, color: '#10b981' },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium">{item.name}</span>
                              <span className="font-mono text-slate-300 font-bold">{item.value.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${item.value}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evidence Logs */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Evidence Logs</h3>
                      <div className="space-y-4">
                        {report.profile.traits.slice(0, 3).map((trait: any, idx: number) => (
                          <div key={idx} className="p-4 bg-slate-900/50 rounded-xl border border-slate-850">
                            <span className="text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest block mb-1">
                              {trait.name} — Score: {trait.score}/100
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

                {/* CONTRIBUTORS */}
                {activeTab === 'contributors' && (
                  <div className="space-y-6">
                    {report.contributors && report.contributors.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {report.contributors.map((c: any) => (
                          <div key={c.username} className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
                                {c.avatarUrl ? (
                                  <img src={c.avatarUrl} alt={c.username} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-300 font-bold text-lg font-mono">
                                    {c.username?.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-200 leading-snug">{c.displayName}</h4>
                                <span className="text-xs text-indigo-400 font-mono">@{c.username}</span>
                              </div>
                            </div>
                            {c.profile?.archetype && (
                              <span className="text-[9px] font-mono tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                                {c.profile.archetype}
                              </span>
                            )}
                            {c.profile?.summary && (
                              <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-3">{c.profile.summary}</p>
                            )}
                            <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/35 border border-slate-900 rounded-xl p-2.5 text-xs font-mono mt-4">
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Commits</span>
                                <span className="font-bold text-slate-300">{c.commitsCount ?? 0}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Net Lines</span>
                                <span className="font-bold text-slate-300">{c.netLines ?? 0}</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 block uppercase">Streak</span>
                                <span className="font-bold text-purple-400">{c.streaks?.longestStreak ?? 0}d</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-sm font-mono bg-slate-950/30 border border-slate-900 rounded-2xl">
                        No contributor data stored for this report.
                      </div>
                    )}
                  </div>
                )}

                {/* CODE HEALTH */}
                {activeTab === 'health' && report.health && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Risk Gauge */}
                      <div className="md:col-span-5 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Overall Risk Score</h3>
                        <div className="relative flex items-center justify-center h-48 w-48 mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="80" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                            <circle
                              cx="96" cy="96" r="80"
                              stroke={report.health.riskScore > 65 ? '#ef4444' : report.health.riskScore > 35 ? '#f59e0b' : '#10b981'}
                              strokeWidth="12" fill="transparent"
                              strokeDasharray={2 * Math.PI * 80}
                              strokeDashoffset={2 * Math.PI * 80 * (1 - report.health.riskScore / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-5xl font-extrabold text-white">{report.health.riskScore}</span>
                            <span className="text-[10px] text-slate-500 block uppercase font-mono mt-1">out of 100</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          report.health.riskScore > 65 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          report.health.riskScore > 35 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {report.health.riskScore > 65 ? 'HIGH RISK' : report.health.riskScore > 35 ? 'MEDIUM RISK' : 'LOW RISK'}
                        </span>
                      </div>

                      {/* Risk factors */}
                      <div className="md:col-span-7 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Key Risk Factors</h3>
                        <div className="space-y-3">
                          {report.health.riskReasons.map((reason: string, idx: number) => (
                            <div key={idx} className="flex gap-2.5 items-start p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-xs">
                              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M3.34 16h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="text-slate-300 leading-normal">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Growth timeline */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Codebase Growth Timeline</h3>
                      <div className="h-56 w-full">
                        {isMounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={report.metrics.commitFrequency?.perWeek?.slice(-18) ?? []}>
                              <XAxis dataKey="week" stroke="#64748b" fontSize={10} tickLine={false} />
                              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0', borderRadius: '12px' }} />
                              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Commits" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Language breakdown */}
                    {report.health.languages && report.health.languages.length > 0 && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Language Composition</h3>
                        <div className="space-y-3">
                          {report.health.languages.map((lang: any, idx: number) => {
                            const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400 font-medium">{lang.name}</span>
                                  <span className="font-mono text-slate-300">{lang.value.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${lang.value}%`, backgroundColor: colors[idx % colors.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PREDICTIONS */}
                {activeTab === 'predictions' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950/50 to-purple-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">AI Predictions & Future Roasts</h3>
                      </div>
                      <div className="space-y-4">
                        {report.profile.predictions?.map((prediction: string, idx: number) => (
                          <div key={idx} className="relative p-4 bg-slate-900/50 border border-slate-900 rounded-xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-l-xl" />
                            <div className="pl-4 flex items-start gap-2">
                              <span className="shrink-0 mt-0.5 font-mono text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <p className="text-slate-300 text-sm leading-relaxed">{prediction}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
                      <h3 className="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Trait Breakdown</h3>
                      <div className="space-y-4">
                        {report.profile.traits.map((trait: any, idx: number) => (
                          <div key={idx} className="p-4 bg-slate-900/50 rounded-xl border border-slate-900 hover:border-slate-800 transition">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-slate-200 text-sm">{trait.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                trait.score > 75 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                trait.score > 40 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>{trait.score}/100</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed mb-2">{trait.description}</p>
                            <div className="bg-black/30 border border-black/20 rounded-lg p-2.5 text-indigo-300 font-mono text-xs italic">
                              "{trait.evidence}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Footer */}
            <div className="bg-slate-950/50 border border-slate-900 rounded-3xl p-8 text-center">
              <h3 className="text-xl font-bold text-slate-200 mb-2">Want to profile your own codebase?</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Get an AI-generated personality profile, contributor analysis, and code health report for any public GitHub repository.
              </p>
              <a
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition"
              >
                Analyze a Repository →
              </a>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/40 bg-slate-950/20 py-6 text-center mt-10">
        <p className="text-slate-600 text-xs font-mono">
          Made with &hearts; by Antigravity AI Pair Programmer &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
