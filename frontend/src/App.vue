<script setup lang="ts">
import { provide } from 'vue';
import ThemeProvider from '@/components/ThemeProvider.vue';
import AppBackground from '@/components/layout/AppBackground.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import { useCredentials } from '@/composables/useCredentials';

const credentials = useCredentials();
provide('credentials', credentials);

const {
  showSettings,
  clientGhToken,
  clientOpenAiKey,
  saveSettings,
} = credentials;
</script>

<template>
  <ThemeProvider>
    <div class="relative min-h-screen flex flex-col overflow-x-hidden selection:bg-purple-500 selection:text-white">
      <AppBackground />
      <AppHeader @open-settings="showSettings = true" />
      <main class="flex-grow">
        <RouterView />
      </main>
      <AppFooter />
      <SettingsModal
        v-if="showSettings"
        v-model:github-token="clientGhToken"
        v-model:openai-key="clientOpenAiKey"
        @close="showSettings = false"
        @save="saveSettings"
      />
    </div>
  </ThemeProvider>
</template>
