<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AnalysisResult } from '@/types/analysis';

// Tab components
import OverviewTab from './tabs/OverviewTab.vue';
import TraitsTab from './tabs/TraitsTab.vue';
import MetricsTab from './tabs/MetricsTab.vue';
import PredictionsTab from './tabs/PredictionsTab.vue';
import ContributorsTab from './tabs/ContributorsTab.vue';
import HealthTab from './tabs/HealthTab.vue';
import CompareTab from './tabs/CompareTab.vue';

// Share card
import ShareCard from '../ShareCard.vue';

const props = withDefaults(
  defineProps<{
    result: AnalysisResult;
    isPublicReport?: boolean;
  }>(),
  { isPublicReport: false }
);

const emit = defineEmits<{ reset: [] }>();

const activeTab = ref<'overview' | 'traits' | 'metrics' | 'predictions' | 'contributors' | 'health' | 'compare'>('overview');

const visibleTabs = computed(() => {
  const allTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contributors', label: 'Contributors' },
    { id: 'health', label: 'Code Health & Risk' },
    { id: 'traits', label: 'Humorous Traits' },
    { id: 'metrics', label: 'Metrics Dashboard' },
    { id: 'compare', label: 'Compare Repos' },
    { id: 'predictions', label: 'Predictions & Roasts' },
  ];
  if (props.isPublicReport) {
    // Show only the 4 public report tabs
    return allTabs.filter(t => ['overview', 'contributors', 'health', 'predictions'].includes(t.id));
  }
  return allTabs;
});

const languageSummary = computed(() => {
  const langs = props.result.health?.languages;
  return langs && langs.length > 0 ? langs[0].name : 'JavaScript';
});

const totalFiles = computed(() => {
  const langs = props.result.health?.languages;
  if (!langs) return 0;
  return langs.reduce((sum, l) => sum + l.value, 0);
});
</script>

