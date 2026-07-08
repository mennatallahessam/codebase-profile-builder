<script setup lang="ts">
import { computed } from 'vue';
import type { AnalysisResult } from '@/types/analysis';
import TraitRadarChart from '@/components/charts/TraitRadarChart.vue';

const props = defineProps<{ result: AnalysisResult }>();

const ratioData = computed(() => {
  const { ratios } = props.result.metrics;
  return [
    { name: 'Features', value: parseFloat(ratios.feature.toFixed(1)), color: '#3b82f6' },
    { name: 'Fixes/Bugs', value: parseFloat(ratios.fix.toFixed(1)), color: '#ef4444' },
    { name: 'Refactors', value: parseFloat(ratios.refactor.toFixed(1)), color: '#a855f7' },
    { name: 'Tests', value: parseFloat(ratios.test.toFixed(1)), color: '#10b981' },
  ];
});

const permalink = computed(() => `${window.location.origin}/report/${props.result.id}`);
const badgeMarkdown = computed(
  () => `[![Codebase Profiler](${window.location.origin}/api/badge/${props.result.repository.owner}/${props.result.repository.name})](${permalink.value})`,
);

function copy(text: string, msg: string) {
  navigator.clipboard.writeText(text);
  alert(msg);
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <TraitRadarChart :traits="result.profile.traits" title="Trait Radar" />
      <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
        <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Commit Types (%)</h3>
        <div class="space-y-4 mt-6">
          <div v-for="(item, idx) in ratioData" :key="idx" class="space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400 font-medium">{{ item.name }}</span>
              <span class="font-mono text-slate-300 font-bold">{{ item.value }}%</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: `${item.value}%`, backgroundColor: item.color }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Evidence Logs</h3>
      <div class="space-y-4">
        <div v-for="(trait, idx) in result.profile.traits.slice(0, 2)" :key="idx" class="p-4 bg-slate-900/50 rounded-xl border border-slate-850">
          <span class="text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest block mb-1">{{ trait.name }} EVIDENCE</span>
          <p class="text-slate-300 text-xs italic font-mono leading-relaxed bg-black/35 p-3 rounded-lg border border-black/20">"{{ trait.evidence }}"</p>
        </div>
      </div>
    </div>

    <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md space-y-6">
      <div>
        <h3 class="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">Public Permalink</h3>
        <div class="flex gap-2">
          <input :value="permalink" readonly class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 w-full focus:outline-none" />
          <button type="button" class="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 shrink-0" @click="copy(permalink, 'Permalink copied!')">Copy</button>
        </div>
      </div>
      <div class="border-t border-slate-900 pt-4">
        <h3 class="text-slate-350 text-sm font-semibold mb-2 font-mono uppercase tracking-wider">Embeddable README Badge</h3>
        <img :src="`/api/badge/${result.repository.owner}/${result.repository.name}`" alt="Status Badge" class="h-5 mb-3" />
        <div class="flex gap-2">
          <input :value="badgeMarkdown" readonly class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 w-full focus:outline-none" />
          <button type="button" class="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 shrink-0" @click="copy(badgeMarkdown, 'Markdown copied!')">Copy</button>
        </div>
      </div>
    </div>
  </div>
</template>
