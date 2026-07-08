<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ errorMsg: string }>();
const emit = defineEmits<{ retry: [] }>();

const isRateLimit = computed(() => props.errorMsg.toLowerCase().includes('rate limit'));
const isNotFound = computed(() => props.errorMsg.toLowerCase().includes('not found'));
</script>

<template>
  <div
    class="w-full max-w-lg mx-auto px-4 py-12 bg-slate-950/60 border rounded-2xl p-6 shadow-2xl backdrop-blur-md"
    :class="isRateLimit ? 'border-amber-900/40' : 'border-red-900/40'"
  >
    <h2 class="text-xl font-bold text-slate-200 mb-2 text-center">
      {{ isRateLimit ? '⚡ GitHub Rate Limit Hit' : 'Analysis Failed' }}
    </h2>
    <p class="text-slate-400 text-sm mb-5 leading-relaxed text-center">{{ errorMsg }}</p>

    <div v-if="isRateLimit" class="mb-5 bg-slate-900/80 border border-amber-900/30 rounded-xl p-4 text-left text-xs text-slate-300 space-y-2">
      <p class="text-amber-400 font-bold font-mono uppercase">🔑 Fix: Add a GitHub Token</p>
      <p>Go to GitHub Settings → Developer settings → Personal access tokens → Generate classic token with <code class="text-amber-300">public_repo</code> scope.</p>
      <div class="bg-black/50 rounded-lg px-3 py-2 font-mono text-emerald-400">GITHUB_TOKEN=ghp_your_token_here</div>
    </div>

    <div v-if="isNotFound" class="mb-5 bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
      <p>• Use format <code class="text-indigo-300">owner/repo</code></p>
      <p>• Repository must be <strong class="text-slate-300">public</strong></p>
    </div>

    <button
      type="button"
      class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm rounded-lg border border-slate-800 transition"
      @click="emit('retry')"
    >
      ← Try Another Repository
    </button>
  </div>
</template>
