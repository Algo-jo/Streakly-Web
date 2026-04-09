import React from 'react';
import { format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContributionGraphProps {
  logs: { dateStr: string }[];
}

export function ContributionGraph({ logs }: ContributionGraphProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const startDate = startOfWeek(new Date(currentYear, 0, 1));
  const endDate = endOfWeek(new Date(currentYear, 11, 31));

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Group days into weeks (columns)
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getContributionLevel = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = logs.filter(log => log.dateStr === dateStr).length;
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  const levelColors = [
    'bg-zinc-800/50',
    'bg-emerald-900/60',
    'bg-emerald-700/70',
    'bg-emerald-500/80',
    'bg-emerald-400',
  ];

  // Identify where month labels should go
  const monthLabels: { name: string; weekIndex: number }[] = [];
  weeks.forEach((week, index) => {
    const firstDay = week[0];
    if (firstDay.getDate() <= 7) {
      const monthName = format(firstDay, 'MMM');
      if (!monthLabels.find(l => l.name === monthName)) {
        monthLabels.push({ name: monthName, weekIndex: index });
      }
    }
  });

  return (
    <div className="flex flex-col gap-6 p-8 bg-[#0F1317] rounded-[2rem] border border-zinc-800/50 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Contributions</h3>
        <button className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors tracking-widest">VIEW DETAIL</button>
      </div>
      
      <div className="relative overflow-x-auto pb-4 pt-10 scrollbar-hide">
        <div className="min-w-max">
          {/* Month Labels */}
          <div className="relative h-6 mb-2">
            {monthLabels.map((label, i) => (
              <div 
                key={i} 
                className="absolute text-[10px] font-bold text-zinc-400 uppercase tracking-widest"
                style={{ left: `${label.weekIndex * 14}px` }}
              >
                {label.name}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => {
                  const level = getContributionLevel(day);
                  const isToday = isSameDay(day, today);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const logCount = logs.filter(l => l.dateStr === dateStr).length;
                  
                  return (
                    <div
                      key={dIdx}
                      className={cn(
                        "w-[10px] h-[10px] rounded-[2px] transition-all duration-300 hover:scale-150 cursor-help relative group",
                        levelColors[level],
                        isToday && "ring-1 ring-emerald-500 ring-offset-2 ring-offset-zinc-950"
                      )}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-950 text-[10px] font-mono text-zinc-200 rounded-xl border border-zinc-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-[100] shadow-2xl">
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-500 font-bold border-b border-zinc-800 pb-1 mb-1">{format(day, 'EEEE, MMM d')}</span>
                          <span>{logCount} {logCount === 1 ? 'contribution' : 'contributions'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50">
        <span className="text-[10px] font-medium text-zinc-500">Learn how we count contributions</span>
        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <span>Less</span>
          <div className="flex gap-1">
            {levelColors.map((color, i) => (
              <div key={i} className={cn("w-2.5 h-2.5 rounded-[2px]", color)} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
