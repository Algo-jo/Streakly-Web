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
import { AnalysisCard } from './components/AnalysisCard';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, FolderOpen, Briefcase, Paperclip, Flame, Calendar, 
  Filter, Folder, Layers, ChevronDown, Loader2, ArrowLeft,
  Share2, Check, UserCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { supabase } from './lib/supabase';
import { Profile, Category, WorkLog, ProductivityAnalysis } from './lib/types';
import { 
  getLocalDateString, 
  getYesterdayDateString, 
  checkAndResetStreaks, 
  generateLocalAnalysis 
} from './lib/utils';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Public Mode (Monkeytype-Style Public Share)
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [publicProfile, setPublicProfile] = useState<Profile | null>(null);

  // DB Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [rawActivities, setRawActivities] = useState<any[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'repo' | 'activity'>('repo');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  
  // Filtering
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<string | null>(null);
  const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Unified Fetching
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (catData) {
        setCategories(catData);
      }

      // Fetch Activities
      const { data: actData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (actData) {
        setRawActivities(actData);
      }

      // Check and update streaks locally (hybrid timezone-safe check)
      if (profile && catData) {
        const streakResets = checkAndResetStreaks(profile, catData);
        if (streakResets) {
          if (streakResets.profileUpdates) {
            await supabase
              .from('profiles')
              .update(streakResets.profileUpdates)
              .eq('id', userId);
            
            setProfile(prev => prev ? { ...prev, ...streakResets.profileUpdates } : null);
          }

          if (streakResets.categoryUpdates.length > 0) {
            for (const catUp of streakResets.categoryUpdates) {
              await supabase
                .from('categories')
                .update({ streak: 0 })
                .eq('id', catUp.id);
            }
            
            setCategories(prev => prev.map(c => {
              const matched = streakResets.categoryUpdates.find(up => up.id === c.id);
              return matched ? { ...c, streak: 0 } : c;
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user categories & activities:', err);
    }
  };

  // 2. Startup router detection & auth listener
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get('u');
    let active = true;

    const initPublicMode = async (username: string) => {
      try {
        const { data: pubProf } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (pubProf && active) {
          setPublicProfile(pubProf);
          setIsPublicMode(true);
          setIsAuthenticated(true);
          setActiveTab('dashboard');

          // Load public user's data
          const { data: catData } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', pubProf.id)
            .order('name', { ascending: true });
          
          const { data: actData } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', pubProf.id)
            .order('timestamp', { ascending: false });

          if (active) {
            if (catData) setCategories(catData);
            if (actData) setRawActivities(actData);
            setLoading(false);
          }
          return true;
        }
      } catch (err) {
        console.error('Error loading public profile:', err);
      }
      return false;
    };

    const setupAuthListener = () => {
      return supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!active) return;
          if (event === 'INITIAL_SESSION') return; // Handled by runInit

          try {
            if (session?.user) {
              setSessionUser(session.user);
              
              // Only load private user profile if NOT in public mode
              if (!isPublicMode) {
                const { data: userProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();

                if (userProfile && userProfile.name && active) {
                  setProfile(userProfile);
                  setIsAuthenticated(true);
                  await fetchUserData(session.user.id);
                } else if (active) {
                  setIsAuthenticated(false);
                }
              }
            } else if (active) {
              setSessionUser(null);
              // Only clear auth states if NOT in public mode
              if (!isPublicMode) {
                setProfile(null);
                setIsAuthenticated(false);
              }
            }
          } catch (err) {
            console.error('Error in auth listener transition:', err);
          }
        }
      );
    };

    const runInit = async () => {
      try {
        let publicSuccess = false;
        if (u) {
          publicSuccess = await initPublicMode(u);
        }

        if (!active) return null;

        // Fetch session to set sessionUser so logged-in users see the header banner
        const { data: { session } } = await supabase.auth.getSession();
        
        if (active) {
          if (session?.user) {
            setSessionUser(session.user);
            
            // Only load logged-in user profile if NOT in public mode
            if (!publicSuccess) {
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (userProfile && userProfile.name && active) {
                setProfile(userProfile);
                setIsAuthenticated(true);
                await fetchUserData(session.user.id);
              } else if (active) {
                setIsAuthenticated(false);
              }
            }
          } else {
            // Only force unauthenticated if NOT in public mode
            if (!publicSuccess && active) {
              setIsAuthenticated(false);
            }
          }

          // If a public query was attempted but failed, strip the invalid ?u= parameter
          if (u && !publicSuccess && active) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        console.error('Error during initial session fetch:', err);
        if (active && !isPublicMode) setIsAuthenticated(false);
      } finally {
        if (active) setLoading(false); // GUARANTEED to clear loading screen
      }

      // Setup auth listener for future transitions
      const { data: { subscription } } = setupAuthListener();
      return subscription;
    };

    const subscriptionPromise = runInit();

    return () => {
      active = false;
      subscriptionPromise.then(sub => {
        if (sub) sub.unsubscribe();
      });
    };
  }, []);

  // 3. Backwards-compatible map: dynamic virtual logs list
  const activities: WorkLog[] = useMemo(() => {
    return rawActivities.map(act => {
      const cat = categories.find(c => c.id === act.category_id);
      const catName = cat ? cat.name : 'Unknown Category';
      
      return {
        id: act.id,
        user_id: act.user_id,
        category_id: act.category_id,
        category_name: catName,
        description: act.description || '',
        activity_level: act.activity_level,
        files: act.files || [],
        timestamp: Number(act.timestamp),
        date_str: act.date_str,
        created_at: act.created_at,
        
        // Legacy fields mapping for UI components
        title: catName,
        content: act.description || `Mencatat aktivitas di Kategori: ${catName}`,
        category: 'note',
        priority: act.activity_level,
        metadata: {
          repo: catName,
          description: act.description || ''
        }
      };
    });
  }, [rawActivities, categories]);

  // Combine Activities and virtual Category Creation Logs for Contribution Graph
  const logs: WorkLog[] = useMemo(() => {
    const virtualCatLogs: WorkLog[] = categories.map(cat => ({
      id: cat.id,
      user_id: cat.user_id,
      category_id: cat.id,
      category_name: cat.name,
      description: `Kategori baru dibuat: ${cat.name}`,
      activity_level: 'LOW',
      files: [],
      timestamp: new Date(cat.created_at).getTime(),
      date_str: getLocalDateString(new Date(cat.created_at)),
      created_at: cat.created_at,
      title: cat.name,
      content: `Kategori ${cat.name} berhasil dibuat untuk pencatatan.`,
      category: 'code', // code maps to Category log in Graph
      priority: 'LOW',
      metadata: {
        repo: cat.name
      }
    }));

    return [...activities, ...virtualCatLogs].sort((a, b) => b.timestamp - a.timestamp);
  }, [activities, categories]);

  // Client-side static insights engine
  const insights: ProductivityAnalysis = useMemo(() => {
    const activeProfile = isPublicMode ? publicProfile : profile;
    return generateLocalAnalysis(activeProfile, categories, activities);
  }, [profile, publicProfile, categories, activities, isPublicMode]);

  // 4. CRUD operations
  const handleAuthSuccess = async (profileData: any) => {
    setProfile(profileData);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    if (sessionUser) {
      await fetchUserData(sessionUser.id);
    }
  };

  const executeLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await supabase.auth.signOut();
    // Redirect cleanly
    window.location.href = window.location.origin;
  };

  const handleAddLog = async (data: { 
    category_id?: string;
    category_name?: string; 
    description?: string; 
    activity_level?: 'LOW' | 'MID' | 'HIGH';
    files?: { name: string; size: string; previewUrl: string }[];
  }) => {
    if (!profile) {
      alert("Gagal mencatat: Sesi akun Anda belum termuat sempurna. Silakan segarkan halaman.");
      return;
    }
    
    const todayStr = getLocalDateString();
    const now = Date.now();

    // A. Add Category Mode
    if (data.category_name) {
      try {
        const { error } = await supabase
          .from('categories')
          .insert({
            user_id: profile.id,
            name: data.category_name,
            streak: 0,
            highest_streak: 0,
            last_submit_date: null
          });

        if (error) {
          console.error("Supabase Category Insert Error:", error);
          alert(`Gagal membuat kategori: ${error.message} (Kode: ${error.code})`);
          return;
        }

        await fetchUserData(profile.id);
      } catch (err: any) {
        console.error("Exception on Category creation:", err);
        alert(`Terjadi kesalahan koneksi saat membuat kategori: ${err.message}`);
      }
    } 
    // B. Add Activity Mode
    else if (data.category_id) {
      try {
        // 1. Insert Activity
        const { error: actError } = await supabase
          .from('activities')
          .insert({
            user_id: profile.id,
            category_id: data.category_id,
            description: data.description || '',
            activity_level: data.activity_level || 'LOW',
            files: data.files || [],
            timestamp: now,
            date_str: todayStr
          });

        if (actError) {
          console.error("Supabase Activity Insert Error:", actError);
          alert(`Gagal mencatat aktivitas: ${actError.message} (Kode: ${actError.code})`);
          return;
        }

        // 2. Update Category Streak
        const cat = categories.find(c => c.id === data.category_id);
        if (cat) {
          const catLoggedToday = rawActivities.some(
            act => act.category_id === data.category_id && act.date_str === todayStr
          );

          if (!catLoggedToday) {
            const yesterdayStr = getYesterdayDateString();
            let newCatStreak = 1;
            
            if (cat.last_submit_date === yesterdayStr) {
              newCatStreak = cat.streak + 1;
            } else if (cat.last_submit_date === todayStr) {
              newCatStreak = cat.streak;
            }

            const newCatHighest = Math.max(newCatStreak, cat.highest_streak);

            const { error: catUpError } = await supabase
              .from('categories')
              .update({
                streak: newCatStreak,
                highest_streak: newCatHighest,
                last_submit_date: todayStr
              })
              .eq('id', data.category_id);

            if (catUpError) {
              console.error("Error updating category streak:", catUpError);
            }
          }
        }

        // 3. Update Global Account Streak
        const globalLoggedToday = rawActivities.some(act => act.date_str === todayStr);
        if (!globalLoggedToday) {
          const yesterdayStr = getYesterdayDateString();
          let newGlobalStreak = 1;

          if (profile.last_submit_date === yesterdayStr) {
            newGlobalStreak = profile.streak + 1;
          } else if (profile.last_submit_date === todayStr) {
            newGlobalStreak = profile.streak;
          }

          const newGlobalHighest = Math.max(newGlobalStreak, profile.highest_streak);

          const { data: updatedProfile, error: profileErr } = await supabase
            .from('profiles')
            .update({
              streak: newGlobalStreak,
              highest_streak: newGlobalHighest,
              last_submit_date: todayStr
            })
            .eq('id', profile.id)
            .select()
            .single();

          if (profileErr) {
            console.error("Error updating global streak:", profileErr);
          } else if (updatedProfile) {
            setProfile(updatedProfile);
          }
        }

        // Refresh Data
        await fetchUserData(profile.id);
        setIsLogModalOpen(false);
      } catch (err: any) {
        console.error("Exception on Activity recording:", err);
        alert(`Terjadi kesalahan koneksi saat mencatat aktivitas: ${err.message}`);
      }
    }
  };

  const handleUpdateLog = async (
    id: string, 
    updatedFields: { 
      description?: string; 
      activity_level?: 'LOW' | 'MID' | 'HIGH';
      files?: { name: string; size: string; previewUrl: string }[];
    }
  ) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          description: updatedFields.description || '',
          activity_level: updatedFields.activity_level || 'LOW',
          files: updatedFields.files || []
        })
        .eq('id', id);

      if (error) {
        alert(`Gagal memperbarui aktivitas: ${error.message}`);
        return;
      }

      await fetchUserData(profile.id);
      setEditingLog(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Gagal menghapus aktivitas: ${error.message}`);
        return;
      }

      await fetchUserData(profile.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyShareLink = () => {
    const activeProfile = isPublicMode ? publicProfile : profile;
    if (!activeProfile) return;

    const link = `${window.location.origin}/?u=${activeProfile.username}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  // 5. Computed states
  const activeProfileObj = isPublicMode ? publicProfile : profile;
  const streak = activeProfileObj?.streak || 0;
  const todayDateStr = getLocalDateString();
  const hasLoggedToday = rawActivities.some(l => l.date_str === todayDateStr);

  const existingRepos = useMemo(() => {
    return categories.map(c => c.name);
  }, [categories]);

  const contributionMetrics = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    
    const logsToAnalyze = selectedHistoryCategory 
      ? logs.filter(l => l.category_id === selectedHistoryCategory || l.category_name === selectedHistoryCategory)
      : logs;
    
    const totalLogs = logsToAnalyze.filter(l => l.category !== 'code').length;
    
    // Logged days this month
    const thisMonthLogs = logsToAnalyze.filter(log => {
      try {
        const d = parseISO(log.date_str);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      } catch (e) {
        const d = new Date(log.timestamp);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      }
    });
    const loggedDaysThisMonth = new Set(thisMonthLogs.map(l => l.date_str)).size;
    
    // Consistency score: log counts / days since joined date
    let consistencyPercentage = '0.0';
    if (activeProfileObj) {
      const joinDate = new Date(activeProfileObj.created_at);
      joinDate.setHours(0,0,0,0);
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      
      const diffTime = Math.abs(todayDate.getTime() - joinDate.getTime());
      const daysSinceJoined = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      
      const uniqueActiveDays = new Set(logsToAnalyze.map(l => l.date_str)).size;
      const rate = Math.min(100, (uniqueActiveDays / daysSinceJoined) * 100);
      consistencyPercentage = rate.toFixed(1);
    }

    const highestStreakVal = activeProfileObj?.highest_streak?.toString() || '0';

    return {
      totalLogs,
      loggedDaysThisMonth,
      consistencyPercentage,
      highestStreak: highestStreakVal
    };
  }, [logs, activeProfileObj, selectedHistoryCategory]);

  const filteredHistoryLogs = useMemo(() => {
    if (!selectedHistoryCategory) return logs;
    return logs.filter(l => l.category_id === selectedHistoryCategory || l.category_name === selectedHistoryCategory);
  }, [logs, selectedHistoryCategory]);

  const priorityWeights = { HIGH: 3, MID: 2, LOW: 1, NONE: 0 };

  const prioritizedActivities = useMemo(() => {
    return activities
      .filter(l => l.priority && l.priority !== 'NONE')
      .sort((a, b) => {
        const weightA = priorityWeights[a.priority] || 0;
        const weightB = priorityWeights[b.priority] || 0;
        if (weightB !== weightA) {
          return weightB - weightA;
        }
        return b.timestamp - a.timestamp;
      });
  }, [activities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4">Memuat Streakly...</p>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicMode) {
    return (
      <Auth 
        onLoginSuccess={handleAuthSuccess} 
        initialSessionUser={sessionUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={isPublicMode ? undefined : () => setIsLogoutConfirmOpen(true)}
      />

      {/* Public Page Share Banner indicator */}
      {isPublicMode && (
        <div className="w-full bg-emerald-500/10 border-b border-emerald-500/20 py-2.5 px-6 flex justify-between items-center text-xs">
          <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Anda sedang melihat Profil Publik milik @{publicProfile?.username} (Read-Only)
          </span>
          <div className="flex items-center gap-2">
            {sessionUser && (
              <Button 
                onClick={() => {
                  // Exit public mode by returning to dashboard
                  window.location.href = window.location.origin;
                }}
                className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white h-7 text-[10px] rounded-lg px-3 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" /> Kembali ke Akun saya
              </Button>
            )}
            <Button 
              onClick={handleCopyShareLink}
              className="bg-emerald-500 hover:bg-emerald-400 text-black h-7 text-[10px] font-extrabold rounded-lg px-3 flex items-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              Bagikan Profil
            </Button>
          </div>
        </div>
      )}

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
                  <div className="bg-[#0F1317] p-8 rounded-[2.5rem] border border-zinc-500/50">
                    <ContributionGraph logs={logs} highestStreak={activeProfileObj?.highest_streak?.toString()} />
                  </div>

                  {/* High-Level Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in duration-300">
                    {/* Highest Streak */}
                    <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-yellow-500/25 p-5 rounded-[2rem] transition-all duration-300 flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-yellow-500 border border-zinc-500 mb-3 animate-pulse">
                          <Flame className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-0.5">Streak Tertinggi</span>
                        <span className="text-lg font-black text-yellow-500 font-mono">{contributionMetrics.highestStreak} Hari</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 block font-semibold mt-2">Konsistensi puncak Anda</span>
                    </div>

                    {/* Total Log */}
                    <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-5 rounded-[2rem] transition-all duration-300 flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500 mb-3">
                          <Briefcase className="w-4.5 h-4.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-0.5">Total Aktivitas</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">{contributionMetrics.totalLogs} Catatan</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 block font-semibold mt-2">Di seluruh kategori</span>
                    </div>

                    {/* Logged Days This Month */}
                    <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-5 rounded-[2rem] transition-all duration-300 flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500 mb-3">
                          <Calendar className="w-4.5 h-4.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-0.5">Aktif (Bulan Ini)</span>
                        <span className="text-lg font-black text-white font-mono">{contributionMetrics.loggedDaysThisMonth} Hari</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 block font-semibold mt-2">Jumlah hari aktif bulan ini</span>
                    </div>

                    {/* Consistency Percentage */}
                    <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-5 rounded-[2rem] transition-all duration-300 flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500 mb-3">
                          <Layers className="w-4.5 h-4.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-0.5">Rasio Konsistensi</span>
                        <span className="text-lg font-black text-white font-mono">{contributionMetrics.consistencyPercentage}%</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 block font-semibold mt-2">Rasio frekuensi konsistensi</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 bg-[#0F1317] rounded-[2.5rem] border border-zinc-500/50">
                    <div className="space-y-1.5">
                      <h3 className="text-2xl font-bold text-white tracking-tight">Streak Global: {streak} Hari</h3>
                      {!hasLoggedToday ? (
                        <p className="text-sm font-bold text-yellow-500 flex items-center gap-2 animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                          </span>
                          Anda belum mencatat aktivitas apa pun hari ini
                        </p>
                      ) : (
                        <p className="text-sm text-emerald-400 font-semibold flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          Anda sudah mencatat aktivitas hari ini!
                        </p>
                      )}
                    </div>
                    
                    {!isPublicMode && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <Button
                          onClick={() => {
                            setSelectedMode('repo');
                            setIsLogModalOpen(true);
                          }}
                          className="bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 font-bold px-6 py-7 rounded-2xl transition-all text-base whitespace-nowrap cursor-pointer flex items-center gap-2"
                        >
                          <FolderOpen className="w-5 h-5" />
                          Tambah Kategori
                        </Button>

                        <Button
                          onClick={() => {
                            setSelectedMode('activity');
                            setIsLogModalOpen(true);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-7 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] text-base whitespace-nowrap cursor-pointer flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Catat Aktivitas
                        </Button>

                        <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                          <DialogContent className="bg-zinc-950 border-zinc-500 rounded-3xl p-0 overflow-hidden transition-all duration-300 sm:max-w-[650px] w-full max-h-[95vh] flex flex-col">
                            <DialogHeader className="p-8 pb-0 flex-shrink-0">
                              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                                {selectedMode === 'repo' ? 'Kategori Baru' : 'Catat Aktivitas'}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="p-8 overflow-y-auto flex-1 max-h-[calc(95vh-120px)] pr-6">
                              <LogForm 
                                onAdd={handleAddLog} 
                                onSuccess={() => setIsLogModalOpen(false)} 
                                mode={selectedMode}
                                categories={categories}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </section>

                {/* Prioritized activities display (Easy, Mid, Hard) */}
                {!isPublicMode && (
                  <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between px-2">
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">BEBAN AKTIVITAS TERKINI</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Diurutkan berdasarkan beban kerja tertinggi</p>
                      </div>
                    </div>

                    {prioritizedActivities.length === 0 ? (
                      <div className="p-12 bg-[#0F1317] rounded-[2.5rem] border border-dashed border-zinc-500/40 flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-500">
                          <Briefcase className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-400 text-sm font-semibold">Belum Ada Aktivitas Beban</p>
                          <p className="text-zinc-500 text-xs">Pilih tingkat beban kerja (EASY, MEDIUM, HARD) saat mencatat aktivitas untuk memantaunya di sini!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prioritizedActivities.slice(0, 4).map((act) => {
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

                          const displayLevel = act.priority === 'HIGH' ? 'HARD' : act.priority === 'MID' ? 'MEDIUM' : 'EASY';
                          const priorityClass = bgColors[act.priority as 'HIGH' | 'MID' | 'LOW'] || '';
                          const hoverClass = hoverRing[act.priority as 'HIGH' | 'MID' | 'LOW'] || '';
                          const badgeClass = badgeColors[act.priority as 'HIGH' | 'MID' | 'LOW'] || '';

                          return (
                            <div 
                              key={act.id} 
                              className={`p-6 rounded-[2rem] border transition-all duration-300 ${priorityClass} ${hoverClass}`}
                            >
                              <div className="flex justify-between items-start mb-3 gap-2">
                                <span className={`text-[9px] font-black tracking-widest uppercase border px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                                  {displayLevel} BEBAN
                                </span>
                                <span className="text-[9px] text-zinc-500 font-bold tracking-tight bg-zinc-950/40 px-2 py-0.5 rounded border border-zinc-500 font-mono">
                                  {format(act.timestamp, 'MMM d')}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-zinc-100 line-clamp-1 mb-1">{act.title}</h4>
                              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{act.description}</p>
                              
                              {act.files && act.files.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-emerald-500">
                                  <Paperclip className="w-3.5 h-3.5" />
                                  {act.files.length} lampiran
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* Categories List Display */}
                {!isPublicMode && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Daftar Kategori</h3>
                      <button 
                        onClick={() => setActiveTab('logs')}
                        className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        LIHAT SEMUA ({categories.length})
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {categories.slice(0, 4).map((cat) => (
                        <div key={cat.id} className="p-6 bg-[#0F1317] rounded-[2rem] border border-zinc-500/50 hover:border-emerald-500/30 transition-all group">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-white font-bold text-base tracking-tight group-hover:text-emerald-400 transition-colors">{cat.name}</h4>
                            <span className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold font-mono bg-yellow-500/5 px-2.5 py-1 rounded-full border border-yellow-500/10">
                              <Flame className="w-3.5 h-3.5 fill-yellow-500" /> {cat.streak}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                            Highest Streak: {cat.highest_streak} Hari
                          </p>
                          <p className="text-[10px] text-zinc-400 font-medium mt-2 leading-relaxed">
                            {cat.last_submit_date ? `Terakhir diisi: ${cat.last_submit_date}` : 'Belum pernah diisi'}
                          </p>
                        </div>
                      ))}
                      {categories.length === 0 && (
                        <div className="col-span-2 p-16 bg-[#0F1317] rounded-[2.5rem] border border-dashed border-zinc-500/50 flex flex-col items-center text-center gap-4 w-full">
                          <p className="text-zinc-400 text-sm font-medium">Belum ada Kategori yang dibuat. Mulai buat kategori baru!</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column (ProfileCard + Productivity Insights) */}
              <div className="lg:col-span-4 space-y-12">
                <ProfileCard 
                  streak={streak} 
                  activityCount={activities.length} 
                  profile={activeProfileObj || undefined} 
                  onEditClick={isPublicMode ? undefined : () => setActiveTab('profile')} 
                />

                {!isPublicMode && (
                  <AnalysisCard 
                    analysis={insights} 
                    loading={false}
                  />
                )}
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
                <h2 className="text-2xl font-black text-white">Kategori Aktivitas</h2>
                <span className="text-sm text-zinc-500">{categories.length} kategori ditemukan</span>
              </div>

              {/* Categories Grid list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-6 bg-[#0F1317] border border-zinc-500/50 rounded-[2rem] hover:border-emerald-500/30 transition-all group flex flex-col justify-between min-h-[100px]">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-white text-lg group-hover:text-emerald-400 transition-colors leading-tight">{cat.name}</h3>
                        <span className="flex items-center gap-1 text-[11px] text-yellow-500 font-bold font-mono bg-yellow-500/5 px-3 py-1.5 rounded-full border border-yellow-500/10">
                          <Flame className="w-4 h-4 fill-yellow-500" /> {cat.streak}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-500/10 pt-4 mt-4 font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>Highest: {cat.highest_streak} Hari</span>
                      <span>{cat.last_submit_date ? `Terakhir: ${cat.last_submit_date}` : 'Belum aktif'}</span>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="col-span-2 p-16 bg-[#0F1317] border border-dashed border-zinc-500 rounded-3xl text-center text-zinc-500">
                    Belum ada kategori yang ditambahkan.
                  </div>
                )}
              </div>
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
                <h2 className="text-2xl font-black text-white">Catatan Aktivitas</h2>
                <span className="text-sm text-zinc-500">{activities.length} aktivitas terdaftar</span>
              </div>
              <LogList 
                logs={activities} 
                onEdit={isPublicMode ? undefined : setEditingLog} 
                onDelete={isPublicMode ? undefined : handleDeleteLog} 
              />
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
                <h2 className="text-2xl font-black text-white mb-6">Riwayat Aktivitas</h2>
                
                {/* Visual Category Filter Toolbar */}
                <div className="bg-[#0F1317]/50 border border-zinc-500/20 p-5 rounded-3xl mb-6 shadow-xl relative z-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-sans">
                        <Filter className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                          DOMAIN FILTER SWITCHER
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-500">
                        Isolasi grafik konsistensi, streak, dan riwayat aktivitas berdasarkan Kategori tertentu.
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
                              <span className="truncate">Semua Aktivitas</span>
                            </>
                          ) : (
                            <>
                              <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">
                                {categories.find(c => c.id === selectedHistoryCategory)?.name || 'Kategori'}
                              </span>
                            </>
                          )}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 ml-2 text-zinc-400 transition-transform duration-200 shrink-0 ${isHistoryFilterOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isHistoryFilterOpen && (
                          <>
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
                                  Pilih Kategori
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
                                  <span className="truncate">Semua Aktivitas</span>
                                </span>
                                <span className="text-[10px] bg-zinc-900 text-zinc-500 font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                  {logs.length}
                                </span>
                              </button>

                              {categories.map((cat) => {
                                const isSelected = selectedHistoryCategory === cat.id;
                                const count = logs.filter(l => l.category_id === cat.id).length;
                                return (
                                  <button
                                    key={cat.id}
                                    onClick={() => {
                                      setSelectedHistoryCategory(cat.id);
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
                                      <span className="truncate">{cat.name}</span>
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

                <div className="bg-[#0F1317] p-8 rounded-[2.5rem] border border-zinc-500/50">
                  <ContributionGraph logs={filteredHistoryLogs} highestStreak={contributionMetrics.highestStreak} />
                </div>
              </div>

              {/* Performance Review details section */}
              <div className="space-y-6">
                <div className="px-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">ANALISIS PERFORMA ANDA</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Statistik konsistensi dari catatan harian Anda</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Highest Streak */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-yellow-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-yellow-500 border border-zinc-500 mb-4 animate-pulse">
                      <Flame className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Streak Tertinggi</span>
                    <span className="text-xl font-black text-yellow-500 font-mono">{contributionMetrics.highestStreak} Hari</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Konsistensi puncak Anda</span>
                  </div>

                  {/* Total Log */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500 mb-4">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Total Aktivitas</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">{contributionMetrics.totalLogs} Catatan</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Di seluruh kategori</span>
                  </div>

                  {/* Logged Days This Month */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500 mb-4">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Aktif (Bulan Ini)</span>
                    <span className="text-xl font-black text-white font-mono">{contributionMetrics.loggedDaysThisMonth} Hari</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Jumlah hari aktif bulan ini</span>
                  </div>

                  {/* Consistency Percentage */}
                  <div className="bg-[#0F1317] border border-zinc-500/30 hover:border-emerald-500/25 p-6 rounded-3xl transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-500 mb-4">
                      <Layers className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">Rasio Konsistensi</span>
                    <span className="text-xl font-black text-white font-mono">{contributionMetrics.consistencyPercentage}%</span>
                    <span className="text-[10px] text-zinc-400 block font-semibold mt-1">Frekuensi sejak joined date</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'following' && !isPublicMode && (
            <motion.div
              key="following"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <FollowingSection 
                currentProfile={profile} 
                onUpdateProfile={setProfile}
                onSelectPublicProfile={(uname) => {
                  // Redirect to public link of user
                  window.location.search = `?u=${uname}`;
                }}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && !isPublicMode && profile && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Profil Anda</h2>
                  <p className="text-sm text-zinc-500 font-semibold mt-1">Atur data biografi, display name, serta dapatkan link profil publik Anda.</p>
                </div>
                <Button
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="bg-transparent hover:bg-red-500/10 border border-red-500/40 text-red-400 hover:text-red-300 font-bold rounded-2xl px-6 py-6 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  Sign Out
                </Button>
              </div>
              <ProfileEdit 
                profile={profile} 
                onUpdateProfile={setProfile} 
                activityCount={activities.length} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editing Dialog Modal */}
        <AnimatePresence>
          {editingLog && (
            <Dialog open={!!editingLog} onOpenChange={(open) => { if (!open) setEditingLog(null); }}>
              <DialogContent className="bg-zinc-950 border-zinc-500 rounded-3xl p-0 overflow-hidden transition-all duration-300 sm:max-w-[650px] w-full max-h-[95vh] flex flex-col">
                <DialogHeader className="p-8 pb-0 flex-shrink-0">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-white flex justify-between items-center pr-4 animate-in">
                    <span>Ubah Spesifikasi Aktivitas</span>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest font-mono bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-full">EDITING MODE</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="p-8 pb-6 overflow-y-auto flex-1 max-h-[calc(95vh-120px)] pr-6">
                  <LogForm 
                    onAdd={(updatedFields) => {
                      handleUpdateLog(editingLog.id, updatedFields);
                    }} 
                    onSuccess={() => setEditingLog(null)} 
                    mode="activity"
                    categories={categories}
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
        <DialogContent showCloseButton={false} className="bg-zinc-950 border border-zinc-500 rounded-[2rem] p-8 max-w-md w-full text-center font-sans">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-white text-center">
              Apakah Anda yakin ingin keluar?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400 font-semibold mb-8 leading-relaxed">
            Anda perlu masuk kembali dengan kredensial Anda untuk mengakses dashboard dan mencatat aktivitas harian Anda.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsLogoutConfirmOpen(false)}
              type="button"
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 h-12 rounded-2xl font-bold transition-all cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={executeLogout}
              type="button"
              className="flex-1 bg-red-500 hover:bg-red-400 text-black h-12 rounded-2xl font-bold transition-all shadow-[0_10px_25px_-10px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              Ya, Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
