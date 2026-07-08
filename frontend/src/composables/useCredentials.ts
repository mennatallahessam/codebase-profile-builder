import { ref, onMounted } from 'vue';

export function useCredentials() {
  const hasGithubToken = ref<boolean | null>(null);
  const showSettings = ref(false);
  const clientGhToken = ref('');
  const clientOpenAiKey = ref('');

  const loadFromStorage = () => {
    clientGhToken.value = localStorage.getItem('custom_github_token') || '';
    clientOpenAiKey.value = localStorage.getItem('custom_openai_key') || '';
  };

  const checkServerStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      const serverHasToken = !!data.hasGithubToken;
      const clientHasToken = !!localStorage.getItem('custom_github_token');
      hasGithubToken.value = serverHasToken || clientHasToken;
    } catch {
      hasGithubToken.value = !!localStorage.getItem('custom_github_token');
    }
  };

  const getApiHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('custom_github_token');
    const key = localStorage.getItem('custom_openai_key');
    if (token?.trim()) headers['x-github-token'] = token.trim();
    if (key?.trim()) headers['x-openai-key'] = key.trim();
    return headers;
  };

  const saveSettings = async () => {
    localStorage.setItem('custom_github_token', clientGhToken.value.trim());
    localStorage.setItem('custom_openai_key', clientOpenAiKey.value.trim());
    const hasClientToken = clientGhToken.value.trim() !== '';
    await checkServerStatus();
    if (hasClientToken) hasGithubToken.value = true;
    showSettings.value = false;
  };

  onMounted(() => {
    loadFromStorage();
    checkServerStatus();
  });

  return {
    hasGithubToken,
    showSettings,
    clientGhToken,
    clientOpenAiKey,
    getApiHeaders,
    saveSettings,
    checkServerStatus,
  };
}
