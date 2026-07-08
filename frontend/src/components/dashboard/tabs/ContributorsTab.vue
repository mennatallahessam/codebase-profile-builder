<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AnalysisResult, ContributorDetail } from '@/types/analysis';
import { chartTooltip } from '@/plugins/echarts';
import TraitRadarChart from '@/components/charts/TraitRadarChart.vue';
import Heatmap from '@/components/Heatmap.vue';
import CollaborationGraph from '@/components/CollaborationGraph.vue';

const props = defineProps<{ result: AnalysisResult }>();

const selectedContributor = ref<ContributorDetail | null>(null);
const contributorSort = ref<'commits' | 'lines' | 'chaos'>('commits');
const selectedCompareUsers = ref<string[]>([]);
const showCompareUsersPanel = ref(false);

const mostCommits = computed(() => {
  return [...props.result.contributors]
    .sort((a, b) => b.commitsCount - a.commitsCount)
    .slice(0, 3);
});

const longestStreaks = computed(() => {
  return [...props.result.contributors]
    .sort((a, b) => b.streaks.longestStreak - a.streaks.longestStreak)
    .slice(0, 3);
});

const fastestPrMergers = computed(() => {
  return [...props.result.contributors]
    .filter((c) => c.prsMerged > 0)
    .sort((a, b) => a.averageTimeToMerge - b.averageTimeToMerge)
    .slice(0, 3);
});

// Commit share concentration ECharts option
const shareConcentrationOption = computed(() => {
  let sum = 0;
  const total = props.result.contributors.reduce((acc, c) => acc + c.commitsCount, 0) || 1;
  const data = props.result.contributors.map((c, idx) => {
    sum += c.commitsCount;
    return {
      rank: `#${idx + 1}`,
      value: parseFloat(((sum / total) * 100).toFixed(1)),
    };
  });

  return {
    tooltip: { ...chartTooltip, trigger: 'axis' },
    grid: { left: 45, right: 16, top: 12, bottom: 28 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.rank),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' },
    },
    series: [{
      type: 'line',
      data: data.map((d) => d.value),
      smooth: true,
      areaStyle: { color: 'rgba(168, 85, 247, 0.15)' },
      lineStyle: { color: '#a855f7' },
      itemStyle: { color: '#a855f7' },
      symbol: 'none',
    }],
  };
});

// Sort contributors
const sortedContributors = computed(() => {
  return [...props.result.contributors].sort((a, b) => {
    if (contributorSort.value === 'lines') {
      return b.netLines - a.netLines;
    }
    if (contributorSort.value === 'chaos') {
      const aChaos = a.profile.traits.find((t) => t.name === 'Chaos Score')?.score ?? 0;
      const bChaos = b.profile.traits.find((t) => t.name === 'Chaos Score')?.score ?? 0;
      return bChaos - aChaos;
    }
    return b.commitsCount - a.commitsCount;
  });
});

// Checkbox selection helper
function toggleCompare(username: string) {
  const idx = selectedCompareUsers.value.indexOf(username);
  if (idx > -1) {
    selectedCompareUsers.value.splice(idx, 1);
  } else {
    selectedCompareUsers.value.push(username);
  }
}

// Compare modal multi-radar option
const compareRadarMultiSeries = computed(() => {
  const traitNames = ['Anxiety Factor', 'Test Discipline', 'Chaos Score'];
  const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];

  return selectedCompareUsers.value.map((username, idx) => {
    const contributor = props.result.contributors.find((c) => c.username === username);
    const traits = traitNames.map((name) => {
      const score = contributor?.profile.traits.find((t) => t.name === name)?.score ?? 50;
      return { name, score, description: '', evidence: '' };
    });
    return {
      name: username,
      traits,
      color: colors[idx % colors.length],
    };
  });
});

