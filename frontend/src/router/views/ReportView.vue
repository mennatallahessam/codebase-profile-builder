<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DashboardView from '@/components/dashboard/DashboardView.vue';
import type { AnalysisResult } from '@/types/analysis';

const props = defineProps<{ id: string }>();

const report = ref<AnalysisResult | null>(null);
const loading = ref(true);
const errorMsg = ref('');

async function fetchReport() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await fetch(`/api/report?id=${props.id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Report not found');
    report.value = data;
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to load report';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchReport();
});
</script>

<template>
  <div class="max-w-7xl mx-auto w-full px-4 py-10 md:px-8">
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <span class="flex h-10 w-10 relative">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
        <span class="relative inline-flex rounded-full h-10 w-10 bg-purple-500" />
      </span>
      <p class="font-mono text-sm text-slate-400 animate-pulse">Retrieving archived codebase profile...</p>
    </div>

    <div v-else-if="errorMsg" class="w-full max-w-lg mx-auto bg-slate-950/60 border border-red-900/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-center">
      <div class="w-16 h-16 rounded-full border border-red-500/30 bg-red-950/50 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-slate-200 mb-2">Report Not Found</h2>
      <p class="text-slate-450 text-xs mb-6 font-mono leading-relaxed">{{ errorMsg }}</p>
      <RouterLink to="/" class="inline-block px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-medium text-sm rounded-lg border border-slate-800 transition">
        ← Return Home
      </RouterLink>
    </div>

    <DashboardView
      v-else-if="report"
      :result="report"
      :is-public-report="true"
    />
  </div>
</template>
