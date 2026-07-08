<script setup lang="ts">
import { computed } from 'vue';
import type { Trait } from '@/types/analysis';
import { chartTooltip } from '@/plugins/echarts';

const props = defineProps<{
  traits: Trait[];
  title?: string;
  height?: string;
  multiSeries?: { name: string; traits: Trait[]; color: string }[];
}>();

const radarOption = computed(() => {
  if (props.multiSeries?.length) {
    const names = props.multiSeries[0].traits.map((t) => t.name);
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
        data: props.multiSeries.map((s) => ({
          name: s.name,
          value: s.traits.map((t) => t.score),
          areaStyle: { color: s.color.replace(')', ', 0.15)').replace('rgb', 'rgba') },
          lineStyle: { color: s.color },
          itemStyle: { color: s.color },
        })),
      }],
    };
  }

  return {
    tooltip: chartTooltip,
    radar: {
      indicator: props.traits.map((t) => ({ name: t.name, max: 100 })),
      axisName: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b' } },
      splitArea: { show: false },
    },
    series: [{
      type: 'radar',
      data: [{ value: props.traits.map((t) => t.score), name: 'Score' }],
      areaStyle: { color: 'rgba(139, 92, 246, 0.3)' },
      lineStyle: { color: '#8b5cf6' },
      itemStyle: { color: '#8b5cf6' },
    }],
  };
});
</script>

<template>
  <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
    <h3 v-if="title" class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">{{ title }}</h3>
    <VChart :option="radarOption" :style="{ height: height || '240px', width: '100%' }" autoresize />
  </div>
</template>
