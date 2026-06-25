import React, { useMemo, useState } from 'react';
import { FileHotspot } from '../lib/repoHealth';

interface TreemapProps {
  data: FileHotspot[];
}

interface TreemapRect extends FileHotspot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function Treemap({ data = [] }: TreemapProps) {
  const [hoveredFile, setHoveredFile] = useState<TreemapRect | null>(null);

  const rects = useMemo(() => {
    const width = 600;
    const height = 350;

    if (!data || data.length === 0) return [];

    // Filter and sort items by churn descending
    const items = [...data].sort((a, b) => b.churn - a.churn);

    const result: TreemapRect[] = [];

    // Recursive slice-and-dice layout function
    function sliceAndDice(
      list: FileHotspot[],
      x: number,
      y: number,
      w: number,
      h: number,
      isVertical: boolean
    ) {
      if (list.length === 0) return;
      if (list.length === 1) {
        result.push({
          ...list[0],
          x,
          y,
          w,
          h,
        });
        return;
      }

      // Calculate total churn/weight
      const total = list.reduce((sum, item) => sum + item.churn, 0);

      // Find dividing point
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

      const leftWeight = leftList.reduce((sum, item) => sum + item.churn, 0);
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
  }, [data]);

  // Color mapping based on recency (days since last modified)
  const getColor = (daysAgo: number) => {
    if (daysAgo <= 2) return '#ec4899'; // pink-500 (very hot/recent)
    if (daysAgo <= 7) return '#a855f7'; // purple-500 (hot)
    if (daysAgo <= 30) return '#6366f1'; // indigo-500 (warm)
    return '#475569'; // slate-500 (cold)
  };

  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">
            File Churn & Hotspot Treemap
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Rectangle size represents modification counts (churn); colors show recency of modifications.
          </span>
        </div>
        
        {/* Color Legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ec4899]" /> &lt;2d
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]" /> &lt;7d
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#6366f1]" /> &lt;30d
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#475569]" /> &gt;30d
          </span>
        </div>
      </div>

      <div className="relative border border-slate-900 rounded-xl overflow-hidden bg-[#030014]/65">
        <svg
          width="100%"
          height="350"
          viewBox="0 0 600 350"
          className="mx-auto"
        >
          {rects.map((rect, idx) => {
            const fill = getColor(rect.lastModifiedDaysAgo);
            
            // Highlight text if rectangle has enough space
            const showLabel = rect.w > 45 && rect.h > 20;
            const showPath = rect.w > 80 && rect.h > 35;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredFile(rect)}
                onMouseLeave={() => setHoveredFile(null)}
                className="cursor-help"
              >
                {/* File box */}
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  fill={fill}
                  fillOpacity="0.4"
                  stroke="#020617"
                  strokeWidth="2"
                  className="hover:fill-opacity-80 transition-all duration-200"
                />

                {/* File labels */}
                {showLabel && (
                  <text
                    x={rect.x + 6}
                    y={rect.y + 15}
                    fill="#e2e8f0"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    {rect.name.length * 6 > rect.w - 12 ? `${rect.name.slice(0, Math.floor(rect.w / 6) - 2)}..` : rect.name}
                  </text>
                )}
                {showPath && (
                  <text
                    x={rect.x + 6}
                    y={rect.y + 27}
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    {rect.path.length * 5 > rect.w - 12 ? `..${rect.path.slice(-Math.floor(rect.w / 5) + 3)}` : rect.path}
                  </text>
                )}

                {/* Built-in fallback title/tooltip */}
                <title>{`${rect.path}\nModified: ${rect.churn} times\nLast modified: ${rect.lastModifiedDaysAgo} days ago`}</title>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip HUD */}
        {hoveredFile && (
          <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-900 px-4 py-2.5 rounded-lg text-left text-xs font-mono text-slate-350 shadow-xl backdrop-blur-sm animate-fade-in pointer-events-none">
            <div className="text-white font-bold text-sm mb-1">{hoveredFile.name}</div>
            <div className="text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px] mb-1">{hoveredFile.path}</div>
            <div className="flex gap-4 mt-2 pt-1.5 border-t border-slate-900">
              <div>
                <span className="text-slate-500 text-[10px] block">CHURN</span>
                <span className="text-indigo-400 font-bold">{hoveredFile.churn} edits</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">RECENCY</span>
                <span className="text-pink-400 font-bold">{hoveredFile.lastModifiedDaysAgo} days ago</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
