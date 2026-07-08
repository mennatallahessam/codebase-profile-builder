<script setup lang="ts">
import { computed } from 'vue';
import type { AnalysisResult } from '@/types/analysis';
import BarChartCard from '@/components/charts/BarChartCard.vue';
import AreaChartCard from '@/components/charts/AreaChartCard.vue';

const props = defineProps<{ result: AnalysisResult }>();

const timeOfDayData = computed(() => {
  return props.result.metrics.timeOfDay.map((t) => ({
    name: t.period.charAt(0).toUpperCase() + t.period.slice(1),
    value: parseFloat(t.percent.toFixed(1)),
  }));
});

const recentWeekCommits = computed(() => {
  return props.result.metrics.commitFrequency.perWeek.slice(-18).map((w) => ({
    week: w.week,
    count: w.count,
  }));
});
</script>

<template>
  <div class="space-y-6">
    <!-- Time distribution Bar Chart -->
    <BarChartCard
      :data="timeOfDayData"
      title="Commit Time of Day Distribution"
    />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <!-- Collaboration Index Card -->
      <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
        <div>
          <span class="text-slate-500 text-[10px] block uppercase font-mono tracking-wider mb-1">
            Collaboration Index
          </span>
          <h4 class="text-2xl font-bold text-slate-200">
            {{ result.metrics.collaborationIndex.toFixed(2) }}
          </h4>
        </div>
        <p class="text-slate-400 text-xs mt-3 leading-relaxed">
          The average number of unique authors contributing to each touched file. Higher numbers represent collaborative coding; lower numbers indicate strict territorial silos.
        </p>
      </div>

      <!-- Anxiety Index Card -->
      <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
        <div>
          <span class="text-slate-500 text-[10px] block uppercase font-mono tracking-wider mb-1">
            Developer Anxiety Index
          </span>
          <h4 class="text-2xl font-bold text-red-400">
            {{ result.metrics.ratios.fix.toFixed(1) }}%
          </h4>
        </div>
        <p class="text-slate-400 text-xs mt-3 leading-relaxed">
          The percentage of commit messages explicitly cataloged as bug fixes or patches. A high percentage implies aggressive debugging or chaotic development.
        </p>
      </div>
    </div>

    <!-- Growth / Weekly commit card -->
    <AreaChartCard
      :data="recentWeekCommits"
      title="Weekly Commit Frequency"
      subtitle="Commit volume tracking development velocity over time."
    />
  </div>
</template>
