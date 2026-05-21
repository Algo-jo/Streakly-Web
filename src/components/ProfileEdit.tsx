import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Github, Sparkles, Upload, Link as LinkIcon, X } from 'lucide-react';

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
}

export function ProfileEdit({ profile, onUpdateProfile }: ProfileEditProps) {
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
      setDragActive(true);
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

  const currentInitials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 min-h-[600px] animate-in fade-in duration-300">
      {/* Left Column: Profile Card Live Preview */}
      <div className="lg:col-span-4 space-y-6">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] px-2">Live Preview</h3>
        
        <div className="flex flex-col items-center text-center p-8 bg-[#0F1317] rounded-[2.5rem] border border-zinc-500/80 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[9px] font-black tracking-widest uppercase">
            <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Live
          </div>

          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur-2xl opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-40 h-40 bg-zinc-950 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.15)] border-4 border-zinc-900 overflow-hidden text-white">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar Preview" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-zinc-900 text-emerald-400 text-3xl font-black">
                  {currentInitials}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-8 w-full">
            <h2 className="text-2xl font-black text-white tracking-tight line-clamp-1">{name || 'Your Name'}</h2>
            <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider line-clamp-1">{role || 'Full-Stack Developer'}</p>
            <p className="text-xs text-zinc-400 font-medium line-clamp-2 px-2 leading-relaxed">{bio || 'Your bio will appear here.'}</p>
          </div>

          {/* Metadata previews */}
          <div className="w-full space-y-3 pt-6 border-t border-zinc-500/50 text-white">
            {github && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono justify-center hover:text-white transition-colors">
                <Github className="w-3.5 h-3.5 text-zinc-400" />
                github.com/{github}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-500/0 w-full text-center">
              <div>
                <span className="block text-white font-black text-sm">{followersCount || '1,280'}</span>
                <span className="text-[8px] font-black tracking-tighter text-zinc-500 uppercase">Followers</span>
              </div>
              <div>
                <span className="block text-white font-black text-sm">{highestStreak || '56'}</span>
                <span className="text-[8px] font-black tracking-tighter text-zinc-500 uppercase select-none">Highest Streak</span>
              </div>
              <div>
                <span className="block text-white font-black text-sm">{followingCount || '340'}</span>
                <span className="text-[8px] font-black tracking-tighter text-zinc-500 uppercase">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Information form fields */}
      <div className="lg:col-span-8 bg-[#0F1317] border border-zinc-500/80 rounded-[2.5rem] p-8 md:p-10 space-y-8">
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
                className="bg-zinc-950 border-zinc-500/40 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Current Role / Title</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Software Craftsman"
                className="bg-zinc-950 border-zinc-500/40 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
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
              className="bg-zinc-950 border-zinc-500/40 min-h-[100px] p-5 focus:ring-emerald-500/50 rounded-2xl resize-none text-zinc-300 leading-relaxed text-sm"
              required
            />
          </div>

          {/* Add Profile Picture Drag & Drop area or URL input */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Profile Picture</label>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Image upload area */}
              <div 
                className={`md:col-span-7 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-zinc-500/50 bg-zinc-950 hover:border-zinc-700'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-emerald-400 border border-zinc-500/50">
                  <Upload className="w-5 h-5" />
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
                  <p className="text-[10px] text-zinc-500 mt-1">or drag & drop your image here</p>
                </div>
              </div>

              {/* URL Input area */}
              <div className="md:col-span-5 bg-zinc-950/40 border border-zinc-500/40 rounded-2xl p-5 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 matchesText">
                    <LinkIcon className="w-3 h-3 text-zinc-500" /> Specify Photo Link URL
                  </span>
                  <p className="text-[9px] text-zinc-500">Or paste an Unsplash / GitHub avatar web address directly.</p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="bg-zinc-950 border-zinc-500/50 h-9 text-xs focus:ring-emerald-500/50 rounded-xl px-3 text-white flex-1"
                  />
                  {avatarUrl && (
                    <Button 
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="bg-zinc-900 border border-zinc-500/50 hover:bg-zinc-800 h-9 w-9 p-0 rounded-xl"
                    >
                      <X className="w-3.5 h-3.5 text-zinc-400" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">GitHub Username</label>
              <div className="relative">
                <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="github-username"
                  className="bg-zinc-950 border-zinc-500/50 pl-11 h-12 rounded-2xl text-sm font-mono text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Tech Stack Tags</label>
              <Input
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, TypeScript, Rust"
                className="bg-zinc-950 border-zinc-500/50 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Highest Streak</label>
              <Input
                value={highestStreak}
                onChange={(e) => setHighestStreak(e.target.value)}
                placeholder="56"
                className="bg-zinc-950 border-zinc-500/50 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Followers Count</label>
              <Input
                value={followersCount}
                onChange={(e) => setFollowersCount(e.target.value)}
                placeholder="1,280"
                className="bg-zinc-950 border-zinc-500/50 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Following Count</label>
              <Input
                value={followingCount}
                onChange={(e) => setFollowingCount(e.target.value)}
                placeholder="340"
                className="bg-zinc-950 border-zinc-500/50 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-zinc-500/80">
            {savedMessage ? (
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-sm animate-bounce">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-semibold">Changes are instantly persistent.</span>
            )}
            <Button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl px-10 h-13 transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)]"
            >
              Commit Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
