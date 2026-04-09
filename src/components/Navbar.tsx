import React from 'react';
import { LayoutDashboard, FolderOpen, Briefcase, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Repository', icon: FolderOpen },
    { id: 'projects', label: 'Project', icon: Briefcase },
    { id: 'calendar', label: 'Contribution', icon: BarChart3 },
  ];

  return (
    <nav className="w-full bg-background/80 border-b border-zinc-800/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12 h-full">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <span className="text-black font-black text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-heading">Streakly</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 h-full">
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
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer">
            <LayoutDashboard className="w-5 h-5" />
          </div>
        </div>
      </div>
    </nav>
  );
}
