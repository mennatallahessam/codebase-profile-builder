<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Trait } from '@/types/analysis';
import { chartTooltip } from '@/plugins/echarts';

const props = defineProps<{
  traits: Trait[];
  height?: string;
}>();

const expanded = ref<number | null>(0);

const radarOption = computed(() => ({
  tooltip: chartTooltip,
  radar: {
    indicator: props.traits.map((t) => ({ name: t.name, max: 100 })),
    axisName: { color: '#94a3b8', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1e293b' } },
    splitArea: { show: false },
    axisLine: { lineStyle: { color: '#1e293b' } },
  },
  series: [{
    type: 'radar',
    data: [{ value: props.traits.map((t) => t.score), name: 'Score' }],
    areaStyle: { color: 'rgba(139, 92, 246, 0.3)' },
    lineStyle: { color: '#8b5cf6' },
    itemStyle: { color: '#8b5cf6' },
  }],
}));

function severityClass(score: number) {
  if (score > 75) return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (score > 40) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Trait Radar</h3>
      <VChart :option="radarOption" :style="{ height: height || '240px', width: '100%' }" autoresize />
    </div>

    <div class="space-y-3">
      <div
        v-for="(trait, idx) in traits"
        :key="idx"
        class="bg-slate-950/40 border border-slate-900 hover:border-slate-850 rounded-2xl backdrop-blur-md transition overflow-hidden"
      >
        <button
          type="button"
          class="w-full p-5 flex justify-between items-center text-left"
          @click="expanded = expanded === idx ? null : idx"
        >
          <h4 class="text-lg font-bold text-slate-200 font-space">{{ trait.name }}</h4>
          <div class="flex items-center gap-2">
            <span :class="['px-2 py-1 rounded text-xs font-mono font-bold border', severityClass(trait.score)]">
              {{ trait.score }}/100
            </span>
            <svg
              class="w-4 h-4 text-slate-500 transition-transform"
              :class="{ 'rotate-180': expanded === idx }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div v-show="expanded === idx" class="px-5 pb-5 space-y-3 border-t border-slate-900/60 pt-4">
          <p class="text-slate-350 text-sm leading-relaxed">{{ trait.description }}</p>
          <div class="bg-black/30 border border-black/20 rounded-xl p-3 flex items-start gap-2.5">
            <span class="text-slate-650 font-mono text-xs select-none shrink-0 mt-0.5">&gt; Evidence:</span>
            <span class="text-indigo-300 font-mono text-xs italic">{{ trait.evidence }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
