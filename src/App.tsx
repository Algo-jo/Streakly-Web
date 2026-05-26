import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LogForm } from './components/LogForm';
import { Auth } from './components/Auth';
import { LogList } from './components/LogList';
import { ContributionGraph } from './components/ContributionGraph';
import { ProfileCard } from './components/ProfileCard';
import { Footer } from './components/Footer';
import { ProfileEdit } from './components/ProfileEdit';
import { FollowingSection } from './components/FollowingSection';
import { WorkLog, analyzeProductivity, ProductivityAnalysis } from './lib/gemini';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Plus, FolderOpen, Briefcase, Paperclip, Flame, Calendar, Filter, Folder, Layers, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('streakly_authenticated') === 'true';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [analysis, setAnalysis] = useState<ProductivityAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'form'>('select');
  const [selectedMode, setSelectedMode] = useState<'repo' | 'activity'>('repo');
  const [user, setUser] = useState<any>(null);
  const [addFormStep, setAddFormStep] = useState(1);
  const [editingLogStep, setEditingLogStep] = useState(1);
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<string | null>(null);
  const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState(false);

  const handleAuthSuccess = (profileData: any) => {
    setActiveTab('dashboard');
    setProfile(profileData);
    setIsAuthenticated(true);
    localStorage.setItem('streakly_profile', JSON.stringify(profileData));
    localStorage.setItem('streakly_authenticated', 'true');
  };

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const executeLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsAuthenticated(false);
    localStorage.removeItem('streakly_authenticated');
  };

  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('streakly_profile');
    const defaultProfile = {
      name: 'Algo-Jo',
      role: 'Full-Stack Developer',
      bio: 'Keep building, keep growing, one code log at a time.',
      github: 'algo-jo',
      techStack: 'React, Node.js, TypeScript, Tailwind',
      highestStreak: '92',
      avatarUrl: '',
      followersCount: '1280',
      followingCount: '340',
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultProfile,
        ...parsed,
      };
    }
    return defaultProfile;
  });

  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);

  useEffect(() => {
    if (editingLog) {
      setEditingLogStep(1);
    }
  }, [editingLog]);

  useEffect(() => {
    localStorage.setItem('streakly_profile', JSON.stringify(profile));
  }, [profile]);

  // Load logs from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('streakly_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('streakly_logs', JSON.stringify(logs));
  }, [logs]);

  const handleAddLog = (newLog: { 
    title: string; 
    content: string; 
    category: string; 
    priority?: 'NONE' | 'LOW' | 'MID' | 'HIGH';
    files?: { name: string; size: string; previewUrl?: string }[];
    metadata?: any;
  }) => {
    const log: WorkLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.uid || 'guest',
      title: newLog.title,
      content: newLog.content,
      category: newLog.category as any,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      priority: newLog.priority || 'NONE',
      files: newLog.files || [],
      metadata: newLog.metadata,
    };
    setLogs([log, ...logs]);
    setIsLogModalOpen(false);
  };

  const handleUpdateLog = (id: string, updatedLog: { 
    title: string; 
    content: string; 
    category: string; 
    priority?: 'NONE' | 'LOW' | 'MID' | 'HIGH';
    files?: { name: string; size: string; previewUrl?: string }[];
    metadata?: any;
  }) => {
    setLogs(prev => prev.map(log => {
      if (log.id === id) {
        return {
          ...log,
          title: updatedLog.title,
          content: updatedLog.content,
          category: updatedLog.category as any,
          priority: updatedLog.priority || 'NONE',
          files: updatedLog.files || [],
          metadata: {
            ...log.metadata,
            ...updatedLog.metadata,
          },
        };
      }
      return log;
    }));
    setEditingLog(null);
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    try {
      const result = await analyzeProductivity(logs);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const existingRepos = useMemo(() => {
    const catTitles = logs.filter(l => l.category === 'code').map(l => l.title);
    const repoMetadata = logs.filter(l => l.metadata?.repo).map(l => l.metadata!.repo!);
    return Array.from(new Set([...catTitles, ...repoMetadata])).filter(Boolean);
  }, [logs]);

  const calculateHighestStreak = (logsList: WorkLog[]): number => {
    if (logsList.length === 0) return 0;
    const activeDates = Array.from(new Set(logsList.map(l => l.dateStr).filter(Boolean)));
    activeDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;
    for (const dateStr of activeDates) {
      const currentDate = new Date(dateStr);
      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
          currentStreak = 1;
        }
      }
      prevDate = currentDate;
    }
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
    return maxStreak;
  };

  const streak = analysis?.streakInfo?.currentStreak || 0;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const hasLoggedToday = logs.some(l => l.dateStr === todayDateStr);

  const contributionMetrics = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    
    const logsToAnalyze = selectedHistoryCategory 
      ? logs.filter(l => l.metadata?.repo === selectedHistoryCategory || (l.category === 'code' && l.title === selectedHistoryCategory))
      : logs;
    
    const totalLogs = logsToAnalyze.length;
    
    const thisMonthLogs = logsToAnalyze.filter(log => {
      try {
        const d = parseISO(log.dateStr);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      } catch (e) {
        const d = new Date(log.timestamp);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      }
    });
    const loggedDaysThisMonth = new Set(thisMonthLogs.map(l => l.dateStr)).size;
    
    let totalMonthlyRatios = 0;
    const monthsToCount = curMonth + 1;
    for (let m = 0; m <= curMonth; m++) {
      const totalDaysInMonth = new Date(curYear, m + 1, 0).getDate();
      const logsInMonth = logsToAnalyze.filter(log => {
        try {
          const d = parseISO(log.dateStr);
          return d.getFullYear() === curYear && d.getMonth() === m;
        } catch (e) {
          const d = new Date(log.timestamp);
          return d.getFullYear() === curYear && d.getMonth() === m;
        }
      });
      const loggedInMonthCount = new Set(logsInMonth.map(l => l.dateStr)).size;
      totalMonthlyRatios += (loggedInMonthCount / totalDaysInMonth);
    }
    const percentage = monthsToCount > 0 ? (totalMonthlyRatios * 100) / monthsToCount : 0;
    const consistencyPercentage = percentage.toFixed(1);

    const dynamicHighest = calculateHighestStreak(logsToAnalyze);
    const highestStreak = selectedHistoryCategory 
      ? dynamicHighest.toString() 
      : Math.max(dynamicHighest, Number(profile.highestStreak || '92')).toString();

    return {
      totalLogs,
      loggedDaysThisMonth,
      consistencyPercentage,
      highestStreak
    };
  }, [logs, profile, selectedHistoryCategory]);

  const filteredHistoryLogs = useMemo(() => {
    if (!selectedHistoryCategory) return logs;
    return logs.filter(l => l.metadata?.repo === selectedHistoryCategory || (l.category === 'code' && l.title === selectedHistoryCategory));
  }, [logs, selectedHistoryCategory]);

  // Sorting priorities HIGH -> MID -> LOW (None is excluded as per prompt request)
  const priorityWeights = {
    HIGH: 3,
    MID: 2,
    LOW: 1,
    NONE: 0,
  };

  const prioritizedActivities = logs
    .filter(l => l.priority && l.priority !== 'NONE')
    .sort((a, b) => {
      const weightA = priorityWeights[a.priority || 'NONE'];
      const weightB = priorityWeights[b.priority || 'NONE'];
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return b.timestamp - a.timestamp;
    });

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
            >
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-12">
                <section className="space-y-8">
                  <div className="bg-[#0F1317] p-8 rounded-3xl border border-zinc-500/50">
                    <ContributionGraph logs={logs} highestStreak={profile.highestStreak} />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 bg-[#0F1317] rounded-3xl border border-zinc-500/50">
                    <div className="space-y-1.5">
                      <h3 className="text-2xl font-bold text-white tracking-tight">You are on {streak} Days Streak</h3>
                      {!hasLoggedToday ? (
                        <p className="text-sm font-bold text-yellow-500 flex items-center gap-2 animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                          </span>
                          You haven't logged an activity today
                        </p>
                      ) : (
                        <p className="text-sm text-emerald-400 font-semibold flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          You have logged an activity today!
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      <Button
                        onClick={() => {
                          setSelectedMode('repo');
                          setModalStep('form');
                          setIsLogModalOpen(true);
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 font-bold px-6 py-7 rounded-2xl transition-all text-base whitespace-nowrap cursor-pointer flex items-center gap-2"
                      >
                        <FolderOpen className="w-5 h-5" />
                        Add Category
                      </Button>

                      <Button
                        onClick={() => {
                          setSelectedMode('activity');
                          setModalStep('form');
                          setIsLogModalOpen(true);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-7 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] text-base whitespace-nowrap cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Add Activity
                      </Button>

                      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                        <DialogContent className="bg-zinc-950 border-zinc-500 rounded-3xl p-0 overflow-hidden transition-all duration-300 sm:max-w-[650px] w-full max-h-[95vh] flex flex-col">
                          <DialogHeader className="p-8 pb-0 flex-shrink-0">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                              {selectedMode === 'repo' ? 'New Category' : 'New Activity'}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="p-8 overflow-y-auto flex-1 max-h-[calc(95vh-120px)] pr-6">
                            <LogForm 
                              onAdd={handleAddLog} 
                              onSuccess={() => setIsLogModalOpen(false)} 
                              mode={selectedMode}
                              existingRepos={existingRepos}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </section>

                {/* Activity Priority Section, placed directly under Add Activity triggers */}
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">ACTIVITY LEVEL PRIORITY</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ranked HARD to EASY</p>
                    </div>
                  </div>

                  {prioritizedActivities.length === 0 ? (
                    <div className="p-12 bg-[#0F1317] rounded-3xl border border-dashed border-zinc-500 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-500">
                        <Sparkles className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-400 text-sm font-semibold">Priority Activities is Empty</p>
                        <p className="text-zinc-500 text-xs">Set an EASY, MEDIUM, or HARD level when adding an Activity to track them here!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prioritizedActivities.map((act) => {
                        const bgColors = {
                          HIGH: 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/40 text-red-300',
                          MID: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 text-amber-300',
                          LOW: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40 text-blue-300',
                        };
                        const hoverRing = {
                          HIGH: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]',
                          MID: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]',
                          LOW: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]',
                        };
                        const badgeColors = {
                          HIGH: 'bg-red-500/20 border-red-500/50 text-red-400',
                          MID: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
                          LOW: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
                        };

                        const displayLevel = act.priority === 'HIGH' ? 'HARD' : act.priority === 'MID' ? 'MEDIUM' : act.priority === 'LOW' ? 'EASY' : act.priority;
                        const priorityClass = bgColors[act.priority as 'HIGH' | 'MID' | 'LOW'] || '';
                        const hoverClass = hoverRing[act.priority as 'HIGH' | 'MID' | 'LOW'] || '';
                        const badgeClass = badgeColors[act.priority as 'HIGH' | 'MID' | 'LOW'] || '';

                        return (
                          <div 
                            key={act.id} 
                            className={`p-6 rounded-3xl border transition-all duration-300 ${priorityClass} ${hoverClass}`}
                          >
                            <div className="flex justify-between items-start mb-3 gap-2">
                              <span className={`text-[9px] font-black tracking-widest uppercase border px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                                {displayLevel} LEVEL
                              </span>
                              <span className="text-[9px] text-zinc-500 font-bold tracking-tight bg-zinc-950/40 px-2 py-0.5 rounded border border-zinc-500 font-mono">
                                {format(act.timestamp, 'MMM d')}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-zinc-100 line-clamp-1 mb-1">{act.title}</h4>
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{act.content}</p>
                            
                            {act.files && act.files.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-emerald-500">
                                <Paperclip className="w-3.5 h-3.5" />
                                {act.files.length} attachment{act.files.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Recent Category</h3>
                    <button 
                      onClick={() => setActiveTab('logs')}
                      className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      VIEW ALL
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {logs.filter(l => l.category === 'code').slice(0, 4).map((log) => (
                      <div key={log.id} className="p-6 bg-[#0F1317] rounded-3xl border border-zinc-500/50 hover:border-emerald-500/30 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-emerald-500 font-bold text-sm tracking-tight">{log.title}</h4>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{log.content}</p>
                      </div>
                    ))}
                    {logs.filter(l => l.category === 'code').length === 0 && (
                      <div className="col-span-2 p-16 bg-[#0F1317] rounded-3xl border border-dashed border-zinc-500/50 flex flex-col items-center text-center gap-4">
                        <p className="text-zinc-400 text-sm font-medium">No categories made yet. Start by making a new category!</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Recent Activity</h3>
                    <button 
                      onClick={() => setActiveTab('projects')}
                      className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      VIEW ALL
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {logs.filter(l => l.category !== 'code').slice(0, 4).map((log) => (
                      <div key={log.id} className="p-6 bg-[#0F1317] rounded-3xl border border-zinc-500/50 hover:border-emerald-500/30 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-emerald-500 font-bold text-sm tracking-tight">{log.title}</h4>
                          {log.priority && log.priority !== 'NONE' && (
                            <span className="text-[8px] font-black tracking-widest px-1.5 py-0.5 border border-zinc-500 text-zinc-400 bg-zinc-900 rounded uppercase leading-none">
                              {log.priority === 'HIGH' ? 'HARD' : log.priority === 'MID' ? 'MEDIUM' : log.priority === 'LOW' ? 'EASY' : log.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{log.content}</p>
                      </div>
                    ))}
                    {logs.filter(l => l.category !== 'code').length === 0 && (
                      <div className="col-span-2 p-16 bg-[#0F1317] rounded-3xl border border-dashed border-zinc-500/50 flex flex-col items-center text-center gap-4">
                        <p className="text-zinc-400 text-sm font-medium">No activities logged yet. Start by adding an activity!</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-12">
                <ProfileCard 
                  streak={streak} 
                  activityCount={logs.length} 
                  profile={profile} 
                  onEditClick={() => setActiveTab('profile')} 
                  onLogout={handleLogout}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white">Category</h2>
                <span className="text-sm text-zinc-500">{logs.filter(l => l.category === 'code').length} category logs found</span>
              </div>
              <LogList logs={logs.filter(l => l.category === 'code')} onEdit={setEditingLog} onDelete={handleDeleteLog} />
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white">Activity</h2>
                <span className="text-sm text-zinc-500">{logs.filter(l => l.category !== 'code').length} activity logs found</span>
              </div>
              <LogList logs={logs.filter(l => l.category !== 'code')} onEdit={setEditingLog} onDelete={handleDeleteLog} />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div>
                <h2 className="text-2xl font-black text-white mb-6">History</h2>
                
                {/* Visual Category Filter Toolbar */}
                <div className="bg-[#0F1317]/50 border border-zinc-500/20 p-5 rounded-3xl mb-6 shadow-xl animate-in fade-in duration-300 relative z-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-sans">
                        <Filter className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                          Workspace Domain Switcher
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-500">
                        Isolating database logs, streak calculations, and calendar activities to a specific focus area
                      </p>
                    </div>
                    
                    {/* Custom Dropdown Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => setIsHistoryFilterOpen(prev => !prev)}
                        className="inline-flex items-center justify-between w-full lg:w-56 px-4.5 py-3 rounded-2xl text-xs font-bold bg-zinc-950 border border-zinc-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer shadow-md select-none"
                      >
                        <span className="flex items-center gap-2 truncate">
                          {selectedHistoryCategory === null ? (
                            <>
                              <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">All Focus Areas</span>
                            </>
                          ) : (
                            <>
                              <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{selectedHistoryCategory}</span>
                            </>
                          )}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 ml-2 text-zinc-400 transition-transform duration-200 shrink-0 ${isHistoryFilterOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isHistoryFilterOpen && (
                          <>
                            {/* Backdrop overlay to close on clicking elsewhere */}
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              onClick={() => setIsHistoryFilterOpen(false)} 
                            />
                            
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-2 w-full lg:w-64 bg-zinc-950 border border-zinc-500/40 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] p-2 z-50 overflow-hidden flex flex-col space-y-1 align-left text-left"
                            >
                              <div className="px-3 py-1.5 border-b border-zinc-900 mb-1">
                                <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">
                                  Scope Options
                                </span>
                              </div>
                              
                              <button
                                onClick={() => {
                                  setSelectedHistoryCategory(null);
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`flex items-center justify-between w-full px-3 py-2.5 text-left text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                                  selectedHistoryCategory === null
                                    ? 'bg-emerald-500/10 text-emerald-400 font-extrabold'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="truncate">All Focus Areas</span>
                                </span>
                                <span className="text-[10px] bg-zinc-900 text-zinc-500 font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                  {logs.length}
                                </span>
                              </button>

                              {existingRepos.map((cat) => {
                                const isSelected = selectedHistoryCategory === cat;
                                const count = logs.filter(l => l.metadata?.repo === cat || (l.category === 'code' && l.title === cat)).length;
                                return (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      setSelectedHistoryCategory(cat);
                                      setIsHistoryFilterOpen(false);
                                    }}
                                    className={`flex items-center justify-between w-full px-3 py-2.5 text-left text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-500/10 text-emerald-400 font-extrabold'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="truncate">{cat}</span>
                                    </span>
                                    <span className="text-[10px] bg-zinc-900 text-zinc-500 font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0F1317] p-8 rounded-3xl border border-zinc-500/50">
                  <ContributionGraph logs={filteredHistoryLogs} highestStreak={contributionMetrics.highestStreak} />
                </div>
              </div>

              {/* Performance Review Details Section */}
              <div className="space-y-6">
                <div className="px-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Your Performance Review</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Metrics compiling consistency achievements</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Highest Streak */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-yellow-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-yellow-500 border border-zinc-500/50 mb-4 animate-pulse">
                      <Flame className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Highest Streak</span>
                    <span className="text-xl font-black text-yellow-500 font-mono">{contributionMetrics.highestStreak} Days</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Your ultimate consistency peak</span>
                  </div>

                  {/* Total Log */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500/50 mb-4">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Total Logs</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">{contributionMetrics.totalLogs} Logs</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Across all categories</span>
                  </div>

                  {/* Logged Days This Month */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500/50 mb-4">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Logged (This Month)</span>
                    <span className="text-xl font-black text-white font-mono">{contributionMetrics.loggedDaysThisMonth} Days</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Current calendar month active</span>
                  </div>

                  {/* Consistency Percentage */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500/50 mb-4">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Consistency Rate</span>
                    <span className="text-xl font-black text-white font-mono">{contributionMetrics.consistencyPercentage}%</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Frequency ratio this year</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'following' && (
            <motion.div
              key="following"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Following Developers</h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1">Connect, search, and monitor real-time developer metrics</p>
                </div>
              </div>
              <FollowingSection />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Your Developer Card</h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1">Configure Display Settings, Tech Stack and personal Bio attributes</p>
                </div>
                <Button
                  onClick={handleLogout}
                  className="bg-transparent hover:bg-red-500/10 border border-red-500/40 text-red-400 hover:text-red-300 font-bold rounded-2xl px-6 py-6 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  Sign Out
                </Button>
              </div>
              <ProfileEdit profile={profile} onUpdateProfile={setProfile} onLogout={handleLogout} activityCount={logs.length} />
            </motion.div>
          )}
        </AnimatePresence>

         {/* Editing Dialog Modal */}
         <AnimatePresence>
           {editingLog && (
             <Dialog open={!!editingLog} onOpenChange={(open) => { if (!open) setEditingLog(null); }}>
               <DialogContent className={`bg-zinc-950 border-zinc-500 rounded-3xl p-0 overflow-hidden transition-all duration-300 ${
                 editingLog.category === 'code' ? 'sm:max-w-[650px]' : 'sm:max-w-[650px] w-full max-h-[95vh] flex flex-col'
               }`}>
                 <DialogHeader className="p-8 pb-0 flex-shrink-0">
                   <DialogTitle className="text-2xl font-bold tracking-tight text-white flex justify-between items-center pr-4">
                     <span>Edit Specifications</span>
                     <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest font-mono bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-full">EDITING MODE</span>
                   </DialogTitle>
                 </DialogHeader>
                 <div className="p-8 pb-6 overflow-y-auto flex-1 max-h-[calc(95vh-120px)] pr-6">
                   <LogForm 
                     onAdd={(updatedFields) => {
                       handleUpdateLog(editingLog.id, updatedFields);
                     }} 
                     onSuccess={() => setEditingLog(null)} 
                     mode={editingLog.category === 'code' ? 'repo' : 'activity'}
                     existingRepos={existingRepos}
                     initialData={editingLog}
                     
                   />
                 </div>
               </DialogContent>
             </Dialog>
           )}
         </AnimatePresence>
      </main>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <DialogContent showCloseButton={false} className="bg-zinc-950 border border-zinc-500 rounded-[2rem] p-8 max-w-md w-full text-center">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-white text-center">
              Are you sure you want to sign out?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400 font-medium mb-8 leading-relaxed">
            You will need to sign back in with your credentials to view your dashboard and log entries.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsLogoutConfirmOpen(false)}
              type="button"
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 h-12 rounded-2xl font-bold transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={executeLogout}
              type="button"
              className="flex-1 bg-red-500 hover:bg-red-400 text-black h-12 rounded-2xl font-bold transition-all shadow-[0_10px_25px_-10px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              Yes, Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
