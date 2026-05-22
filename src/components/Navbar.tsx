import React from 'react';
import { LayoutDashboard, FolderOpen, Briefcase, BarChart3, Users, User } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export function Navbar({ activeTab, setActiveTab, onLogout }: NavbarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Repository', icon: FolderOpen },
    { id: 'projects', label: 'Activity', icon: Briefcase },
    { id: 'calendar', label: 'Contribution', icon: BarChart3 },
    { id: 'following', label: 'Following', icon: Users },
  ];

  return (
    <nav className="w-full bg-background/80 border-b border-zinc-500/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <span className="text-black font-black text-lg">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">Streakly</span>
        </div>
        
        <div className="hidden md:flex items-center gap-10 h-full absolute left-1/2 -translate-x-1/2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative h-full flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-emerald-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-10 h-10 rounded-full bg-zinc-900 border border-zinc-500/60 flex items-center justify-center text-zinc-500 hover:text-white hover:border-emerald-500/50 transition-all duration-300 cursor-pointer ${
              activeTab === 'profile' ? 'text-emerald-500 border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : ''
            }`}
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
