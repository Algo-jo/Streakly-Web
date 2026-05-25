import React from 'react';
import { Flame, Edit2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileCardProps {
  streak: number;
  activityCount: number;
  profile?: {
    name: string;
    role: string;
    bio: string;
    avatarUrl?: string;
    followersCount?: string;
    followingCount?: string;
    highestStreak?: string;
  };
  onEditClick?: () => void;
  onLogout?: () => void;
}

export function ProfileCard({ streak, activityCount, profile, onEditClick, onLogout }: ProfileCardProps) {
  const name = profile?.name || 'Algo-Jo';
  const role = profile?.role || 'Full-Stack Developer';
  const bio = profile?.bio || 'Keep building, keep growing.';
  const avatarUrl = profile?.avatarUrl || '';
  
  const currentInitials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col items-center text-center p-10 bg-[#0F1317] rounded-[2.5rem] border border-zinc-500/50 backdrop-blur-md">
      <div className="relative mb-8 group">
        <div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative w-48 h-48 bg-zinc-950 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.15)] border-4 border-zinc-500 overflow-hidden text-white">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
              <User className="w-24 h-24 stroke-[1.25]" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-10">
        <h2 className="text-2xl font-bold text-white tracking-tight font-heading">Welcome, {name}!</h2>
        <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest">{role}</p>
        <p className="text-sm text-zinc-400 font-medium px-4">{bio}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full mb-10">
        <Button 
          onClick={onEditClick}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl h-14 transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] text-base select-none w-full"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full pt-8 border-t border-zinc-500/50 text-white animate-in fade-in">
        <div className="flex flex-col items-center gap-1 min-w-0 pr-1 border-r border-zinc-500/20">
          <span className="text-xl sm:text-2xl font-black tracking-tight font-mono text-emerald-400 truncate w-full">{activityCount}</span>
          <span className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-[0.05em] text-center">Logs</span>
        </div>
        <div className="flex flex-col items-center gap-1 min-w-0 px-1 border-r border-zinc-500/20">
          <span className="text-xl sm:text-2xl font-black tracking-tight font-mono text-white truncate w-full">{profile?.followersCount || '1,280'}</span>
          <span className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-[0.05em] text-center">Followers</span>
        </div>
        <div className="flex flex-col items-center gap-1 min-w-0 pl-1">
          <span className="text-xl sm:text-2xl font-black tracking-tight font-mono text-white truncate w-full">{profile?.followingCount || '340'}</span>
          <span className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-[0.05em] text-center">Following</span>
        </div>
      </div>
    </div>
  );
}
