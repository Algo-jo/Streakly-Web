import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Github, Upload, Link as LinkIcon, X, User } from 'lucide-react';

interface ProfileData {
  name: string;
  role: string;
  bio: string;
  github: string;
  techStack: string;
  highestStreak: string;
  avatarUrl: string;
  followersCount?: string;
  followingCount?: string;
}

interface ProfileEditProps {
  profile: ProfileData;
  onUpdateProfile: (updated: ProfileData) => void;
  onLogout?: () => void;
  activityCount?: number;
}

export function ProfileEdit({ profile, onUpdateProfile, onLogout, activityCount = 0 }: ProfileEditProps) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [bio, setBio] = useState(profile.bio);
  const [github, setGithub] = useState(profile.github);
  const [techStack, setTechStack] = useState(profile.techStack);
  const [highestStreak, setHighestStreak] = useState(profile.highestStreak || '56');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [followersCount, setFollowersCount] = useState(profile.followersCount || '1280');
  const [followingCount, setFollowingCount] = useState(profile.followingCount || '340');
  const [savedMessage, setSavedMessage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      role,
      bio,
      github,
      techStack,
      highestStreak,
      avatarUrl,
      followersCount,
      followingCount,
    });
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      dragActive && setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 min-h-[600px] animate-in fade-in duration-300">
      {/* Left Column: Profile Card Live Preview */}
      <div className="lg:col-span-4 space-y-6">
        
        <div className="flex flex-col items-center text-center p-8 bg-[#0F1317] rounded-[2.5rem] border border-zinc-500/50 backdrop-blur-md relative overflow-hidden group">

          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur-2xl opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-40 h-40 bg-zinc-950 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.15)] border-4 border-zinc-500 overflow-hidden text-white">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar Preview" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                  <User className="w-20 h-20 stroke-[1.25]" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-8 w-full">
            <h2 className="text-2xl font-black text-white tracking-tight line-clamp-1">{name || 'Your Name'}</h2>
            <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider line-clamp-1">{role || 'Full-Stack Developer'}</p>
            <p className="text-xs text-zinc-400 font-medium line-clamp-2 px-2 leading-relaxed">{bio || 'Your bio will appear here.'}</p>
          </div>

          {/* Profile metadata info divider with Activities Logged, Followers, and Following */}
          <div className="grid grid-cols-3 gap-2 w-full pt-6 border-t border-zinc-500/20 text-white">
            <div className="flex flex-col items-center gap-0.5 min-w-0 pr-1 border-r border-zinc-500/20">
              <span className="text-lg font-black tracking-tight font-mono text-emerald-400 truncate w-full">{activityCount}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.05em] text-center">Logs</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-1 border-r border-zinc-500/20">
              <span className="text-lg font-black tracking-tight font-mono text-white truncate w-full">{followersCount || '1,280'}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.05em] text-center">Followers</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 pl-1">
              <span className="text-lg font-black tracking-tight font-mono text-white truncate w-full">{followingCount || '340'}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.05em] text-center">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Information form fields */}
      <div className="lg:col-span-8 bg-[#0F1317] border border-zinc-500/50 rounded-[2.5rem] p-8 md:p-10 space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">Profile Specification</h2>
          <p className="text-xs text-zinc-400 font-medium">Customize your Streakly identity to stand out in the following network.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Algo-Jo"
                className="bg-zinc-950 border-zinc-500 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Current Role / Title</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Software Craftsman"
                className="bg-zinc-950 border-zinc-500 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Personal Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Keep building, keep growing, one code log at a time..."
              className="bg-zinc-950 border-zinc-500 min-h-[100px] p-5 focus:ring-emerald-500/50 rounded-2xl resize-none text-zinc-300 leading-relaxed text-sm"
              required
            />
          </div>

          {/* Add Profile Picture Drag & Drop area */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Profile Picture</label>
            
            {/* Image upload area */}
            <div 
              className={`w-full border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-zinc-500 bg-zinc-950 hover:border-zinc-400'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-emerald-400 border border-zinc-500">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-center">
                <label className="cursor-pointer text-xs text-white font-extrabold hover:text-emerald-400 transition-colors">
                  Click to upload photo
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </label>
                <p className="text-[10px] text-zinc-500 mt-0.5">or drag & drop here</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pt-6 border-t border-zinc-500/40">
            {savedMessage ? (
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-sm animate-bounce">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-semibold">Changes are instantly persistent.</span>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl px-10 h-13 transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] select-none w-full sm:w-auto cursor-pointer"
              >
                Commit Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
