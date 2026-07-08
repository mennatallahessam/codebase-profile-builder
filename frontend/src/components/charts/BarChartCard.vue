<script setup lang="ts">
import { computed } from 'vue';
import { chartTooltip } from '@/plugins/echarts';

const props = defineProps<{
  data: { name: string; value: number }[];
  title?: string;
  dataKey?: string;
  height?: string;
}>();

const option = computed(() => ({
  tooltip: { ...chartTooltip, trigger: 'axis' },
  grid: { left: 40, right: 16, top: 24, bottom: 28 },
  xAxis: {
    type: 'category',
    data: props.data.map((d) => d.name),
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
  series: [{
    type: 'bar',
    data: props.data.map((d) => d.value),
    itemStyle: { color: '#6366f1', borderRadius: [6, 6, 0, 0] },
    barMaxWidth: 48,
  }],
}));
</script>

<template>
  <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
    <h3 v-if="title" class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">{{ title }}</h3>
    <VChart :option="option" :style="{ height: height || '240px', width: '100%' }" autoresize />
  </div>
</template>
