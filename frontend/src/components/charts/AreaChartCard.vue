<script setup lang="ts">
import { computed } from 'vue';
import { chartTooltip } from '@/plugins/echarts';

const props = defineProps<{
  data: { week: string; count: number }[];
  title?: string;
  subtitle?: string;
  height?: string;
}>();

const option = computed(() => ({
  tooltip: { ...chartTooltip, trigger: 'axis' },
  grid: { left: 40, right: 16, top: 24, bottom: 28 },
  xAxis: {
    type: 'category',
    data: props.data.map((d) => d.week),
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
    data: props.data.map((d) => d.count),
    smooth: true,
    areaStyle: { color: 'rgba(99, 102, 241, 0.15)' },
    lineStyle: { color: '#6366f1' },
    itemStyle: { color: '#6366f1' },
    symbol: 'none',
  }],
}));
</script>

<template>
  <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
    <h3 v-if="title" class="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">{{ title }}</h3>
    <p v-if="subtitle" class="text-slate-500 text-[10px] mb-4">{{ subtitle }}</p>
    <VChart :option="option" :style="{ height: height || '256px', width: '100%' }" autoresize />
  </div>
</template>
