import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LogForm } from './components/LogForm';
import { LogList } from './components/LogList';
import { ContributionGraph } from './components/ContributionGraph';
import { ProfileCard } from './components/ProfileCard';
import { Footer } from './components/Footer';
import { WorkLog, analyzeProductivity, ProductivityAnalysis } from './lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Plus, FolderOpen, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [analysis, setAnalysis] = useState<ProductivityAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'form'>('select');
  const [selectedMode, setSelectedMode] = useState<'repo' | 'project'>('repo');
  const [user, setUser] = useState<any>(null); // Mock user for now

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

  const handleAddLog = (newLog: { title: string; content: string; category: string; metadata?: any }) => {
    const log: WorkLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.uid || 'guest',
      title: newLog.title,
      content: newLog.content,
      category: newLog.category as any,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      metadata: newLog.metadata,
    };
    setLogs([log, ...logs]);
    setIsLogModalOpen(false);
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
                  <ContributionGraph logs={logs} />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 bg-zinc-900/20 rounded-3xl border border-zinc-800/50">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-white tracking-tight">You are on {streak} Days Streak</h3>
                      <p className="text-sm text-zinc-400 font-medium">Consistency is the key to mastery. Keep it up!</p>
                    </div>
                    <Dialog open={isLogModalOpen} onOpenChange={(open) => {
                      setIsLogModalOpen(open);
                      if (open) setModalStep('select');
                    }}>
                      <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-10 py-7 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] text-base" />}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add Project
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-[550px] rounded-3xl p-0 overflow-hidden">
                        <DialogHeader className="p-8 pb-0">
                          <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                            {modalStep === 'select' ? 'What are we logging?' : selectedMode === 'repo' ? 'New Repository' : 'New Project'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="p-8">
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
                                  setSelectedMode('project');
                                  setModalStep('form');
                                }}
                                className="group flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-zinc-900 bg-zinc-900/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
                              >
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                                  <Briefcase className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                  <span className="block text-lg font-bold text-white mb-1">New Project</span>
                                  <span className="text-xs text-zinc-500">Log a task, note, or paper</span>
                                </div>
                              </button>
                            </div>
                          ) : (
                            <LogForm 
                              onAdd={handleAddLog} 
                              onSuccess={() => setIsLogModalOpen(false)} 
                              mode={selectedMode}
                              existingRepos={existingRepos}
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Recent Project</h3>
                    <button className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">VIEW ALL</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {logs.filter(l => l.category !== 'code').slice(0, 4).map((log) => (
                      <div key={log.id} className="p-6 bg-[#0F1317] rounded-3xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-emerald-500 font-bold text-sm tracking-tight">{log.title}</h4>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{log.content}</p>
                      </div>
                    ))}
                    {logs.filter(l => l.category !== 'code').length === 0 && (
                      <div className="col-span-2 p-16 bg-[#0F1317] rounded-3xl border border-dashed border-zinc-800/50 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                          <Plus className="w-6 h-6 text-zinc-500" />
                        </div>
                        <p className="text-zinc-400 text-sm font-medium">No projects logged yet. Start by adding a note or paper log!</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-12">
                <ProfileCard streak={streak} projectCount={logs.length} />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">AI Insights</h3>
                    <Brain className="w-4 h-4 text-emerald-500" />
                  </div>
                  <LogList logs={logs.slice(0, 3)} />
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
                <span className="text-sm text-zinc-500">{logs.length} logs found</span>
              </div>
              <LogList logs={logs} />
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
              <div className="bg-zinc-900/20 p-8 rounded-3xl border border-zinc-800/50">
                <ContributionGraph logs={logs} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