<template>
  <div class="w-full max-w-5xl space-y-8 animate-fade-in">
    <!-- Repo Header & Quick Stats -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/30 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <svg class="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H7v-2h10v2zm0-4H7V8h10v2z" clip-rule="evenodd" />
          </svg>
          <a
            :href="result.repository.url"
            target="_blank"
            rel="noreferrer"
            class="text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-sm flex items-center gap-1.5"
          >
            <span>{{ result.repository.owner }}/{{ result.repository.name }}</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <h2 class="text-2xl font-bold font-space text-slate-200">
          {{ result.repository.name }}
        </h2>
        <p class="text-slate-400 text-xs mt-1 max-w-xl">
          {{ result.repository.description || 'No repository description available.' }}
        </p>
        <p class="text-slate-300 text-sm mt-2">
          Primarily written in {{ languageSummary }}.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
          <span class="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">Stars</span>
          <span class="text-lg font-bold text-yellow-500">{{ result.repository.stars ?? 0 }}</span>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
          <span class="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">Bus Factor</span>
          <span :class="['text-lg font-bold', result.metrics.busFactor === 1 ? 'text-red-500' : 'text-emerald-500']">
            {{ result.metrics.busFactor }}
          </span>
        </div>
        <button
          v-if="!isPublicReport"
          type="button"
          class="bg-slate-900 hover:bg-slate-855 border border-slate-800 p-2.5 rounded-xl text-slate-400 hover:text-white transition"
          title="Search another repo"
          @click="emit('reset')"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- About This Repository -->
    <div class="bg-slate-950/50 border border-slate-800/60 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <h2 class="text-slate-400 text-xs font-mono font-semibold uppercase tracking-widest">About This Repository</h2>
      </div>
      <div class="flex flex-col md:flex-row gap-8 md:items-start">
        <!-- Description & Overview -->
        <div class="flex-grow space-y-3">
          <p class="text-slate-200 text-base leading-relaxed">
            {{ result.profile.aboutProject || result.repository.description || 'No description available.' }}
          </p>
          <p v-if="result.repository.description && result.profile.aboutProject && result.profile.aboutProject !== result.repository.description" class="text-slate-500 text-xs italic border-l-2 border-slate-800/80 pl-3">
            GitHub: {{ result.repository.description }}
          </p>
        </div>

        <!-- Quick Stats sidebar -->
        <div v-if="result.health && result.health.languages && result.health.languages.length > 0" class="md:w-64 shrink-0 space-y-4">
          <div>
            <span class="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2">File Type Breakdown</span>
            <div class="space-y-2">
              <div v-for="(lang, i) in result.health.languages.slice(0, 6)" :key="i">
                <div class="flex justify-between text-[10px] font-mono mb-0.5">
                  <span class="text-slate-300">{{ lang.name }}</span>
                  <span class="text-slate-500">{{ lang.value }} files · {{ Math.round((lang.value / (totalFiles || 1)) * 100) }}%</span>
                </div>
                <div class="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    :class="['h-full rounded-full', ['bg-cyan-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500'][i % 6]]"
                    :style="{ width: `${Math.round((lang.value / (totalFiles || 1)) * 100)}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-xs font-mono border-t border-slate-905 pt-3">
            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782 1.4 8.166L12 18.9l-7.334 3.858 1.4-8.166L.132 9.21l8.2-1.192z"/></svg>
            <span><strong class="text-yellow-400">{{ (result.repository.stars ?? 0).toLocaleString() }}</strong> stars on GitHub</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Archetype Showcase Card -->
    <div class="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-950/60 to-purple-950/60 border border-slate-900/60 rounded-3xl p-6 md:p-8 shadow-xl">
      <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div class="relative max-w-3xl">
        <span class="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Archetype Identified
        </span>
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent font-space">
          {{ result.profile.archetype }}
        </h1>
        <p class="text-slate-355 text-base md:text-lg leading-relaxed mb-6 font-light">
          {{ result.profile.summary }}
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(badge, idx) in result.profile.shareableBadges"
            :key="idx"
            class="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-350 text-xs font-mono"
          >
            # {{ badge }}
          </span>
        </div>
      </div>
    </div>

    <!-- Project Overview & Tech Stack Card -->
    <div class="bg-slate-955/40 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6">
      <div class="flex flex-col md:flex-row gap-6 md:gap-12 md:items-start">
        <!-- Left: About Project -->
        <div class="flex-grow space-y-3">
          <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Project Overview
          </h3>
          <p class="text-slate-300 text-sm leading-relaxed font-light">
            {{ result.profile.aboutProject || result.repository.description || 'No detailed overview available.' }}
          </p>
        </div>
        <!-- Right: Tech Stack Badges -->
        <div class="md:w-72 shrink-0 space-y-3">
          <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Tech Stack Used
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(tech, idx) in (result.profile.techStack || result.health?.languages?.map(l => l.name) || ['JavaScript'])"
              :key="idx"
              :class="['px-3 py-1.5 rounded-lg border bg-gradient-to-tr text-xs font-mono font-medium',
                [
                  'from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20',
                  'from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20',
                  'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20',
                  'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20',
                  'from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20'
                ][idx % 5]
              ]"
            >
              {{ tech }}
            </span>
          </div>
        </div>
      </div>

      <!-- Contributors overview list -->
      <div v-if="result.contributors && result.contributors.length > 0" class="border-t border-slate-900/60 pt-6 space-y-4">
        <h3 class="text-slate-355 text-sm font-semibold font-mono uppercase tracking-wider flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          Contributors & Key Features
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(c, idx) in result.contributors" :key="idx" class="bg-slate-950/60 border border-slate-900 hover:border-slate-800 rounded-2xl p-4 transition-all">
            <div class="flex items-center gap-3 mb-2.5">
              <div class="w-8 h-8 rounded-lg bg-slate-900 overflow-hidden border border-slate-850 shrink-0">
                <img v-if="c.avatarUrl" :src="c.avatarUrl" :alt="c.username" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-indigo-955 text-indigo-300 font-bold text-xs font-mono">
                  {{ c.username.slice(0, 2).toUpperCase() }}
                </div>
              </div>
              <div class="min-w-0">
                <h4 class="font-bold text-sm text-slate-200 truncate">{{ c.displayName || c.username }}</h4>
                <span class="text-[10px] text-indigo-400 font-mono block">@{{ c.username }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[9px] font-mono font-medium text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded">
                  {{ c.profile?.contributionType || 'General Code Contribution' }}
                </span>
              </div>
              <div v-if="c.profile?.featuresImplemented && c.profile.featuresImplemented.length > 0" class="text-[11px] text-slate-350 font-light space-y-0.5">
                <span class="text-[9px] text-slate-505 font-mono block uppercase">Implemented Features:</span>
                <ul class="list-disc list-inside space-y-0.5 pl-0.5 text-slate-400">
                  <li v-for="(feat, fIdx) in c.profile.featuresImplemented.slice(0, 2)" :key="fIdx" class="truncate" :title="feat">
                    {{ feat }}
                  </li>
                </ul>
              </div>
              <div class="flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-900/60 pt-2">
                <span>📊 <strong>{{ c.commitsCount }}</strong> commits</span>
                <span>📝 <strong>{{ c.netLines.toLocaleString() }}</strong> lines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Tabs & Content -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <!-- Left Sidebar: Tabs Navigation -->
      <div class="md:col-span-4 space-y-4">
        <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-2.5 backdrop-blur-md flex md:flex-col gap-1 overflow-x-auto">
          <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            type="button"
            :class="['w-full py-2.5 px-4 rounded-xl font-medium text-sm text-left transition whitespace-nowrap md:whitespace-normal',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
            ]"
            @click="activeTab = tab.id as any"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Bus Factor Alert Widget -->
        <div v-if="result.metrics.busFactor === 1" class="bg-red-955/20 border border-red-900/30 rounded-2xl p-5 backdrop-blur-md">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 class="text-red-400 text-sm font-semibold mb-1">Bus Factor Alert</h4>
              <p class="text-slate-400 text-xs leading-relaxed">
                A bus factor of 1 means this entire empire is built inside one developer's mind. Pray they don't buy a lottery ticket or go offline.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Tab Content -->
      <div class="md:col-span-8">
        <OverviewTab v-if="activeTab === 'overview'" :result="result" />
        <ContributorsTab v-else-if="activeTab === 'contributors'" :result="result" />
        <HealthTab v-else-if="activeTab === 'health'" :result="result" />
        <TraitsTab v-else-if="activeTab === 'traits'" :traits="result.profile.traits" />
        <MetricsTab v-else-if="activeTab === 'metrics'" :result="result" />
        <CompareTab v-else-if="activeTab === 'compare'" :result="result" />
        <PredictionsTab v-else-if="activeTab === 'predictions'" :result="result" />
      </div>
    </div>

    <!-- Bottom Share Card -->
    <ShareCard :result="result" />
  </div>
</template>
