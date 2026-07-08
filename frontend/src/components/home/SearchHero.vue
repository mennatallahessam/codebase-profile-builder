<script setup lang="ts">
defineProps<{ hasGithubToken: boolean | null }>();
const emit = defineEmits<{ analyze: [input: string]; openSettings: [] }>();
const input = defineModel<string>('input', { default: '' });
</script>

<template>
  <div class="w-full max-w-2xl text-center mx-auto px-4 py-12 md:px-8">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-mono mb-6 backdrop-blur-sm">
      <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
      AI-Powered Codebase Personality Analyzer
    </div>

    <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 font-space">
      Does your code have
      <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Personality?</span>
    </h1>

    <p class="text-slate-300 text-base md:text-lg max-w-xl mx-auto mb-6">
      Analyze any public GitHub repository for AI-generated personality traits, contributor intelligence, and code health metrics.
    </p>

    <form class="relative max-w-xl mx-auto" @submit.prevent="emit('analyze', input)">
      <div class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur group-hover:opacity-60 transition duration-1000" />
        <div class="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md">
          <input
            v-model="input"
            type="text"
            placeholder="e.g. facebook/react or https://github.com/facebook/react"
            class="w-full bg-transparent text-slate-100 placeholder-slate-500 pl-3 pr-2 py-2 focus:outline-none text-sm md:text-base"
            required
          />
          <button
            type="submit"
            class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium text-sm rounded-lg px-5 py-2.5 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition shrink-0"
          >
            Analyze
          </button>
        </div>
      </div>
      <p v-if="hasGithubToken === false" class="mt-4 text-slate-600 text-xs font-mono">
        ⚡ No GitHub token detected — limited to 60 API calls/hr.
        <button type="button" class="text-indigo-500 hover:text-indigo-400 underline bg-transparent border-none p-0 cursor-pointer font-mono" @click="emit('openSettings')">
          Add a free token
        </button>
        for 5,000/hr.
      </p>
    </form>
  </div>
</template>
