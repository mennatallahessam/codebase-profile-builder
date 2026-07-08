<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AnalysisResult } from '@/types/analysis';
import { chartTooltip } from '@/plugins/echarts';
import html2canvas from 'html2canvas';

const props = defineProps<{
  result: AnalysisResult;
}>();

const cardRef = ref<HTMLElement | null>(null);
const exporting = ref(false);

const radarOption = computed(() => ({
  tooltip: chartTooltip,
  radar: {
    indicator: props.result.profile.traits.map((t) => ({ name: t.name, max: 100 })),
    axisName: { color: '#94a3b8', fontSize: 9 },
    splitLine: { lineStyle: { color: '#334155' } },
    splitArea: { show: false },
  },
  series: [{
    type: 'radar',
    data: [{ value: props.result.profile.traits.map((t) => t.score) }],
    areaStyle: { color: 'rgba(139, 92, 246, 0.35)' },
    lineStyle: { color: '#8b5cf6' },
    itemStyle: { color: '#8b5cf6' },
  }],
}));

async function downloadPng() {
  if (!cardRef.value) return;
  exporting.value = true;
  try {
    const canvas = await html2canvas(cardRef.value, {
      backgroundColor: '#030014',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `${props.result.repository.owner}-${props.result.repository.name}-profile.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    exporting.value = false;
  }
}

function copyReportText() {
  const text = `My codebase "${props.result.repository.owner}/${props.result.repository.name}" was profiled as: ${props.result.profile.archetype}! 🤖`;
  navigator.clipboard.writeText(text);
  alert('Copied profile snippet!');
}
</script>

<template>
  <div class="bg-slate-950/50 border border-slate-900 rounded-3xl p-6 text-center max-w-2xl mx-auto space-y-4">
    <h3 class="text-lg font-bold text-slate-200 mb-2 font-space">Share Your Codebase Profile</h3>
    <p class="text-slate-450 text-xs mb-4">
      Download a shareable PNG card or copy text for social media.
    </p>

    <div
      ref="cardRef"
      class="mx-auto max-w-md text-left bg-gradient-to-br from-indigo-950/80 via-slate-950 to-purple-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl"
    >
      <p class="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-2">Codebase Personality Profiler</p>
      <h4 class="text-xl font-bold text-white font-space mb-1">
        {{ result.repository.owner }}/{{ result.repository.name }}
      </h4>
      <p class="text-2xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">
        {{ result.profile.archetype }}
      </p>
      <p class="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-3">{{ result.profile.summary }}</p>
      <VChart :option="radarOption" style="height: 180px; width: 100%;" autoresize />
      <div class="flex flex-wrap gap-1.5 mt-3">
        <span
          v-for="(badge, i) in result.profile.shareableBadges.slice(0, 4)"
          :key="i"
          class="px-2 py-0.5 rounded border border-slate-700 bg-slate-900/60 text-slate-300 text-[10px] font-mono"
        >
          #{{ badge }}
        </span>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 justify-center pt-2">
      <button
        type="button"
        :disabled="exporting"
        class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold hover:shadow-lg transition active:scale-[0.98] disabled:opacity-60"
        @click="downloadPng"
      >
        {{ exporting ? 'Generating...' : 'Download Share Card PNG' }}
      </button>
      <button
        type="button"
        class="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-855 text-slate-300 border border-slate-800 text-xs font-semibold hover:text-white transition active:scale-[0.98]"
        @click="copyReportText"
      >
        Copy Report Text
      </button>
    </div>
  </div>
</template>
