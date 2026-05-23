import React, { useState } from 'react';
import { LayoutDashboard, FolderOpen, Briefcase, BarChart3, Users, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export function Navbar({ activeTab, setActiveTab, onLogout }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Category', icon: FolderOpen },
    { id: 'projects', label: 'Activity', icon: Briefcase },
    { id: 'calendar', label: 'History', icon: BarChart3 },
    { id: 'following', label: 'Following', icon: Users },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="w-full bg-background/80 border-b border-zinc-500/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between relative">
        {/* Logo and App name */}
        <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => handleTabClick('dashboard')}>
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <span className="text-black font-black text-lg">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">Streakly</span>
        </div>
        
        {/* Desktop Tabs */}
        <div className="hidden md:flex items-center gap-10 h-full absolute left-1/2 -translate-x-1/2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative h-full flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer ${
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

        {/* Right buttons: Profile & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTabClick('profile')}
            className={`w-10 h-10 rounded-full bg-zinc-900 border border-zinc-500/60 flex items-center justify-center text-zinc-500 hover:text-white hover:border-emerald-500/50 transition-all duration-300 cursor-pointer ${
              activeTab === 'profile' ? 'text-emerald-500 border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : ''
            }`}
          >
            <User className="w-5 h-5" />
          </button>

          {/* Hamburger Mobile Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-500/40 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-400 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-zinc-900 bg-background/95 backdrop-blur-xl overflow-hidden px-6 py-4 space-y-2"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
