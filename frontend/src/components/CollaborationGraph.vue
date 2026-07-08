<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CollaborationEdge, ContributorDetail } from '@/types/analysis';

const props = withDefaults(
  defineProps<{
    edges?: CollaborationEdge[];
    contributors?: ContributorDetail[];
    highlightUser?: string;
  }>(),
  { edges: () => [], contributors: () => [] },
);

const hoveredNode = ref<string | null>(null);
const activeHighlight = computed(() => hoveredNode.value || props.highlightUser || null);

const laidOutNodes = computed(() => {
  const width = 600;
  const height = 350;
  const cx = width / 2;
  const cy = height / 2;
  const nodes: Record<string, {
    id: string; x: number; y: number; vx: number; vy: number; radius: number; avatarUrl: string | null;
  }> = {};

  const commitCounts = props.contributors.map((c) => c.commitsCount);
  const maxCommits = Math.max(...commitCounts, 1);
  const minCommits = Math.min(...commitCounts, 1);

  props.contributors.forEach((c, index) => {
    const radius = 12 + ((c.commitsCount - minCommits) / (maxCommits - minCommits || 1)) * 12;
    const angle = (index / (props.contributors.length || 1)) * 2 * Math.PI;
    nodes[c.username] = {
      id: c.username,
      x: cx + 120 * Math.cos(angle) + (Math.random() - 0.5) * 10,
      y: cy + 120 * Math.sin(angle) + (Math.random() - 0.5) * 10,
      vx: 0, vy: 0, radius, avatarUrl: c.avatarUrl,
    };
  });

  const nodeIds = Object.keys(nodes);
  for (let iter = 0; iter < 180; iter++) {
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const n1 = nodes[nodeIds[i]];
        const n2 = nodes[nodeIds[j]];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);
        const force = 1800 / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        n1.vx += fx; n1.vy += fy;
        n2.vx -= fx; n2.vy -= fy;
      }
    }
    props.edges.forEach((edge) => {
      const n1 = nodes[edge.source];
      const n2 = nodes[edge.target];
      if (!n1 || !n2) return;
      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const scaleWeight = Math.min(edge.weight, 10) / 10;
      const force = (dist - 90) * 0.05 * (0.2 + scaleWeight * 0.8);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      n1.vx -= fx; n1.vy -= fy;
      n2.vx += fx; n2.vy += fy;
    });
    nodeIds.forEach((id) => {
      const n = nodes[id];
      n.vx += (cx - n.x) * 0.03;
      n.vy += (cy - n.y) * 0.03;
      n.x += n.vx; n.y += n.vy;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
      n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
    });
  }

  return { nodes: Object.values(nodes), width, height };
});

const graphEdges = computed(() => {
  const lookup = new Map(laidOutNodes.value.nodes.map((n) => [n.id, n]));
  return props.edges
    .map((e) => {
      const s = lookup.get(e.source);
      const t = lookup.get(e.target);
      if (!s || !t) return null;
      return { ...e, x1: s.x, y1: s.y, x2: t.x, y2: t.y };
    })
    .filter(Boolean) as { source: string; target: string; weight: number; x1: number; y1: number; x2: number; y2: number }[];
});

function nodeOpacity(id: string) {
  const h = activeHighlight.value;
  if (!h) return 1;
  if (h === id) return 1;
  const connected = props.edges.some(
    (e) => (e.source === id && e.target === h) || (e.target === id && e.source === h),
  );
  return connected ? 0.8 : 0.15;
}

function edgeOpacity(source: string, target: string) {
  const h = activeHighlight.value;
  if (!h) return 0.25;
  return source === h || target === h ? 0.9 : 0.05;
}
</script>

<template>
  <div class="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
    <div class="mb-4">
      <h3 class="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">Collaboration Network</h3>
      <span class="text-[10px] text-slate-500 font-mono">Contributors connected by files they both modified.</span>
    </div>
    <div class="relative border border-slate-900 rounded-xl overflow-hidden bg-[#030014]/65">
      <svg
        width="100%"
        height="350"
        :viewBox="`0 0 ${laidOutNodes.width} ${laidOutNodes.height}`"
        class="mx-auto"
      >
        <defs>
          <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#818cf8" />
            <stop offset="100%" stop-color="#c084fc" />
          </linearGradient>
        </defs>
        <line
          v-for="(edge, idx) in graphEdges"
          :key="idx"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
          :stroke="edge.source === activeHighlight || edge.target === activeHighlight ? 'url(#edgeGlow)' : '#334155'"
          :stroke-width="1 + Math.min(edge.weight * 0.5, 6)"
          :opacity="edgeOpacity(edge.source, edge.target)"
          class="transition-all duration-300"
        />
        <g
          v-for="node in laidOutNodes.nodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          :opacity="nodeOpacity(node.id)"
          class="transition-all duration-300 cursor-pointer"
          @mouseenter="hoveredNode = node.id"
          @mouseleave="hoveredNode = null"
        >
          <circle
            :r="node.radius + 4"
            fill="transparent"
            :stroke="activeHighlight === node.id ? '#a855f7' : 'transparent'"
            stroke-width="2"
          />
          <circle :r="node.radius" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" />
          <text
            :y="node.radius + 13"
            text-anchor="middle"
            :fill="activeHighlight === node.id ? '#e9d5ff' : '#94a3b8'"
            font-size="9"
            font-family="monospace"
            class="pointer-events-none"
          >{{ node.id }}</text>
        </g>
      </svg>
    </div>
  </div>
</template>
