import { ref } from 'vue';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';
import { SCAN_MESSAGES } from '@/constants/scanMessages';

export function useScanLogs() {
  const logs = ref<string[]>([]);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    stop();
    logs.value = [`[0.0s] ${SCAN_MESSAGES[0]}`];
    let index = 0;
    intervalId = setInterval(() => {
      index++;
      if (index < SCAN_MESSAGES.length) {
        const elapsed = (index * 0.4).toFixed(1);
        logs.value = [...logs.value, `[${elapsed}s] ${SCAN_MESSAGES[index]}`];
      } else {
        stop();
      }
    }, 450);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reset = () => {
    stop();
    logs.value = [];
  };

  return { logs, start, stop, reset };
}

export function useAnalysis(getHeaders: () => Record<string, string>) {
  const status = ref<AnalysisStatus>('idle');
  const errorMsg = ref('');
  const result = ref<AnalysisResult | null>(null);
  const { logs, start: startLogs, stop: stopLogs, reset: resetLogs } = useScanLogs();

  const analyze = async (input: string) => {
    if (!input.trim()) return;

    status.value = 'scanning';
    errorMsg.value = '';
    startLogs();

    try {
      const payload = input.startsWith('http') ? { url: input.trim() } : { repo: input.trim() };
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      stopLogs();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      result.value = data;
      status.value = 'success';
    } catch (err: unknown) {
      stopLogs();
      errorMsg.value = err instanceof Error ? err.message : 'Something went wrong while profiling the codebase.';
      status.value = 'error';
    }
  };

  const reset = () => {
    status.value = 'idle';
    result.value = null;
    errorMsg.value = '';
    resetLogs();
  };

  return { status, errorMsg, result, logs, analyze, reset };
}
