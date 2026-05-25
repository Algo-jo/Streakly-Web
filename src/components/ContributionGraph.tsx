import React, { useState, useMemo } from 'react';
import { format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, parseISO, addDays, subDays } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WorkLog } from '../lib/gemini';
import { 
  Calendar, BarChart3, Trophy, Check, ArrowRight, ArrowLeft, Clock,
  FolderOpen, Notebook, FileText, HelpCircle, Flame, Tag, AlertTriangle 
} from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContributionGraphProps {
  logs: WorkLog[];
  highestStreak?: string;
}

export function ContributionGraph({ logs = [], highestStreak }: ContributionGraphProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const startDate = startOfWeek(new Date(currentYear, 0, 1));
  const endDate = endOfWeek(new Date(currentYear, 11, 31));

  // Modal Control States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(format(today, 'yyyy-MM-dd'));

  const finalHighestStreak = useMemo(() => {
    if (highestStreak) return highestStreak;
    try {
      const saved = localStorage.getItem('streakly_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.highestStreak) return parsed.highestStreak;
      }
    } catch (e) {
      // Ignored
    }
    return '92'; // Fallback
  }, [highestStreak]);

  const thisMonthActiveDays = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    
    const thisMonthLogs = logs.filter(log => {
      try {
        const d = parseISO(log.dateStr);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      } catch (e) {
        const d = new Date(log.timestamp);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      }
    });
    
    return new Set(thisMonthLogs.map(l => l.dateStr)).size;
  }, [logs]);

  const consistencyPercentage = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    
    let totalMonthlyRatios = 0;
    const n = curMonth + 1; // months in this year so far
    
    for (let m = 0; m <= curMonth; m++) {
      const totalDaysInMonth = new Date(curYear, m + 1, 0).getDate();
      const logsInMonth = logs.filter(log => {
        try {
          const d = parseISO(log.dateStr);
          return d.getFullYear() === curYear && d.getMonth() === m;
        } catch (e) {
          const d = new Date(log.timestamp);
          return d.getFullYear() === curYear && d.getMonth() === m;
        }
      });
      const loggedDays = new Set(logsInMonth.map(l => l.dateStr)).size;
      totalMonthlyRatios += (loggedDays / totalDaysInMonth);
    }
    
    const percentage = n > 0 ? (totalMonthlyRatios * 100) / n : 0;
    return percentage.toFixed(1);
  }, [logs]);

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

  // Calculate high-level stats for the detailed analysis view
  const stats = useMemo(() => {
    const totalLogs = logs.length;
    const uniqueActiveDays = new Set(logs.map(l => l.dateStr)).size;
    
    // Developer Consistency Grade
    let grade = 'C';
    let label = 'Steady Builder';
    if (uniqueActiveDays >= 60) {
      grade = 'S';
      label = 'Titan of Dev';
    } else if (uniqueActiveDays >= 30) {
      grade = 'A+';
      label = 'Elite Artisan';
    } else if (uniqueActiveDays >= 15) {
      grade = 'A';
      label = 'Dev Pro';
    } else if (uniqueActiveDays >= 5) {
      grade = 'B';
      label = 'Committed Artisan';
    }

    // Category calculation
    const categoriesCount = {
      code: logs.filter(l => l.category === 'code').length,
      note: logs.filter(l => l.category === 'note').length,
      paper: logs.filter(l => l.category === 'paper').length,
      other: logs.filter(l => l.category === 'other').length,
    };

    // Day of the week calculation
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysLogCounts = [0, 0, 0, 0, 0, 0, 0];
    logs.forEach(l => {
      try {
        const d = parseISO(l.dateStr);
        daysLogCounts[d.getDay()] += 1;
      } catch (e) {
        // Fallback for timestamp
        const d = new Date(l.timestamp);
        daysLogCounts[d.getDay()] += 1;
      }
    });

    let maxDayIndex = 0;
    let maxDayCount = 0;
    daysLogCounts.forEach((count, idx) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        maxDayIndex = idx;
      }
    });

    const peakDay = maxDayCount > 0 ? daysOfWeek[maxDayIndex] : 'None';

    return {
      totalLogs,
      activeDaysCount: uniqueActiveDays,
      activePercent: ((uniqueActiveDays / 365) * 100).toFixed(1),
      grade,
      label,
      categoriesCount,
      peakDay,
      peakDayCount: maxDayCount,
    };
  }, [logs]);

  // Selected date logs filtered
  const selectedDateLogs = useMemo(() => {
    return logs.filter(log => log.dateStr === selectedDateStr);
  }, [logs, selectedDateStr]);

  const handleNextDay = () => {
    try {
      const current = parseISO(selectedDateStr);
      const next = addDays(current, 1);
      setSelectedDateStr(format(next, 'yyyy-MM-dd'));
    } catch (e) {
      // Ignored
    }
  };

  const handlePrevDay = () => {
    try {
      const current = parseISO(selectedDateStr);
      const prev = subDays(current, 1);
      setSelectedDateStr(format(prev, 'yyyy-MM-dd'));
    } catch (e) {
      // Ignored
    }
  };

  const formattedSelectedDate = useMemo(() => {
    try {
      const dateObj = parseISO(selectedDateStr);
      return format(dateObj, 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  // Icons mapper for categories
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'code': return FolderOpen;
      case 'note': return Notebook;
      case 'paper': return FileText;
      default: return HelpCircle;
    }
  };

  return (
    <div className="flex flex-col gap-4 relative z-20">
      
      {/* Detail Dialog Popup Wrapper */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">History</h3>
          </div>
        </div>

        <DialogContent className="bg-zinc-950 border-zinc-900 rounded-[2.5rem] sm:max-w-[96vw] xl:max-w-[1300px] w-full p-8 text-white h-[92vh] md:h-[88vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 border-b border-zinc-900 pb-5">
            <DialogTitle className="text-2xl font-black text-white tracking-tight flex items-center justify-between">
              <span className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-emerald-400" /> Let's review details
              </span>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full">
                Interactive Analytics Board
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Modal Grid Section */}
          <div className="flex-1 overflow-y-auto pr-2 py-6 space-y-8 max-h-[calc(88vh-140px)]">
            
            {/* High-Level Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Highest Streak Card */}
              <div className="bg-[#0F1317] border border-zinc-900 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-yellow-500 border border-zinc-500">
                  <Flame className="w-6 h-6 fill-yellow-500/20 text-yellow-500 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Highest Streak</span>
                  <span className="text-xl font-black text-yellow-500 font-mono">{finalHighestStreak} Days</span>
                  <span className="text-[10px] text-zinc-400 block font-semibold">Your ultimate consistency peak</span>
                </div>
              </div>

              {/* Total Log (All Time) Card */}
              <div className="bg-[#0F1317] border border-zinc-900 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-zinc-950 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Total Log (All Time)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{logs.length} Logs</span>
                  <span className="text-[10px] text-zinc-400 block font-semibold">Across all your dev sessions</span>
                </div>
              </div>

              {/* Total Day Log This Month Card */}
              <div className="bg-[#0F1317] border border-zinc-900 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Logged Days This Month</span>
                  <span className="text-xl font-black text-white font-mono">{thisMonthActiveDays} Days</span>
                  <span className="text-[10px] text-[#94A3B8] block font-semibold">In current calendar month</span>
                </div>
              </div>

              {/* Consistency Percentage Card */}
              <div className="bg-[#0F1317] border border-zinc-900 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Consistency Percentage</span>
                  <span className="text-xl font-black text-white font-mono">{consistencyPercentage}%</span>
                  <span className="text-[10px] text-[#94A3B8] block font-semibold">Active frequency ratio</span>
                </div>
              </div>

            </div>

            {/* Feed of selected date */}
            <div className="pt-4">
              <div className="bg-[#0F1317] border border-zinc-900 rounded-[2rem] p-6 flex flex-col min-h-[350px] md:min-h-[400px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4 mb-4 flex-shrink-0">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" /> {formattedSelectedDate} ({selectedDateLogs.length} {selectedDateLogs.length === 1 ? 'Log' : 'Logs'})
                  </h4>
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#94A3B8]">Chronological view</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {selectedDateLogs.map((log) => {
                    const CatIcon = getCategoryIcon(log.category);
                    const isHighPriority = log.priority === 'HIGH';
                    const isMidPriority = log.priority === 'MID';
                    const isLowPriority = log.priority === 'LOW';

                    return (
                      <div 
                        key={log.id}
                        className="bg-zinc-950 rounded-2xl p-4 border border-zinc-900 hover:border-zinc-500 transition-all space-y-3"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-500 flex items-center justify-center text-emerald-400 shrink-0">
                              <CatIcon className="w-4 h-4" />
                            </div>
                            <h5 className="font-extrabold text-sm text-zinc-100 line-clamp-1 leading-tight">{log.title}</h5>
                          </div>

                          {log.priority && log.priority !== 'NONE' && (
                            <span className={cn(
                              "text-[8px] font-black tracking-wider uppercase border px-2 py-0.5 rounded-full leading-none shrink-0",
                              isHighPriority && 'bg-red-500/10 text-red-400 border-red-500/20',
                              isMidPriority && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                              isLowPriority && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            )}>
                              {log.priority}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed pl-1 whitespace-pre-wrap">{log.content}</p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-1">
                          <span className="text-[9px] font-black text-zinc-600 bg-zinc-900 border border-zinc-900/60 px-2 py-0.5 rounded uppercase tracking-wider">
                            {log.category}
                          </span>
                          
                          {log.metadata?.repo && (
                            <span className="text-[9px] font-mono text-emerald-500 font-extrabold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">
                              {log.metadata.repo}
                            </span>
                          )}

                          {log.files && log.files.length > 0 && (
                            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                              File uploaded
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {selectedDateLogs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-900/80 flex items-center justify-center text-zinc-500">
                        <AlertTriangle className="w-6 h-6 text-zinc-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-zinc-400">Zero activities on this day</p>
                        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">You haven't logged any repos, codes, commits, or notes. Keep the chain going!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </DialogContent>
      </Dialog>
      
      {/* Grid Display Calendar */}
      <div className="relative overflow-x-auto md:overflow-visible pb-4 pt-10 scrollbar-hide z-30">
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

          {/* Grid of Cells */}
          <div className="flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => {
                  const level = getContributionLevel(day);
                  const isToday = isSameDay(day, today);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const logCount = logs.filter(l => l.dateStr === dateStr).length;
                  
                  return (
                    <button
                      key={dIdx}
                      onClick={() => {
                        setSelectedDateStr(dateStr);
                        setIsDetailOpen(true);
                      }}
                      className={cn(
                        "w-[10px] h-[10px] rounded-[2px] transition-all duration-300 hover:scale-150 cursor-pointer relative group p-0 text-left outline-none",
                        levelColors[level],
                        isToday && "ring-1 ring-emerald-500 ring-offset-2 ring-offset-zinc-950",
                        selectedDateStr === dateStr && "ring-1 ring-emerald-400"
                      )}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-950 text-[10px] font-mono text-zinc-200 rounded-xl border border-zinc-500 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-[9999] shadow-2xl">
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-500 font-bold border-b border-zinc-500 pb-1 mb-1">{format(day, 'EEEE, MMM d')}</span>
                          <span>{logCount} {logCount === 1 ? 'log' : 'logs'}</span>
                          <span className="text-[8px] text-zinc-500 uppercase mt-0.5 font-bold">Click to view detail</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-zinc-500/50">
        <span className="text-[10px] font-medium text-zinc-500">Learn how we count history</span>
      </div>
    </div>
  );
}
