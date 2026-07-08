<script setup lang="ts">
import { ref, inject } from 'vue';
import SearchHero from '@/components/home/SearchHero.vue';
import ScanningConsole from '@/components/home/ScanningConsole.vue';
import ErrorPanel from '@/components/home/ErrorPanel.vue';
import DashboardView from '@/components/dashboard/DashboardView.vue';
import { useAnalysis } from '@/composables/useAnalysis';
import type { useCredentials } from '@/composables/useCredentials';

const input = ref('');
const credentials = inject<ReturnType<typeof useCredentials>>('credentials');

const getHeaders = () => {
  if (credentials) {
    return credentials.getApiHeaders();
  }
  return { 'Content-Type': 'application/json' };
};

const { status, errorMsg, result, logs, analyze, reset } = useAnalysis(getHeaders);

function handleOpenSettings() {
  if (credentials) {
    credentials.showSettings.value = true;
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto w-full px-4 py-10 md:px-8">
    <SearchHero
      v-if="status === 'idle'"
      v-model:input="input"
      :has-github-token="credentials ? credentials.hasGithubToken.value : null"
      @analyze="analyze"
      @open-settings="handleOpenSettings"
    />
    <ScanningConsole
      v-else-if="status === 'scanning'"
      :logs="logs"
    />
    <ErrorPanel
      v-else-if="status === 'error'"
      :error-msg="errorMsg"
      @retry="reset"
    />
    <DashboardView
      v-else-if="status === 'success' && result"
      :result="result"
      @reset="reset"
    />
  </div>
</template>
