<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import type { AnalysisResult } from '@/types/analysis';
import { useAnalysis } from '@/composables/useAnalysis';
import type { useCredentials } from '@/composables/useCredentials';
import { chartTooltip } from '@/plugins/echarts';

const props = defineProps<{ result: AnalysisResult }>();

const credentials = inject<ReturnType<typeof useCredentials>>('credentials');
const comparisonInput = ref('');

const getHeaders = () => {
  if (credentials) {
    return credentials.getApiHeaders();
  }
  return { 'Content-Type': 'application/json' };
};

const {
  status: comparisonStatus,
  errorMsg: comparisonErrorMsg,
  result: comparisonResult,
  logs: comparisonLogs,
  analyze: handleComparisonAnalyze,
  reset: resetComparison,
} = useAnalysis(getHeaders);

const comparisonRadarOption = computed(() => {
  if (!comparisonResult.value) return {};
  const names = props.result.profile.traits.map((t) => t.name.split(' ')[0]);
  const series1 = props.result.profile.traits.map((t) => t.score);
  const series2 = props.result.profile.traits.map((t) => {
    const compTrait = comparisonResult.value?.profile.traits.find((x) =>
      x.name.toLowerCase().includes(t.name.split(' ')[0].toLowerCase())
    )?.score ?? 50;
    return compTrait;
  });

  return {
    tooltip: chartTooltip,
    legend: { textStyle: { color: '#94a3b8', fontSize: 10 }, bottom: 0 },
    radar: {
      indicator: names.map((n) => ({ name: n, max: 100 })),
      axisName: { color: '#94a3b8', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1e293b' } },
      splitArea: { show: false },
    },
    series: [{
      type: 'radar',
      data: [
        {
          name: props.result.repository.name,
          value: series1,
          areaStyle: { color: 'rgba(139, 92, 246, 0.15)' },
          lineStyle: { color: '#8b5cf6' },
          itemStyle: { color: '#8b5cf6' },
        },
        {
          name: comparisonResult.value.repository.name,
          value: series2,
          areaStyle: { color: 'rgba(236, 72, 153, 0.15)' },
          lineStyle: { color: '#ec4899' },
          itemStyle: { color: '#ec4899' },
        },
      ],
    }],
  };
});
</script>

<template>
  <div class="space-y-8">
    <div class="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
      <h3 class="text-slate-200 font-bold mb-2 font-space">
        Compare Repo with Another Public Codebase
      </h3>
      <p class="text-slate-505 text-xs mb-5">
        Compare commit activity ratios, developer anxiety levels, bus factors, and overall metrics side-by-side.
      </p>

      <form
        v-if="comparisonStatus === 'idle'"
        class="relative max-w-xl"
        @submit.prevent="handleComparisonAnalyze(comparisonInput)"
      >
        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl opacity-25 blur group-hover:opacity-45 transition duration-1000" />
          <div class="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <input
              v-model="comparisonInput"
              type="text"
              placeholder="e.g. vercel/next.js or https://github.com/vercel/next.js"
              class="w-full bg-transparent text-slate-100 placeholder-slate-500 pl-3 pr-2 py-2 focus:outline-none text-xs md:text-sm"
              required
            />
            <button
              type="submit"
              class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium text-xs rounded-lg px-4 py-2.5 hover:shadow-lg active:scale-[0.98] transition shrink-0"
            >
              Compare
            </button>
          </div>
        </div>
      </form>

      <!-- Loading status -->
      <div v-else-if="comparisonStatus === 'scanning'" class="w-full max-w-lg bg-black/60 border border-slate-900 rounded-xl p-4 font-mono text-xs text-indigo-400 space-y-2">
        <div v-for="(log, i) in comparisonLogs.slice(-4)" :key="i" class="leading-relaxed">
          <span class="text-slate-650 mr-2">&gt;&gt;</span>{{ log }}
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="comparisonStatus === 'error'" class="space-y-4">
        <div class="text-xs text-red-400 bg-red-950/15 border border-red-900/30 p-3 rounded-lg font-mono">
          {{ comparisonErrorMsg || 'Failed to retrieve comparison repository.' }}
        </div>
        <button
          type="button"
          class="bg-slate-900 hover:bg-slate-850 text-slate-350 text-xs px-3 py-1.5 rounded-lg border border-slate-800 transition"
          @click="resetComparison"
        >
          Try Again
        </button>
      </div>

      <!-- Success comparison screen -->
      <div v-else-if="comparisonStatus === 'success' && comparisonResult" class="pt-4 border-t border-slate-900/60 space-y-6">
        <div class="flex justify-between items-center">
          <span class="text-xs font-mono text-slate-500">
            COMPARING WITH: <span class="text-indigo-400">@{{ comparisonResult.repository.owner }}/{{ comparisonResult.repository.name }}</span>
          </span>
          <button
            type="button"
            class="text-xs font-mono text-red-400 hover:underline"
            @click="() => { resetComparison(); comparisonInput = ''; }"
          >
            Reset Comparison
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Overlay Trait Radar -->
          <div class="bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
            <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider text-center">
              Repo Archetype traits
            </h3>
            <div class="h-60 flex items-center justify-center">
              <VChart :option="comparisonRadarOption" autoresize />
            </div>
          </div>

          <!-- Stat comparison table -->
          <div class="space-y-4">
            <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">
              Metrics Matrix Comparison
            </h3>
            <div class="overflow-hidden border border-slate-900 rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <th class="p-3">Metrics Parameter</th>
                    <th class="p-3 text-right">{{ result.repository.name }}</th>
                    <th class="p-3 text-right">{{ comparisonResult.repository.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-slate-900">
                    <td class="p-3 font-semibold text-slate-300">Archetype</td>
                    <td class="p-3 text-right text-indigo-400">{{ result.profile.archetype }}</td>
                    <td class="p-3 text-right text-pink-400">{{ comparisonResult.profile.archetype }}</td>
                  </tr>
                  <tr class="border-b border-slate-900">
                    <td class="p-3 font-semibold text-slate-300">Stars Count</td>
                    <td class="p-3 text-right text-yellow-500 font-mono">{{ result.repository.stars ?? 0 }}</td>
                    <td class="p-3 text-right text-yellow-500 font-mono">{{ comparisonResult.repository.stars ?? 0 }}</td>
                  </tr>
                  <tr class="border-b border-slate-900">
                    <td class="p-3 font-semibold text-slate-300">Bus Factor</td>
                    <td class="p-3 text-right font-mono">{{ result.metrics.busFactor }}</td>
                    <td class="p-3 text-right font-mono">{{ comparisonResult.metrics.busFactor }}</td>
                  </tr>
                  <tr class="border-b border-slate-900">
                    <td class="p-3 font-semibold text-slate-300">Developer Anxiety (Fix Ratio)</td>
                    <td class="p-3 text-right font-mono">{{ result.metrics.ratios.fix.toFixed(0) }}%</td>
                    <td class="p-3 text-right font-mono">{{ comparisonResult.metrics.ratios.fix.toFixed(0) }}%</td>
                  </tr>
                  <tr class="border-b border-slate-900">
                    <td class="p-3 font-semibold text-slate-300">Collaboration Index</td>
                    <td class="p-3 text-right font-mono">{{ result.metrics.collaborationIndex.toFixed(2) }}</td>
                    <td class="p-3 text-right font-mono">{{ comparisonResult.metrics.collaborationIndex.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
