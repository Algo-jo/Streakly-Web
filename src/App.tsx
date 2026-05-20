import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LogForm } from './components/LogForm';
import { LogList } from './components/LogList';
import { ContributionGraph } from './components/ContributionGraph';
import { ProfileCard } from './components/ProfileCard';
import { Footer } from './components/Footer';
import { ProfileEdit } from './components/ProfileEdit';
import { FollowingSection } from './components/FollowingSection';
import { WorkLog, analyzeProductivity, ProductivityAnalysis } from './lib/gemini';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Plus, FolderOpen, Briefcase, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [analysis, setAnalysis] = useState<ProductivityAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'form'>('select');
  const [selectedMode, setSelectedMode] = useState<'repo' | 'activity'>('repo');
  const [user, setUser] = useState<any>(null); // Mock user for now
  const [addFormStep, setAddFormStep] = useState(1);
  const [editingLogStep, setEditingLogStep] = useState(1);

  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('streakly_profile');
    const defaultProfile = {
      name: 'Algo-Jo',
      role: 'Full-Stack Developer',
      bio: 'Keep building, keep growing, one code log at a time.',
      github: 'algo-jo',
      techStack: 'React, Node.js, TypeScript, Tailwind',
      highestStreak: '92',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
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

  const existingRepos = Array.from(new Set(logs.filter(l => l.metadata?.repo).map(l => l.metadata!.repo!)));
  const streak = analysis?.streakInfo?.currentStreak || 0;

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
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
                  <ContributionGraph logs={logs} highestStreak={profile.highestStreak} />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 bg-[#0F1317] rounded-3xl border border-zinc-800/50">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-white tracking-tight">You are on {streak} Days Streak</h3>
                      <p className="text-sm text-zinc-400 font-medium">Consistency is the key to mastery. Keep it up!</p>
                    </div>
                    <Dialog open={isLogModalOpen} onOpenChange={(open) => {
                      setIsLogModalOpen(open);
                      if (open) {
                        setModalStep('select');
                        setAddFormStep(1);
                      }
                    }}>
                      <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-10 py-7 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] text-base" />}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add Activity
                      </DialogTrigger>
                      <DialogContent className={`bg-zinc-950 border-zinc-800 rounded-3xl p-0 overflow-hidden transition-all duration-300 ${
                        modalStep === 'select' ? 'sm:max-w-[650px]' : addFormStep === 1 ? 'sm:max-w-[650px]' : 'sm:max-w-[98vw] xl:max-w-[94vw] h-[95vh] md:h-[92vh] flex flex-col'
                      }`}>
                        <DialogHeader className="p-8 pb-0 flex-shrink-0">
                          <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                            {modalStep === 'select' ? 'What are we logging?' : selectedMode === 'repo' ? 'New Repository' : 'New Activity'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className={`p-8 ${modalStep !== 'select' && addFormStep === 2 ? 'overflow-y-auto flex-1 max-h-[calc(95vh-120px)] md:max-h-[calc(92vh-120px)] pr-6' : ''}`}>
                          {modalStep === 'select' ? (
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                onClick={() => {
                                  setSelectedMode('repo');
                                  setModalStep('form');
                                }}
                                className="group flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-zinc-900 bg-zinc-900/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
                              >
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                                  <FolderOpen className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                  <span className="block text-lg font-bold text-white mb-1">New Repository</span>
                                  <span className="text-xs text-zinc-500">Log a new codebase or repo</span>
                                </div>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedMode('activity');
                                  setModalStep('form');
                                }}
                                className="group flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-zinc-900 bg-zinc-900/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
                              >
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                                  <Briefcase className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                  <span className="block text-lg font-bold text-white mb-1">New Activity</span>
                                  <span className="text-xs text-zinc-500">Log a task, note, or priorities</span>
                                </div>
                              </button>
                            </div>
                          ) : (
                            <LogForm 
                              onAdd={handleAddLog} 
                              onSuccess={() => setIsLogModalOpen(false)} 
                              mode={selectedMode}
                              existingRepos={existingRepos}
                              onStepChange={setAddFormStep}
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </section>

                {/* Activity Priority Section, placed directly under Add Activity triggers */}
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Activity Priority</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ranked HIGH to LOW</p>
                    </div>
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[9px] font-black tracking-widest border border-red-500/20 rounded-full">
                      FOCUS PANEL
                    </span>
                  </div>

                  {prioritizedActivities.length === 0 ? (
                    <div className="p-12 bg-[#0F1317] rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800">
                        <Sparkles className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-400 text-sm font-semibold">Priority Activities is Empty</p>
                        <p className="text-zinc-500 text-xs">Set a LOW, MID, or HIGH priority when adding an Activity to track them here!</p>
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
                                {act.priority} PRIORITY
                              </span>
                              <span className="text-[9px] text-zinc-500 font-bold tracking-tight bg-zinc-950/40 px-2 py-0.5 rounded border border-zinc-800 font-mono">
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
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Recent Repository</h3>
                    <button className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">VIEW ALL</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {logs.filter(l => l.category === 'code').slice(0, 4).map((log) => (
                      <div key={log.id} className="p-6 bg-[#0F1317] rounded-3xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-emerald-500 font-bold text-sm tracking-tight">{log.title}</h4>
                          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors rotate-45" />
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{log.content}</p>
                      </div>
                    ))}
                    {logs.filter(l => l.category === 'code').length === 0 && (
                      <div className="col-span-2 p-16 bg-[#0F1317] rounded-3xl border border-dashed border-zinc-800/50 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                          <Plus className="w-6 h-6 text-zinc-500" />
                        </div>
                        <p className="text-zinc-400 text-sm font-medium">No repositories logged yet. Start by adding a code log!</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Recent Activity</h3>
                    <button className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">VIEW ALL</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {logs.filter(l => l.category !== 'code').slice(0, 4).map((log) => (
                      <div key={log.id} className="p-6 bg-[#0F1317] rounded-3xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-emerald-500 font-bold text-sm tracking-tight">{log.title}</h4>
                          {log.priority && log.priority !== 'NONE' && (
                            <span className="text-[8px] font-black tracking-widest px-1.5 py-0.5 border border-zinc-800 text-zinc-400 bg-zinc-900 rounded uppercase leading-none">
                              {log.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{log.content}</p>
                      </div>
                    ))}
                    {logs.filter(l => l.category !== 'code').length === 0 && (
                      <div className="col-span-2 p-16 bg-[#0F1317] rounded-3xl border border-dashed border-zinc-800/50 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                          <Plus className="w-6 h-6 text-zinc-500" />
                        </div>
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
                />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">AI Insights</h3>
                    <Brain className="w-4 h-4 text-emerald-500" />
                  </div>
                  <LogList logs={logs.slice(0, 3)} onEdit={setEditingLog} />
                  <Button 
                    onClick={handleAnalyze}
                    disabled={loadingAnalysis || logs.length === 0}
                    className="w-full bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 text-zinc-300 text-xs font-bold py-7 rounded-2xl transition-all tracking-widest"
                  >
                    {loadingAnalysis ? 'ANALYZING...' : 'REFRESH ANALYSIS'}
                  </Button>
                </div>
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
                <h2 className="text-2xl font-black text-white">Repository</h2>
                <span className="text-sm text-zinc-500">{logs.filter(l => l.category === 'code').length} repository logs found</span>
              </div>
              <LogList logs={logs.filter(l => l.category === 'code')} onEdit={setEditingLog} />
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
              <LogList logs={logs.filter(l => l.category !== 'code')} onEdit={setEditingLog} />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-2xl font-black text-white mb-8">Contribution History</h2>
              <div className="bg-[#0F1317] p-8 rounded-3xl border border-zinc-800/50">
                <ContributionGraph logs={logs} highestStreak={profile.highestStreak} />
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
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Your Developer Card</h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1">Configure Display Settings, Tech Stack and personal Bio attributes</p>
                </div>
              </div>
              <ProfileEdit profile={profile} onUpdateProfile={setProfile} />
            </motion.div>
          )}
        </AnimatePresence>

         {/* Editing Dialog Modal */}
         <AnimatePresence>
           {editingLog && (
             <Dialog open={!!editingLog} onOpenChange={(open) => { if (!open) setEditingLog(null); }}>
               <DialogContent className={`bg-zinc-950 border-zinc-800 rounded-3xl p-0 overflow-hidden transition-all duration-300 ${
                 editingLogStep === 1 ? 'sm:max-w-[650px]' : 'sm:max-w-[98vw] xl:max-w-[94vw] h-[95vh] md:h-[92vh] flex flex-col'
               }`}>
                 <DialogHeader className="p-8 pb-0 flex-shrink-0">
                   <DialogTitle className="text-2xl font-bold tracking-tight text-white flex justify-between items-center pr-4">
                     <span>Edit Specifications</span>
                     <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest font-mono bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-full">EDITING MODE</span>
                   </DialogTitle>
                 </DialogHeader>
                 <div className={`p-8 pb-6 ${editingLogStep === 2 ? 'overflow-y-auto flex-1 max-h-[calc(95vh-120px)] md:max-h-[calc(92vh-120px)] pr-6' : ''}`}>
                   <LogForm 
                     onAdd={(updatedFields) => {
                       handleUpdateLog(editingLog.id, updatedFields);
                     }} 
                     onSuccess={() => setEditingLog(null)} 
                     mode={editingLog.category === 'code' ? 'repo' : 'activity'}
                     existingRepos={existingRepos}
                     initialData={editingLog}
                     onStepChange={setEditingLogStep}
                   />
                 </div>
               </DialogContent>
             </Dialog>
           )}
         </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
