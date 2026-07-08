<script setup lang="ts">
import { computed } from 'vue';
import type { AnalysisResult } from '@/types/analysis';

const props = defineProps<{ result: AnalysisResult }>();

const badgeColors = [
  'from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-300',
  'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-300',
  'from-pink-500/10 to-rose-500/10 border-pink-500/20 text-pink-300',
  'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300',
  'from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-300',
];

function getBadgeStyle(idx: number) {
  return badgeColors[idx % badgeColors.length];
}

function copyAllPredictions() {
  const text = `🔮 AI Predictions for ${props.result.repository.owner}/${props.result.repository.name} (${props.result.profile.archetype}):\n\n${props.result.profile.predictions.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  navigator.clipboard.writeText(text);
  alert('Predictions copied to clipboard!');
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-br from-indigo-950/40 via-slate-950/50 to-purple-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">AI Predictions & Future Roasts</h3>
      </div>
      <p class="text-slate-500 text-xs mb-6">
        Based on commit patterns, coding style, and developer personality metrics, the AI Oracle predicts the following futures for this codebase:
      </p>
      <div class="space-y-4">
        <div
          v-for="(prediction, idx) in result.profile.predictions"
          :key="idx"
          class="relative p-4 bg-slate-900/50 border border-slate-900 rounded-xl overflow-hidden group hover:border-slate-800 transition"
        >
          <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-l-xl" />
          <div class="pl-4">
            <div class="flex items-start gap-2">
              <span class="shrink-0 mt-0.5 font-mono text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                #{{ String(idx + 1).padStart(2, '0') }}
              </span>
              <p class="text-slate-300 text-sm leading-relaxed">{{ prediction }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Achievement Badges -->
    <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <h3 class="text-slate-350 text-sm font-semibold mb-4 font-mono uppercase tracking-wider">Achievement Badges Unlocked</h3>
      <div class="flex flex-wrap gap-3">
        <span
          v-for="(badge, idx) in result.profile.shareableBadges"
          :key="idx"
          :class="['px-4 py-2 rounded-xl border bg-gradient-to-r text-xs font-mono font-semibold tracking-wide', getBadgeStyle(idx)]"
        >
          🏆 #{{ badge }}
        </span>
      </div>
    </div>

    <!-- Fun roast copy button -->
    <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 text-center">
      <p class="text-slate-500 text-xs mb-3">Export predictions for your team standup or post on your README:</p>
      <button
        type="button"
        class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-xs rounded-lg px-5 py-2.5 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition"
        @click="copyAllPredictions"
      >
        Copy All Predictions
      </button>
    </div>
  </div>
</template>
