import React, { useMemo, useState } from 'react';

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface ContributorNode {
  id: string;
  commits: number;
  avatarUrl: string | null;
}

interface CollaborationGraphProps {
  edges: Edge[];
  contributors: { username: string; commitsCount: number; avatarUrl: string | null }[];
  highlightUser?: string;
}

export default function CollaborationGraph({
  edges = [],
  contributors = [],
  highlightUser,
}: CollaborationGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeHighlight = hoveredNode || highlightUser || null;

  // Run a static force layout computation
  const laidOutNodes = useMemo(() => {
    const width = 600;
    const height = 350;
    const cx = width / 2;
    const cy = height / 2;

    // Filter down to contributors that actually exist in the commit records
    const nodes: Record<string, { id: string; x: number; y: number; vx: number; vy: number; radius: number; avatarUrl: string | null }> = {};
    
    // Find min and max commits to scale node sizes
    const commitCounts = contributors.map((c) => c.commitsCount);
    const maxCommits = Math.max(...commitCounts, 1);
    const minCommits = Math.min(...commitCounts, 1);

    contributors.forEach((c, index) => {
      // Scale radius between 12 and 24
      const radius = 12 + ((c.commitsCount - minCommits) / (maxCommits - minCommits || 1)) * 12;
      
      // Initialize in a circle
      const angle = (index / (contributors.length || 1)) * 2 * Math.PI;
      nodes[c.username] = {
        id: c.username,
        x: cx + 120 * Math.cos(angle) + (Math.random() - 0.5) * 10,
        y: cy + 120 * Math.sin(angle) + (Math.random() - 0.5) * 10,
        vx: 0,
        vy: 0,
        radius,
        avatarUrl: c.avatarUrl,
      };
    });

    // Run simple spring forces simulation for 180 iterations
    const iterations = 180;
    const repelStrength = 1800;
    const attractStrength = 0.05;
    const centerStrength = 0.03;
    const damping = 0.85;

    const nodeIds = Object.keys(nodes);

    for (let iter = 0; iter < iterations; iter++) {
      // 1. Repulsive forces between all node pairs
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const n1 = nodes[nodeIds[i]];
          const n2 = nodes[nodeIds[j]];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          // Force is inversely proportional to distance
          const force = repelStrength / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx += fx;
          n1.vy += fy;
          n2.vx -= fx;
          n2.vy -= fy;
        }
      }

      // 2. Attractive forces along links/edges
      edges.forEach((edge) => {
        const n1 = nodes[edge.source];
        const n2 = nodes[edge.target];
        if (!n1 || !n2) return;

        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Link force pulling them to ideal distance (e.g. 100px)
        const restLength = 90;
        const scaleWeight = Math.min(edge.weight, 10) / 10; // clamp weight
        const force = (dist - restLength) * attractStrength * (0.2 + scaleWeight * 0.8);
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;
      });

      // 3. Central gravity and update positions
      nodeIds.forEach((id) => {
        const n = nodes[id];
        // Central force
        const cdx = cx - n.x;
        const cdy = cy - n.y;
        n.vx += cdx * centerStrength;
        n.vy += cdy * centerStrength;

        // Apply velocities
        n.x += n.vx;
        n.y += n.vy;

        // Friction/Damping
        n.vx *= damping;
        n.vy *= damping;

        // Keep inside canvas bounds
        n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
      });
    }

    return {
      nodes: Object.values(nodes),
      width,
      height,
    };
  }, [contributors, edges]);

  // Map edges to coordinate lines
  const graphEdges = useMemo(() => {
    const nodeLookup = new Map(laidOutNodes.nodes.map((n) => [n.id, n]));
    
    return edges
      .map((e) => {
        const sourceNode = nodeLookup.get(e.source);
        const targetNode = nodeLookup.get(e.target);
        if (!sourceNode || !targetNode) return null;
        return {
          source: e.source,
          target: e.target,
          weight: e.weight,
          x1: sourceNode.x,
          y1: sourceNode.y,
          x2: targetNode.x,
          y2: targetNode.y,
        };
      })
      .filter(Boolean) as { source: string; target: string; weight: number; x1: number; y1: number; x2: number; y2: number }[];
  }, [laidOutNodes, edges]);

  // Determine if a node/edge is highlighted or dimmed
  const getOpacity = (id: string) => {
    if (!activeHighlight) return 1.0;
    if (activeHighlight === id) return 1.0;
    
    // Check if connected
    const isConnected = edges.some(
      (e) => (e.source === id && e.target === activeHighlight) || (e.target === id && e.source === activeHighlight)
    );
    return isConnected ? 0.8 : 0.15;
  };

  const getEdgeOpacity = (source: string, target: string) => {
    if (!activeHighlight) return 0.25;
    if (source === activeHighlight || target === activeHighlight) return 0.9;
    return 0.05;
  };

  const getEdgeStroke = (source: string, target: string) => {
    if (source === activeHighlight || target === activeHighlight) return 'url(#edgeGlow)';
    return '#334155'; // slate-700
  };

  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <div className="mb-4">
        <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">
          Collaboration Network
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">
          Visualizing contributors connected by files they both modified. Hover over a contributor to inspect.
        </span>
      </div>

      <div className="relative border border-slate-900 rounded-xl overflow-hidden bg-[#030014]/65">
        <svg
          width="100%"
          height="350"
          viewBox={`0 0 ${laidOutNodes.width} ${laidOutNodes.height}`}
          className="mx-auto"
        >
          <defs>
            <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" /> {/* indigo-400 */}
              <stop offset="100%" stopColor="#c084fc" /> {/* purple-400 */}
            </linearGradient>
          </defs>

          {/* Render lines first (so they draw underneath circles) */}
          {graphEdges.map((edge, idx) => {
            const opacity = getEdgeOpacity(edge.source, edge.target);
            const stroke = getEdgeStroke(edge.source, edge.target);
            const strokeWidth = 1 + Math.min(edge.weight * 0.5, 6);
            return (
              <line
                key={idx}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Render circles */}
          {laidOutNodes.nodes.map((node) => {
            const opacity = getOpacity(node.id);
            const isUserHighlighted = activeHighlight === node.id;
            
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                opacity={opacity}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node Ring/Glow if highlighted */}
                <circle
                  r={node.radius + 4}
                  fill="transparent"
                  stroke={isUserHighlighted ? '#a855f7' : 'transparent'}
                  strokeWidth="2"
                  className="animate-pulse"
                />

                {/* Main Circle */}
                {node.avatarUrl ? (
                  <g>
                    <clipPath id={`clip-${node.id}`}>
                      <circle r={node.radius} />
                    </clipPath>
                    <circle r={node.radius} fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
                    <image
                      href={node.avatarUrl}
                      x={-node.radius}
                      y={-node.radius}
                      width={node.radius * 2}
                      height={node.radius * 2}
                      clipPath={`url(#clip-${node.id})`}
                    />
                  </g>
                ) : (
                  <circle
                    r={node.radius}
                    fill="#1e1b4b"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                  />
                )}

                {/* Node Label Text */}
                <text
                  y={node.radius + 13}
                  textAnchor="middle"
                  fill={isUserHighlighted ? '#e9d5ff' : '#94a3b8'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={isUserHighlighted ? 'bold' : 'normal'}
                  className="pointer-events-none filter drop-shadow-md"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
