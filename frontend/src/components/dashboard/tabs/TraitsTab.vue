<script setup lang="ts">
import type { Trait } from '@/types/analysis';

defineProps<{ traits: Trait[] }>();

function severityClass(score: number) {
  if (score > 75) return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (score > 40) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-for="(trait, idx) in traits"
      :key="idx"
      class="bg-slate-950/40 border border-slate-900 hover:border-slate-850 rounded-2xl p-6 backdrop-blur-md transition"
    >
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-bold text-slate-200 font-space">{{ trait.name }}</h3>
        <span :class="['px-2 py-1 rounded text-xs font-mono font-bold border', severityClass(trait.score)]">{{ trait.score }}/100</span>
      </div>
      <p class="text-slate-350 text-sm leading-relaxed mb-4">{{ trait.description }}</p>
      <div class="bg-black/30 border border-black/20 rounded-xl p-3 flex items-start gap-2.5">
        <span class="text-slate-650 font-mono text-xs shrink-0">&gt; Evidence:</span>
        <span class="text-indigo-300 font-mono text-xs italic">{{ trait.evidence }}</span>
      </div>
    </div>
  </div>
</template>
