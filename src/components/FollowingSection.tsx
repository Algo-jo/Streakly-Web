import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Users, Flame, Code, Terminal, Coffee, Laptop, Sparkles, UserCheck, Plus, Brain 
} from 'lucide-react';

interface Developer {
  id: string;
  name: string;
  role: string;
  avatarIcon: string;
  streak: number;
  followers: string;
  tags: string[];
  github: string;
}

const DEFAULT_DEVS: Developer[] = [
  {
    id: 'dan_abramov',
    name: 'Dan Abramov',
    role: 'React Creator & Engineer',
    avatarIcon: 'code',
    streak: 118,
    followers: '28.4k',
    tags: ['React', 'JavaScript', 'TypeScript'],
    github: 'gaearon',
  },
  {
    id: 'sarah_drasner',
    name: 'Sarah Drasner',
    role: 'VP Ecosystem at Netlify',
    avatarIcon: 'laptop',
    streak: 42,
    followers: '19.5k',
    tags: ['SVG', 'Vue', 'CSS'],
    github: 'sdras',
  },
  {
    id: 'linus_torvalds',
    name: 'Linus Torvalds',
    role: 'Linux Kernel Developer & Git creator',
    avatarIcon: 'terminal',
    streak: 365,
    followers: '98.2k',
    tags: ['C', 'Git', 'Linux'],
    github: 'torvalds',
  },
  {
    id: 'rich_harris',
    name: 'Rich Harris',
    role: 'Svelte Creator & Compiler Engineer',
    avatarIcon: 'brain',
    streak: 92,
    followers: '22.1k',
    tags: ['Svelte', 'Vite', 'JS'],
    github: 'Rich-Harris',
  },
  {
    id: 'wes_bos',
    name: 'Wes Bos',
    role: 'Web Instructor & Syntax Podcaster',
    avatarIcon: 'coffee',
    streak: 210,
    followers: '45.7k',
    tags: ['JavaScript', 'Node.js', 'CSS'],
    github: 'wesbos',
  },
  {
    id: 'guillermo_rauch',
    name: 'Guillermo Rauch',
    role: 'Vercel Founder & CEO',
    avatarIcon: 'sparkles',
    streak: 154,
    followers: '64.3k',
    tags: ['Next.js', 'Vercel', 'React'],
    github: 'rauchg',
  },
];

const AVATAR_ICONS: Record<string, any> = {
  laptop: Laptop,
  code: Code,
  brain: Brain,
  terminal: Terminal,
  coffee: Coffee,
  sparkles: Sparkles,
};

