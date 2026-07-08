<script setup lang="ts">
import { computed } from 'vue';
import { chartTooltip } from '@/plugins/echarts';

const props = defineProps<{
  data: { name: string; value: number; color?: string }[];
  title?: string;
  height?: string;
}>();

const option = computed(() => ({
  tooltip: chartTooltip,
  series: [{
    type: 'pie',
    radius: ['45%', '70%'],
    padAngle: 3,
    label: {
      color: '#cbd5e1',
      fontSize: 10,
      formatter: '{b} ({d}%)',
    },
    data: props.data.filter((d) => d.value > 0).map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: {
        color: d.color || ['#3b82f6', '#ef4444', '#a855f7', '#10b981'][i % 4],
      },
    })),
  }],
}));
</script>

<template>
  <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
    <h3 v-if="title" class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">{{ title }}</h3>
    <VChart :option="option" :style="{ height: height || '240px', width: '100%' }" autoresize />
  </div>
</template>
