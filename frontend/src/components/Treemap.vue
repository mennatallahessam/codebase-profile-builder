<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FileHotspot } from '@/types/analysis';

const props = withDefaults(defineProps<{ data?: FileHotspot[] }>(), { data: () => [] });
const hoveredFile = ref<FileHotspot & { x: number; y: number; w: number; h: number } | null>(null);

interface TreemapRect extends FileHotspot {
  x: number;
  y: number;
  w: number;
  h: number;
}

const rects = computed(() => {
  const width = 600;
  const height = 350;
  if (!props.data?.length) return [] as TreemapRect[];

  const items = [...props.data].sort((a, b) => b.churn - a.churn);
  const result: TreemapRect[] = [];

  function sliceAndDice(
    list: FileHotspot[],
    x: number,
    y: number,
    w: number,
    h: number,
    isVertical: boolean,
  ) {
    if (list.length === 0) return;
    if (list.length === 1) {
      result.push({ ...list[0], x, y, w, h });
      return;
    }
    const total = list.reduce((sum, item) => sum + item.churn, 0);
    let sum = 0;
    let splitIdx = 0;
    for (let i = 0; i < list.length; i++) {
      sum += list[i].churn;
      if (sum >= total / 2 || i === list.length - 2) {
        splitIdx = i + 1;
        break;
      }
    }
    const leftList = list.slice(0, splitIdx);
    const rightList = list.slice(splitIdx);
    const leftWeight = leftList.reduce((s, item) => s + item.churn, 0);
    const ratio = leftWeight / total;
    if (isVertical) {
      const splitW = w * ratio;
      sliceAndDice(leftList, x, y, splitW, h, !isVertical);
      sliceAndDice(rightList, x + splitW, y, w - splitW, h, !isVertical);
    } else {
      const splitH = h * ratio;
      sliceAndDice(leftList, x, y, w, splitH, !isVertical);
      sliceAndDice(rightList, x, y + splitH, w, h - splitH, !isVertical);
    }
  }

  sliceAndDice(items, 0, 0, width, height, true);
  return result;
});

function getColor(daysAgo: number) {
  if (daysAgo <= 2) return '#ec4899';
  if (daysAgo <= 7) return '#a855f7';
  if (daysAgo <= 30) return '#6366f1';
  return '#475569';
}
</script>

<template>
  <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">File Churn & Hotspot Treemap</h3>
        <span class="text-[10px] text-slate-500 font-mono">Rectangle size = modification counts; colors = recency.</span>
      </div>
    </div>
    <div class="relative border border-slate-900 rounded-xl overflow-hidden bg-[#030014]/65">
      <svg width="100%" height="350" viewBox="0 0 600 350" class="mx-auto">
        <g
          v-for="(rect, idx) in rects"
          :key="idx"
          class="cursor-help"
          @mouseenter="hoveredFile = rect"
          @mouseleave="hoveredFile = null"
        >
          <rect
            :x="rect.x"
            :y="rect.y"
            :width="rect.w"
            :height="rect.h"
            :fill="getColor(rect.lastModifiedDaysAgo)"
            fill-opacity="0.4"
            stroke="#020617"
            stroke-width="2"
            class="hover:fill-opacity-80 transition-all duration-200"
          />
          <title>{{ rect.path }} — {{ rect.churn }} edits, {{ rect.lastModifiedDaysAgo }}d ago</title>
        </g>
      </svg>
      <div
        v-if="hoveredFile"
        class="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-900 px-4 py-2.5 rounded-lg text-xs font-mono text-slate-350 shadow-xl backdrop-blur-sm pointer-events-none"
      >
        <div class="text-white font-bold text-sm mb-1">{{ hoveredFile.name }}</div>
        <div class="text-slate-500 truncate max-w-[280px] mb-1">{{ hoveredFile.path }}</div>
        <div class="flex gap-4 mt-2 pt-1.5 border-t border-slate-900">
          <div><span class="text-slate-500 text-[10px] block">CHURN</span><span class="text-indigo-400 font-bold">{{ hoveredFile.churn }} edits</span></div>
          <div><span class="text-slate-500 text-[10px] block">RECENCY</span><span class="text-pink-400 font-bold">{{ hoveredFile.lastModifiedDaysAgo }} days ago</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
