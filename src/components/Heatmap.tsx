import React, { useMemo } from 'react';

interface HeatmapProps {
  data: Record<string, number>; // YYYY-MM-DD -> count
}

export default function Heatmap({ data = {} }: HeatmapProps) {
  const { weeks, totalCommits } = useMemo(() => {
    // Generate dates for the past year (53 weeks, ending today)
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 365);
    
    // Adjust startDate to start on a Sunday
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const tempWeeks: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];
    const currentDate = new Date(startDate);

    let sum = 0;

    while (currentDate <= today || tempWeeks.length < 53) {
      const ymd = currentDate.toISOString().slice(0, 10);
      const count = data[ymd] || 0;
      sum += count;

      currentWeek.push({
        date: new Date(currentDate),
        count,
      });

      if (currentWeek.length === 7) {
        tempWeeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      // pad with empty days if needed
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(currentDate), count: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      tempWeeks.push(currentWeek);
    }

    return { weeks: tempWeeks, totalCommits: sum };
  }, [data]);

  // Color mapping based on commit count
  const getColor = (count: number) => {
    if (count === 0) return '#1e293b'; // slate-800
    if (count <= 2) return '#a78bfa';  // violet-400
    if (count <= 5) return '#8b5cf6';  // violet-600
    if (count <= 10) return '#6d28d9'; // violet-700
    return '#4c1d95';                  // violet-900
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Extract month labels based on column indices
  const monthLabels = useMemo(() => {
    const labels: { text: string; index: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, index) => {
      const firstDay = week[0].date;
      const m = firstDay.getMonth();
      if (m !== lastMonth && index % 4 === 0) {
        labels.push({ text: months[m], index });
        lastMonth = m;
      }
    });
    
    return labels;
  }, [weeks]);

  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-slate-350 text-sm font-semibold font-mono uppercase tracking-wider">
            Contribution Calendar
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            {totalCommits} commits in the analyzed history
          </span>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-[#1e293b]" />
          <div className="w-2.5 h-2.5 rounded bg-[#a78bfa]" />
          <div className="w-2.5 h-2.5 rounded bg-[#8b5cf6]" />
          <div className="w-2.5 h-2.5 rounded bg-[#6d28d9]" />
          <div className="w-2.5 h-2.5 rounded bg-[#4c1d95]" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto select-none scrollbar-thin scrollbar-thumb-slate-800">
        <div className="min-w-[700px] py-2">
          <svg width="720" height="110" viewBox="0 0 720 110" className="mx-auto overflow-visible">
            {/* Month Labels */}
            {monthLabels.map((lbl, idx) => (
              <text
                key={idx}
                x={lbl.index * 13 + 15}
                y="10"
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                {lbl.text}
              </text>
            ))}

            {/* Day Row Headers */}
            <text x="0" y="27" fill="#64748b" fontSize="8" fontFamily="monospace">M</text>
            <text x="0" y="53" fill="#64748b" fontSize="8" fontFamily="monospace">W</text>
            <text x="0" y="79" fill="#64748b" fontSize="8" fontFamily="monospace">F</text>

            {/* Grid Cells */}
            <g transform="translate(15, 18)">
              {weeks.map((week, wIdx) => (
                <g key={wIdx} transform={`translate(${wIdx * 13}, 0)`}>
                  {week.map((day, dIdx) => {
                    const fill = getColor(day.count);
                    const formattedDate = day.date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    
                    return (
                      <rect
                        key={dIdx}
                        y={dIdx * 13}
                        width="10"
                        height="10"
                        rx="2"
                        fill={fill}
                        className="hover:stroke-purple-300 hover:stroke-[1.5px] transition-colors cursor-help"
                      >
                        <title>{`${day.count} commits on ${formattedDate}`}</title>
                      </rect>
                    );
                  })}
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
