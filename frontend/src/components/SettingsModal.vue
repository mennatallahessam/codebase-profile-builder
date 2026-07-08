<script setup lang="ts">
defineProps<{
  githubToken: string;
  openaiKey: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
  'update:githubToken': [value: string];
  'update:openaiKey': [value: string];
}>();
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
    <div class="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
      <div class="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
      <div class="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div class="flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
        <h2 class="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          API Credentials Setup
        </h2>
        <button type="button" class="text-slate-400 hover:text-white transition-colors" @click="emit('close')">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form class="space-y-6" @submit.prevent="emit('save')">
        <div>
          <label class="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
            GitHub Personal Access Token (PAT)
          </label>
          <input
            type="password"
            :value="githubToken"
            placeholder="ghp_..."
            class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
            @input="emit('update:githubToken', ($event.target as HTMLInputElement).value)"
          />
          <p class="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-mono">
            Used to bypass GitHub's 60 requests/hr unauthenticated rate limit.
            <a
              href="https://github.com/settings/tokens/new?description=Codebase+Profiler&scopes=public_repo"
              target="_blank"
              rel="noreferrer"
              class="text-indigo-400 hover:text-indigo-300 underline"
            >Generate free PAT</a>
            with the <code class="text-slate-400">public_repo</code> scope.
          </p>
        </div>

        <div>
          <label class="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
            OpenAI API Key (Optional)
          </label>
          <input
            type="password"
            :value="openaiKey"
            placeholder="sk-proj-..."
            class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
            @input="emit('update:openaiKey', ($event.target as HTMLInputElement).value)"
          />
          <p class="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-mono">
            Enables real AI personality profiling. Without it, a witty mock engine is used.
          </p>
        </div>

        <button
          type="submit"
          class="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition"
        >
          Save Credentials
        </button>
      </form>
    </div>
  </div>
</template>
