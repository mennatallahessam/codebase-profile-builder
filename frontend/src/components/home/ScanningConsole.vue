<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{ logs: string[] }>();
const logEndRef = ref<HTMLElement | null>(null);

watch(() => props.logs, async () => {
  await nextTick();
  logEndRef.value?.scrollIntoView({ behavior: 'smooth' });
}, { deep: true });
</script>

<template>
  <div class="w-full max-w-xl mx-auto px-4 py-12 bg-slate-950/80 border border-slate-900 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
    <div class="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
      <div class="flex items-center gap-3">
        <span class="flex h-3 w-3 relative">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span class="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
        </span>
        <span class="font-mono text-sm font-semibold text-slate-300">Scanning Repository...</span>
      </div>
      <span class="font-mono text-xs text-slate-500">Console Output</span>
    </div>
    <div class="h-64 overflow-y-auto font-mono text-xs text-indigo-400/90 space-y-2.5 p-4 rounded-xl bg-black/60 border border-black/40">
      <div v-for="(log, i) in logs" :key="i" class="leading-relaxed">
        <span class="text-slate-600 mr-2">&gt;&gt;</span>{{ log }}
      </div>
      <div ref="logEndRef" />
    </div>
    <p class="mt-5 text-center text-slate-500 text-xs animate-pulse">
      Please hold. Calculating codebase metrics and consulting the AI oracle.
    </p>
  </div>
</template>
