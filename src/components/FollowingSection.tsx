import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Users, Flame, UserCheck, Plus, User as UserIcon, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/types';

interface FollowingSectionProps {
  currentProfile: Profile | null;
  onUpdateProfile: (updated: Profile) => void;
  onSelectPublicProfile: (username: string) => void;
}

export function FollowingSection({ currentProfile, onUpdateProfile, onSelectPublicProfile }: FollowingSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState<'followed' | 'discover'>('followed');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch all profiles from Supabase
  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching profiles:', error);
          return;
        }

        if (data) {
          setProfiles(data);
        }
      } catch (err) {
        console.error('Error in profiles fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [currentProfile?.followed_ids]); // Reload if followed_ids changes

  // Handle follow / unfollow toggle
  const handleFollowToggle = async (targetId: string, isCurrentlyFollowing: boolean) => {
    if (!currentProfile) return;
    setTogglingId(targetId);

    try {
      let updatedFollowedIds = [...(currentProfile.followed_ids || [])];
      
      if (isCurrentlyFollowing) {
        updatedFollowedIds = updatedFollowedIds.filter(id => id !== targetId);
      } else {
        updatedFollowedIds.push(targetId);
      }

      // 1. Update current user's followed_ids in DB
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          followed_ids: updatedFollowedIds,
          following_count: updatedFollowedIds.length
        })
        .eq('id', currentProfile.id);

      if (profileError) {
        alert(`Gagal mengikuti/berhenti mengikuti: ${profileError.message}`);
        setTogglingId(null);
        return;
      }

      // 2. Update target user's followers_count in DB
      const targetProfile = profiles.find(p => p.id === targetId);
      if (targetProfile) {
        const newFollowersCount = Math.max(
          0,
          (targetProfile.followers_count || 0) + (isCurrentlyFollowing ? -1 : 1)
        );

        await supabase
          .from('profiles')
          .update({
            followers_count: newFollowersCount
          })
          .eq('id', targetId);
      }

      // 3. Update local state
      onUpdateProfile({
        ...currentProfile,
        followed_ids: updatedFollowedIds,
        following_count: updatedFollowedIds.length
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  // Filter profiles based on search and subTab
  const displayedDevs = useMemo(() => {
    if (!currentProfile) return [];

    return profiles.filter(p => {
      // Exclude self
      if (p.id === currentProfile.id) return false;

      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isCurrentlyFollowed = currentProfile.followed_ids?.includes(p.id) || false;
      const matchesTab = subTab === 'followed' ? isCurrentlyFollowed : !isCurrentlyFollowed;

      return matchesSearch && matchesTab;
    });
  }, [searchTerm, subTab, profiles, currentProfile]);

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Control Board */}
      <div className="bg-[#0F1317] border border-zinc-500/40 rounded-[2rem] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-500/20 pb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" /> Peer Connections
            </h3>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              Cari dan ikuti pengguna lain untuk memantau konsistensi aktivitas harian mereka secara real-time.
            </p>
          </div>
        </div>

        {/* Segmented Switcher */}
        <div className="flex bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-900/80 w-full sm:w-fit gap-1">
          <button
            onClick={() => setSubTab('followed')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'followed'
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_4px_20px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-900/30 font-semibold'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Diikuti ({currentProfile.followed_ids?.length || 0})
          </button>
          <button
            onClick={() => setSubTab('discover')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'discover'
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_4px_20px_rgba(16,185,129,0.25)]'
                : 'text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-900/30 font-semibold'
            }`}
          >
            <Users className="w-4 h-4" /> Temukan Orang Baru
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={subTab === 'followed' ? "Cari dari daftar orang yang Anda ikuti..." : "Cari berdasarkan nama, username, atau minat..."}
            className="bg-zinc-950 border-zinc-500 focus:border-emerald-500/50 pl-12 h-14 rounded-2xl text-sm font-semibold text-white focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Peer Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>
            {subTab === 'followed' ? 'DAFTAR MENGIKUTI' : 'TEMUKAN PENGGUNA PUBLIK'} ({displayedDevs.length})
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedDevs.map((dev) => {
              const isFollowed = currentProfile.followed_ids?.includes(dev.id) || false;
              const isToggling = togglingId === dev.id;

              return (
                <div 
                  key={dev.id} 
                  className="flex items-center justify-between p-5 bg-[#0F1317] border border-zinc-500/40 rounded-3xl group hover:border-emerald-500/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.02)] cursor-pointer"
                  onClick={() => onSelectPublicProfile(dev.username)}
                  title="Lihat profil publik"
                >
                  {/* User details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-900 group-hover:border-emerald-500/20 transition-all shrink-0 overflow-hidden">
                      {dev.avatar_url ? (
                        <img src={dev.avatar_url} alt={dev.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition-colors font-sans truncate leading-tight">
                        {dev.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold font-mono tracking-wide mt-0.5">
                        @{dev.username}
                      </p>
                      <p className="text-xs text-zinc-400 font-semibold line-clamp-1 leading-normal mt-1">
                        {dev.role}
                      </p>
                    </div>
                  </div>

                  {/* Right Column Metrics */}
                  <div className="flex items-center gap-3 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                    <span className="flex items-center gap-1 text-sm text-yellow-500 font-black bg-yellow-500/5 px-3 py-1.5 rounded-2xl border border-yellow-500/10 font-mono" title="Global Streak">
                      <Flame className="w-4 h-4 fill-yellow-500" /> {dev.streak}
                    </span>

                    <button
                      onClick={() => handleFollowToggle(dev.id, isFollowed)}
                      disabled={isToggling}
                      className={`h-11 px-4 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider uppercase transition-all border cursor-pointer ${
                        isFollowed
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                      ) : isFollowed ? (
                        <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Diikuti</span>
                      ) : (
                        <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Ikuti</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {displayedDevs.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-16 p-10 bg-[#0F1317] border border-dashed border-zinc-500/40 rounded-3xl text-zinc-500 flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-semibold text-zinc-400 leading-relaxed">
                  {subTab === 'followed' 
                    ? "Daftar mengikuti Anda saat ini kosong. Anda belum mengikuti siapa pun!" 
                    : "Tidak ada profil publik yang cocok dengan pencarian Anda."}
                </p>
                {subTab === 'followed' && (
                  <button
                    type="button"
                    onClick={() => setSubTab('discover')}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    Temukan Pengguna Lain
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
