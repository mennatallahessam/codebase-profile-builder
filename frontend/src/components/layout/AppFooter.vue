<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer class="border-t border-slate-900/40 bg-slate-950/20 py-6 text-center mt-10">
    <p class="text-slate-600 text-xs font-mono">
      Made with ♥ by Antigravity AI Pair Programmer © {{ year }}
    </p>
  </footer>
</template>
