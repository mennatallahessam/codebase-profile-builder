<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ data?: Record<string, number> }>(), {
  data: () => ({}),
});

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const layout = computed(() => {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 365);
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  const tempWeeks: { date: Date; count: number }[][] = [];
  let currentWeek: { date: Date; count: number }[] = [];
  const currentDate = new Date(startDate);
  let sum = 0;

  while (currentDate <= today || tempWeeks.length < 53) {
    const ymd = currentDate.toISOString().slice(0, 10);
    const count = props.data[ymd] || 0;
    sum += count;
    currentWeek.push({ date: new Date(currentDate), count });
    if (currentWeek.length === 7) {
      tempWeeks.push(currentWeek);
      currentWeek = [];
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(currentDate), count: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    tempWeeks.push(currentWeek);
  }

  const labels: { text: string; index: number }[] = [];
  let lastMonth = -1;
  tempWeeks.forEach((week, index) => {
    const m = week[0].date.getMonth();
    if (m !== lastMonth && index % 4 === 0) {
      labels.push({ text: months[m], index });
      lastMonth = m;
    }
  });

  return { weeks: tempWeeks, totalCommits: sum, monthLabels: labels };
});

function getColor(count: number) {
  if (count === 0) return '#1e293b';
  if (count <= 2) return '#a78bfa';
  if (count <= 5) return '#8b5cf6';
  if (count <= 10) return '#6d28d9';
  return '#4c1d95';
}
</script>

<template>
  <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">Contribution Calendar</h3>
        <span class="text-[10px] text-slate-500 font-mono">{{ layout.totalCommits }} commits in the analyzed history</span>
      </div>
      <div class="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
        <span>Less</span>
        <div class="w-2.5 h-2.5 rounded bg-[#1e293b]" />
        <div class="w-2.5 h-2.5 rounded bg-[#a78bfa]" />
        <div class="w-2.5 h-2.5 rounded bg-[#8b5cf6]" />
        <div class="w-2.5 h-2.5 rounded bg-[#6d28d9]" />
        <div class="w-2.5 h-2.5 rounded bg-[#4c1d95]" />
        <span>More</span>
      </div>
    </div>
    <div class="overflow-x-auto select-none">
      <div class="min-w-[700px] py-2">
        <svg width="720" height="110" viewBox="0 0 720 110" class="mx-auto overflow-visible">
          <text
            v-for="(lbl, idx) in layout.monthLabels"
            :key="idx"
            :x="lbl.index * 13 + 15"
            y="10"
            fill="#64748b"
            font-size="9"
            font-family="monospace"
          >{{ lbl.text }}</text>
          <text x="0" y="27" fill="#64748b" font-size="8" font-family="monospace">M</text>
          <text x="0" y="53" fill="#64748b" font-size="8" font-family="monospace">W</text>
          <text x="0" y="79" fill="#64748b" font-size="8" font-family="monospace">F</text>
          <g transform="translate(15, 18)">
            <g v-for="(week, wIdx) in layout.weeks" :key="wIdx" :transform="`translate(${wIdx * 13}, 0)`">
              <rect
                v-for="(day, dIdx) in week"
                :key="dIdx"
                :y="dIdx * 13"
                width="10"
                height="10"
                rx="2"
                :fill="getColor(day.count)"
                class="hover:stroke-purple-300 hover:stroke-[1.5px] transition-colors cursor-help"
              >
                <title>{{ day.count }} commits on {{ day.date.toLocaleDateString() }}</title>
              </rect>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>
