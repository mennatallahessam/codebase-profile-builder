<script setup lang="ts">
import { ref, provide, watch, onMounted } from 'vue';

type Theme = 'dark' | 'light';

const theme = ref<Theme>('dark');

function applyTheme(value: Theme) {
  document.documentElement.classList.toggle('dark', value === 'dark');
  document.documentElement.classList.toggle('light', value === 'light');
  document.documentElement.style.setProperty('--background', value === 'dark' ? '#030712' : '#f8fafc');
  document.documentElement.style.setProperty('--foreground', value === 'dark' ? '#f1f5f9' : '#0f172a');
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

onMounted(() => {
  const saved = localStorage.getItem('profiler_theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') theme.value = saved;
  applyTheme(theme.value);
});

watch(theme, (value) => {
  localStorage.setItem('profiler_theme', value);
  applyTheme(value);
});

provide('theme', theme);
provide('toggleTheme', toggleTheme);
</script>

<template>
  <slot />
</template>
