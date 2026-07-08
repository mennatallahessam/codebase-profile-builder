<script setup lang="ts">
import { computed } from 'vue';
import type { AnalysisResult } from '@/types/analysis';
import { chartTooltip } from '@/plugins/echarts';
import Treemap from '@/components/Treemap.vue';

const props = defineProps<{ result: AnalysisResult }>();

// Growth timeline ECharts option
const timelineOption = computed(() => {
  const data = props.result.metrics.commitFrequency.perWeek.slice(-18);
  return {
    tooltip: { ...chartTooltip, trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.week),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    series: [{
      type: 'line',
      data: data.map((d) => d.count),
      smooth: true,
      areaStyle: { color: 'rgba(99, 102, 241, 0.15)' },
      lineStyle: { color: '#6366f1' },
      itemStyle: { color: '#6366f1' },
      symbol: 'none',
      name: 'Commits',
    }],
  };
});

const dashoffset = computed(() => {
  const score = props.result.health.riskScore;
  return 2 * Math.PI * 80 * (1 - score / 100);
});
</script>

<template>
  <div class="space-y-8">
    <div v-if="result.health" class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <!-- Risk Score Gauge -->
      <div class="md:col-span-5 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center">
        <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider text-center">
          Overall Risk Score
        </h3>

        <div class="relative flex items-center justify-center h-48 w-48 mb-4">
          <svg class="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#1e293b"
              stroke-width="12"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              :stroke="result.health.riskScore > 65 ? '#ef4444' : result.health.riskScore > 35 ? '#f59e0b' : '#10b981'"
              stroke-width="12"
              fill="transparent"
              :stroke-dasharray="2 * Math.PI * 80"
              :stroke-dashoffset="dashoffset"
              stroke-linecap="round"
              class="transition-all duration-1000"
            />
          </svg>
          <div class="absolute text-center">
            <span class="text-5xl font-extrabold text-white">{{ result.health.riskScore }}</span>
            <span class="text-[10px] text-slate-500 block uppercase font-mono mt-1">out of 100</span>
          </div>
        </div>

        <div class="text-center space-y-2 mt-2">
          <span :class="['px-2 py-0.5 rounded text-xs font-bold font-mono',
            result.health.riskScore > 65 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
            result.health.riskScore > 35 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20']"
          >
            {{ result.health.riskScore > 65 ? 'HIGH RISK' : result.health.riskScore > 35 ? 'MEDIUM RISK' : 'LOW RISK' }}
          </span>
        </div>
      </div>

      <!-- Risk Factors list -->
      <div class="md:col-span-7 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
        <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">
          Key Risk Factors
        </h3>
        <div class="space-y-3">
          <div v-for="(reason, idx) in result.health.riskReasons" :key="idx" class="flex gap-2.5 items-start p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-xs">
            <span class="shrink-0 mt-0.5">
              <svg :class="['w-4 h-4', result.health.riskScore > 50 ? 'text-amber-500' : 'text-indigo-400']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <span class="text-slate-300 leading-normal">{{ reason }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Churn Treemap -->
    <Treemap v-if="result.health && result.health.hotspots" :data="result.health.hotspots" />

    <!-- Growth Timeline -->
    <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <h3 class="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">
        Repository Codebase Growth Timeline
      </h3>
      <p class="text-slate-500 text-[10px] mb-4">
        Weekly commit activity tracking project development velocity.
      </p>
      <div class="h-64 w-full">
        <VChart :option="timelineOption" autoresize />
      </div>
    </div>

    <!-- Dependency list -->
    <div v-if="result.health" class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">
            Codebase Manifest Dependencies
          </h3>
          <span class="text-[10px] text-slate-500 font-mono">
            Showing packages parsed from manifest files (e.g. package.json).
          </span>
        </div>
        <span v-if="result.health.dependencies.length > 0" class="bg-slate-900 border border-slate-800 text-[10px] px-2.5 py-1 rounded font-mono text-slate-400">
          {{ result.health.dependencies.length }} packages
        </span>
      </div>

      <div v-if="result.health.dependencies.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="(dep, idx) in result.health.dependencies.slice(0, 36)"
          :key="idx"
          :class="['flex justify-between items-center px-3 py-2 bg-slate-900/35 border rounded-xl text-xs transition',
            dep.isStale ? 'border-red-900/40 hover:border-red-800/40 bg-red-950/5' : 'border-slate-900 hover:border-slate-800']"
        >
          <div>
            <span :class="['font-semibold block', dep.isStale ? 'text-red-300' : 'text-slate-300']">{{ dep.name }}</span>
            <span class="text-[9px] text-slate-500 font-mono">{{ dep.isDev ? 'devDependencies' : 'dependencies' }}</span>
          </div>
          <span :class="['font-mono text-[10px] px-2 py-0.5 rounded', dep.isStale ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400']">
            {{ dep.version }}
          </span>
        </div>
      </div>
      <div v-else class="text-center py-6 text-slate-500 text-xs font-mono">
        No package.json manifest dependencies found in this repository.
      </div>
    </div>
  </div>
</template>