// Selected contributor detailed charts options
const contributorPieOption = computed(() => {
  if (!selectedContributor.value) return {};
  const c = selectedContributor.value;
  const data = [
    { name: 'Features', value: c.ratios.feature, itemStyle: { color: '#3b82f6' } },
    { name: 'Fixes', value: c.ratios.fix, itemStyle: { color: '#ef4444' } },
    { name: 'Refactors', value: c.ratios.refactor, itemStyle: { color: '#a855f7' } },
    { name: 'Tests', value: c.ratios.test, itemStyle: { color: '#10b981' } },
  ].filter((x) => x.value > 0);

  return {
    tooltip: chartTooltip,
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#030014', borderWidth: 2 },
      label: { show: true, position: 'outside', color: '#94a3b8', formatter: '{b} ({d}%)', fontSize: 10 },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
      data,
    }],
  };
});

const contributorBarOption = computed(() => {
  if (!selectedContributor.value) return {};
  const c = selectedContributor.value;
  const data = c.timeOfDay.map((t) => {
    const repoPercent = props.result.metrics.timeOfDay.find((x) =>
      x.period.toLowerCase().includes(t.period.split(' ')[0].toLowerCase())
    )?.percent ?? 0;
    return {
      name: t.period.split(' ')[0],
      author: parseFloat(t.percent.toFixed(1)),
      repoWide: parseFloat(repoPercent.toFixed(1)),
    };
  });

  return {
    tooltip: { ...chartTooltip, trigger: 'axis' },
    legend: { textStyle: { color: '#94a3b8', fontSize: 10 }, bottom: 0 },
    grid: { left: 40, right: 16, top: 24, bottom: 44 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    series: [
      {
        name: 'Author',
        type: 'bar',
        data: data.map((d) => d.author),
        itemStyle: { color: '#a855f7', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Repo-wide',
        type: 'bar',
        data: data.map((d) => d.repoWide),
        itemStyle: { color: '#475569', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
});

function copyRoastText(c: ContributorDetail) {
  const text = `Developer profile of ${c.displayName} (@${c.username}) on "${props.result.repository.owner}/${props.result.repository.name}": Identified as: ${c.profile.archetype}! 🤖\n"${c.profile.summary}"`;
  navigator.clipboard.writeText(text);
  alert('Copied developer roast to clipboard!');
}

function shareOnX(c: ContributorDetail) {
  const text = `My profile on ${props.result.repository.owner}/${props.result.repository.name} was identified as: ${c.profile.archetype} (${c.profile.superlatives.join(', ')}). Check yours out! 🚀`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, '_blank');
}
</script>

<template>
  <div class="space-y-8">
    <div v-if="!selectedContributor" class="space-y-8">
      <!-- Leaderboards and Bus Factor Explorer -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Team Leaderboards -->
        <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
          <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">
            Team Leaderboards
          </h3>
          <div class="space-y-4">
            <!-- Most Commits -->
            <div>
              <span class="text-[10px] text-slate-500 font-mono block mb-2">MOST COMMITS</span>
              <div class="space-y-1.5">
                <div v-for="(c, i) in mostCommits" :key="i" class="flex justify-between items-center text-xs bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg">
                  <span class="text-slate-300 font-mono">#{{ i+1 }} {{ c.username }}</span>
                  <span class="font-bold text-indigo-400">{{ c.commitsCount }} commits</span>
                </div>
              </div>
            </div>

            <!-- Longest Streak -->
            <div>
              <span class="text-[10px] text-slate-500 font-mono block mb-2">LONGEST STREAK</span>
              <div class="space-y-1.5">
                <div v-for="(c, i) in longestStreaks" :key="i" class="flex justify-between items-center text-xs bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg">
                  <span class="text-slate-300 font-mono">#{{ i+1 }} {{ c.username }}</span>
                  <span class="font-bold text-purple-400">{{ c.streaks.longestStreak }} days</span>
                </div>
              </div>
            </div>

            <!-- PR Speed -->
            <div>
              <span class="text-[10px] text-slate-500 font-mono block mb-2">FASTEST PR MERGER</span>
              <div class="space-y-1.5">
                <div v-for="(c, i) in fastestPrMergers" :key="i" class="flex justify-between items-center text-xs bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg">
                  <span class="text-slate-300 font-mono">#{{ i+1 }} {{ c.username }}</span>
                  <span class="font-bold text-emerald-400">{{ c.averageTimeToMerge }} hrs avg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Commit Share Concentration -->
        <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
          <h3 class="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">
            Commit Share Concentration
          </h3>
          <p class="text-slate-500 text-[10px] mb-4">
            Cumulative percentage of commits owned by ranked contributors. Steeper curves indicate higher concentration of code knowledge.
          </p>
          <div class="h-48 w-full">
            <VChart :option="shareConcentrationOption" autoresize />
          </div>
        </div>
      </div>

      <!-- Filter and Sort Controls -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-950/20 border border-slate-900 rounded-2xl p-4 backdrop-blur-md">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-slate-500 text-xs font-mono">Sort by:</span>
          <button
            type="button"
            :class="['px-3 py-1.5 rounded-lg text-xs font-semibold transition', contributorSort === 'commits' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400']"
            @click="contributorSort = 'commits'"
          >
            Commits
          </button>
          <button
            type="button"
            :class="['px-3 py-1.5 rounded-lg text-xs font-semibold transition', contributorSort === 'lines' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400']"
            @click="contributorSort = 'lines'"
          >
            Lines Changed
          </button>
          <button
            type="button"
            :class="['px-3 py-1.5 rounded-lg text-xs font-semibold transition', contributorSort === 'chaos' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400']"
            @click="contributorSort = 'chaos'"
          >
            Chaos Score
          </button>
        </div>

        <button
          v-if="selectedCompareUsers.length >= 2"
          type="button"
          class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg px-4 py-2 hover:shadow-lg transition active:scale-[0.98]"
          @click="showCompareUsersPanel = true"
        >
          Compare Selected ({ { selectedCompareUsers.length } })
        </button>
      </div>

      <!-- Compare Users Modal -->
      <div v-if="showCompareUsersPanel" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
          <div class="flex justify-between items-center border-b border-slate-900 pb-4">
            <h2 class="text-xl font-bold text-slate-200 font-space">
              Head-to-Head Developer Compare
            </h2>
            <button type="button" class="text-slate-400 hover:text-white" @click="showCompareUsersPanel = false">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TraitRadarChart
              :traits="[]"
              :multi-series="compareRadarMultiSeries"
              title="Overlay Trait Radar"
            />

            <!-- Comparison Stats Table -->
            <div class="space-y-4">
              <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Key Stats Comparison</h3>
              <div class="overflow-x-auto border border-slate-900 rounded-xl">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th class="p-3">Contributor</th>
                      <th class="p-3 text-right">Commits</th>
                      <th class="p-3 text-right">Net Lines</th>
                      <th class="p-3 text-right">Streak (Days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="username in selectedCompareUsers" :key="username" class="border-b border-slate-900 hover:bg-slate-900/20">
                      <td class="p-3 font-semibold text-slate-200">{{ username }}</td>
                      <td class="p-3 text-right text-indigo-400">{{ result.contributors.find(x => x.username === username)?.commitsCount }}</td>
                      <td class="p-3 text-right text-purple-400">{{ result.contributors.find(x => x.username === username)?.netLines }}</td>
                      <td class="p-3 text-right text-pink-400">{{ result.contributors.find(x => x.username === username)?.streaks.longestStreak }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contributors Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="c in sortedContributors"
          :key="c.username"
          class="relative group bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-5 backdrop-blur-md transition flex flex-col justify-between"
        >
          <!-- Compare Checkbox -->
          <div class="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            <input
              type="checkbox"
              :checked="selectedCompareUsers.includes(c.username)"
              class="rounded bg-slate-900 border-slate-800 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
              @change="toggleCompare(c.username)"
            />
            <span class="text-[9px] text-slate-500 font-mono">Compare</span>
          </div>

          <div class="cursor-pointer" @click="selectedContributor = c">
            <div class="flex items-center gap-3.5 mb-4">
              <div class="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
                <img v-if="c.avatarUrl" :src="c.avatarUrl" :alt="c.username" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-300 font-bold text-lg font-mono">
                  {{ c.username.slice(0, 2).toUpperCase() }}
                </div>
              </div>
              <div>
                <h4 class="font-bold text-slate-200 leading-snug">{{ c.displayName }}</h4>
                <span class="text-xs text-indigo-400 font-mono">@{{ c.username }}</span>
              </div>
            </div>

            <div class="mb-4">
              <div class="flex flex-wrap gap-1.5 mb-2.5">
                <span class="text-[9px] font-mono tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                  {{ c.profile.archetype }}
                </span>
                <span class="text-[9px] font-mono font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded">
                  {{ c.profile.contributionType || 'General Code Contribution' }}
                </span>
              </div>
              <p class="text-slate-400 text-xs leading-relaxed line-clamp-2">
                {{ c.profile.summary }}
              </p>
              <div v-if="c.profile.featuresImplemented && c.profile.featuresImplemented.length > 0" class="mt-3.5 space-y-1">
                <span class="text-[9px] text-slate-500 font-mono block">Implemented Features:</span>
                <ul class="text-[10px] text-slate-350 font-light space-y-0.5 list-inside list-disc pl-1">
                  <li v-for="(feat, fIdx) in c.profile.featuresImplemented.slice(0, 2)" :key="fIdx" class="truncate" :title="feat">
                    {{ feat }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center bg-slate-900/35 border border-slate-900 rounded-xl p-2.5 text-xs font-mono">
              <div>
                <span class="text-[8px] text-slate-500 block uppercase">Commits</span>
                <span class="font-bold text-slate-300">{{ c.commitsCount }}</span>
              </div>
              <div>
                <span class="text-[8px] text-slate-500 block uppercase">Lines</span>
                <span class="font-bold text-slate-300">{{ c.netLines }}</span>
              </div>
              <div>
                <span class="text-[8px] text-slate-500 block uppercase">Chaos</span>
                <span :class="['font-bold', (c.profile.traits.find(t => t.name === 'Chaos Score')?.score ?? 0) > 70 ? 'text-red-400' : 'text-emerald-400']">
                  {{ c.profile.traits.find(t => t.name === 'Chaos Score')?.score ?? 35 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Expanded detailed view -->
    <div v-else class="space-y-6">
      <button
        type="button"
        class="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 transition"
        @click="selectedContributor = null"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Team list</span>
      </button>

      <!-- Detailed Contributor Hero Card -->
      <div class="relative overflow-hidden bg-gradient-to-br from-indigo-950/50 via-slate-950/60 to-purple-950/50 border border-slate-900 rounded-3xl p-6 md:p-8 shadow-xl">
        <div class="relative flex flex-col md:flex-row gap-6 items-center">
          <div class="w-24 h-24 rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
            <img v-if="selectedContributor.avatarUrl" :src="selectedContributor.avatarUrl" :alt="selectedContributor.username" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-300 font-bold text-3xl font-mono">
              {{ selectedContributor.username.slice(0, 2).toUpperCase() }}
            </div>
          </div>

          <div class="flex-grow text-center md:text-left space-y-3">
            <div>
              <div class="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {{ selectedContributor.profile.archetype }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                  {{ selectedContributor.profile.contributionType || 'General Code Contribution' }}
                </span>
              </div>
              <h1 class="text-3xl font-extrabold tracking-tight mt-2 text-slate-200 font-space">
                {{ selectedContributor.displayName }}
              </h1>
              <span class="text-sm font-mono text-slate-500">@{{ selectedContributor.username }}</span>
            </div>

            <p class="text-slate-350 text-sm leading-relaxed max-w-2xl">
              {{ selectedContributor.profile.summary }}
            </p>

            <div v-if="selectedContributor.profile.featuresImplemented && selectedContributor.profile.featuresImplemented.length > 0" class="space-y-1 text-left">
              <span class="text-[10px] text-slate-500 font-mono block">Implemented Features:</span>
              <ul class="text-xs text-slate-350 font-light space-y-1 list-inside list-disc pl-1">
                <li v-for="(feat, fIdx) in selectedContributor.profile.featuresImplemented" :key="fIdx">
                  {{ feat }}
                </li>
              </ul>
            </div>

            <div class="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              <span v-for="(badge, idx) in selectedContributor.profile.superlatives" :key="idx" class="px-2.5 py-1 rounded-md border border-slate-800 bg-slate-950/45 text-slate-400 text-[10px] font-mono">
                # {{ badge }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Specific Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md">
          <span class="text-slate-500 text-[9px] block uppercase font-mono tracking-wider mb-1">Commit Volume</span>
          <h4 class="text-2xl font-bold text-indigo-400">{{ selectedContributor.commitsCount }} commits</h4>
          <p class="text-slate-500 text-[10px] mt-2 leading-relaxed">
            Represents this developer's total share of changes. Avg size: {{ selectedContributor.averageCommitSize }} changes.
          </p>
        </div>

        <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md">
          <span class="text-slate-500 text-[9px] block uppercase font-mono tracking-wider mb-1">Net Code Additions</span>
          <h4 class="text-2xl font-bold text-purple-400">{{ selectedContributor.netLines }} lines</h4>
          <p class="text-slate-500 text-[10px] mt-2 leading-relaxed">
            Additions: {{ selectedContributor.additions }} | Deletions: {{ selectedContributor.deletions }}.
          </p>
        </div>

        <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md">
          <span class="text-slate-500 text-[9px] block uppercase font-mono tracking-wider mb-1">Longest Commit Streak</span>
          <h4 class="text-2xl font-bold text-pink-400">{{ selectedContributor.streaks.longestStreak }} days</h4>
          <p class="text-slate-500 text-[10px] mt-2 leading-relaxed">
            Current streak: {{ selectedContributor.streaks.currentStreak }} days. Most active day: {{ selectedContributor.mostActiveDay.count }} pushes.
          </p>
        </div>
      </div>

      <!-- Contribution Charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Personal Traits radar -->
        <TraitRadarChart
          :traits="selectedContributor.profile.traits"
          title="Personal Traits"
        />

        <!-- Commit Categories Pie Chart -->
        <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
          <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Commit Types</h3>
          <div class="h-60 flex items-center justify-center">
            <VChart :option="contributorPieOption" autoresize />
          </div>
        </div>
      </div>

      <!-- Heatmap Activity Grid -->
      <Heatmap :data="selectedContributor.heatmap" />

      <!-- Personal Time of Day Comparison Bar Chart -->
      <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
        <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">
          Time-of-day distribution vs Team wide
        </h3>
        <div class="h-60 w-full">
          <VChart :option="contributorBarOption" autoresize />
        </div>
      </div>

      <!-- Network graph context callout -->
      <CollaborationGraph
        :edges="result.collaborationGraph"
        :contributors="result.contributors"
        :highlight-user="selectedContributor.username"
      />

      <!-- Copy/Share Roast controls -->
      <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 text-center max-w-2xl mx-auto space-y-4">
        <h3 class="font-bold text-slate-200">Roast this contributor</h3>
        <p class="text-slate-500 text-xs">Copy their generated AI summary profile to share on your Slack channel or Twitter.</p>
        <div class="flex justify-center gap-2">
          <button
            type="button"
            class="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300 hover:text-white active:scale-[0.98] transition"
            @click="copyRoastText(selectedContributor)"
          >
            Copy Roast Text
          </button>
          <button
            type="button"
            class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg px-4 py-2 hover:shadow-lg transition active:scale-[0.98]"
            @click="shareOnX(selectedContributor)"
          >
            Share on X
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