export function FollowingSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'followed' | 'discover'>('followed');
  
  const [followedIds, setFollowedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('streakly_followed_ids');
    return saved ? JSON.parse(saved) : ['linus_torvalds', 'sarah_drasner'];
  });

  useEffect(() => {
    localStorage.setItem('streakly_followed_ids', JSON.stringify(followedIds));
  }, [followedIds]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    DEFAULT_DEVS.forEach(dev => dev.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, []);

  const handleFollowToggle = (id: string) => {
    setFollowedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(fId => fId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Filter developers based on search query and sub-tab
  const displayedDevs = useMemo(() => {
    return DEFAULT_DEVS.filter(dev => {
      const matchesSearch = dev.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            dev.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = selectedTag ? dev.tags.includes(selectedTag) : true;
      
      const isCurrentlyFollowed = followedIds.includes(dev.id);
      const matchesTab = subTab === 'followed' ? isCurrentlyFollowed : !isCurrentlyFollowed;

      return matchesSearch && matchesTag && matchesTab;
    });
  }, [searchTerm, selectedTag, subTab, followedIds]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Control Board */}
      <div className="bg-[#0F1317] border border-zinc-800/40 rounded-[2rem] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/20 pb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" /> Peer Connections
            </h3>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              Find, follow and observe developer metrics from across the global community.
            </p>
          </div>

          {/* Quick numbers indicator */}
          <div className="flex gap-4 items-center bg-zinc-950/60 p-3 rounded-2xl border border-zinc-950 self-start md:self-auto shrink-0">
            <span className="text-xs text-zinc-400 font-bold tracking-tight">Active Peer Syncs:</span>
            <span className="text-sm text-emerald-400 font-black font-mono">{followedIds.length} connected</span>
          </div>
        </div>

        {/* Segmented Feed Switcher */}
        <div className="flex bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-900/80 w-full sm:w-fit gap-1">
          <button
            onClick={() => setSubTab('followed')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              subTab === 'followed'
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_4px_20px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-900/30 font-semibold'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Following Feed ({followedIds.length})
          </button>
          <button
            onClick={() => setSubTab('discover')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              subTab === 'discover'
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_4px_20px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-900/30 font-semibold'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Discover New Peers
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-pulse" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={subTab === 'followed' ? "Search within your followed peers..." : "Search new developers by name or title..."}
            className="bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 pl-12 h-14 rounded-2xl text-sm font-semibold text-white focus:ring-emerald-500"
          />
        </div>

        {/* Filter Badges Row */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-zinc-500 tracking-widest block uppercase">FILTER BY SPECIALTY</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                selectedTag === null
                  ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              ALL SPECIALTIES
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all uppercase ${
                  selectedTag === tag
                    ? 'bg-emerald-500 text-black font-extrabold'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simplified, Clean Peer Grid (Nama, Jabatan, Follower, Streak) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>
            {subTab === 'followed' ? 'YOUR IMMERSIVE FEED' : 'DISCOVER PUBLIC PROFILES'} ({displayedDevs.length})
          </span>
          <span>Stamina & Sync Button</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedDevs.map((dev) => {
            const ScreenIcon = AVATAR_ICONS[dev.avatarIcon] || Laptop;
            const isFollowed = followedIds.includes(dev.id);

            return (
              <div 
                key={dev.id} 
                className="flex items-center justify-between p-5 bg-[#0F1317] border border-zinc-800/40 rounded-3xl group hover:border-emerald-500/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.02)]"
              >
                {/* Developer details metadata */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-emerald-500 border border-zinc-900 group-hover:border-emerald-500/20 transition-all shrink-0">
                    <ScreenIcon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition-colors font-sans truncate leading-tight">
                      {dev.name}
                    </h4>
                    <p className="text-xs text-zinc-400 font-semibold line-clamp-1 leading-normal mt-0.5">
                      {dev.role}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wider bg-zinc-950/70 border border-zinc-900/60 px-2 py-0.5 rounded">
                        {dev.followers} Followers
                      </span>
                      {dev.tags.slice(0, 1).map((tg) => (
                        <span key={tg} className="text-[9px] font-extrabold text-zinc-600 bg-zinc-950/30 px-1.5 py-0.5 border border-zinc-900/35 rounded uppercase">
                          #{tg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right columns metrics */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="flex items-center gap-1 text-sm text-yellow-500 font-black bg-yellow-500/5 px-3 py-1.5 rounded-2xl border border-yellow-500/10 font-mono">
                    <Flame className="w-4 h-4 fill-yellow-500" /> {dev.streak}
                  </span>

                  <button
                    onClick={() => handleFollowToggle(dev.id)}
                    className={`h-11 px-4 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider uppercase transition-all border ${
                      isFollowed
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-805'
                    }`}
                  >
                    {isFollowed ? (
                      <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Followed</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Follow</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {displayedDevs.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-16 p-10 bg-[#0F1317] border border-dashed border-zinc-800/40 rounded-3xl text-zinc-500 flex flex-col items-center justify-center gap-4">
              <p className="text-sm font-semibold text-zinc-400 leading-relaxed">
                {subTab === 'followed' 
                  ? "Your following feed is currently empty. You aren't following anyone yet!" 
                  : "No public profiles matched your specialty filters. Try adjusting your query!"}
              </p>
              {subTab === 'followed' && (
                <button
                  type="button"
                  onClick={() => setSubTab('discover')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
                >
                  Discover Public Developers
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
