import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, Lock, Github, Sparkles, Upload, Link as LinkIcon, X, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onLoginSuccess: (profile: {
    name: string;
    role: string;
    bio: string;
    avatarUrl: string;
    github?: string;
    techStack: string[];
    highestStreak: number;
    followersCount: number;
    followingCount: number;
  }) => void;
}

export function Auth({ onLoginSuccess }: AuthProps) {
  const [screen, setScreen] = useState<'login' | 'register' | 'onboarding'>('login');
  
  // Login input states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register input states
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Onboarding metadata states (Starts with EMPTY for profile photo matching user requests)
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // Empty profile image of blank profile initially
  const [github, setGithub] = useState('');
  const [techStack, setTechStack] = useState('');
  const [highestStreak, setHighestStreak] = useState('0');
  const [followersCount, setFollowersCount] = useState('0');
  const [followingCount, setFollowingCount] = useState('0');

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // On Login, go directly to the application since we already have the profile information
    onLoginSuccess({
      name: loginUsername || 'Algo-Jo',
      role: 'Full-Stack Developer',
      bio: 'Building pristine applications and monitoring consistency daily.',
      avatarUrl: '', // blank avatar originally as requested
      github: 'algo-jo',
      techStack: ['React', 'TypeScript', 'Tailwind', 'Node.js'],
      highestStreak: 12,
      followersCount: 142,
      followingCount: 98,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verification check (only run if they entered values, otherwise let them directly click to pass)
    if (regPassword && regConfirmPassword && regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setScreen('onboarding');
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onLoginSuccess({
      name: name || 'Anonymous Coder',
      role: role || 'Software Architect',
      bio: bio || 'Building the future, one commit at a time.',
      avatarUrl: avatarUrl || '', // blank avatar originally
      github: github || undefined,
      techStack: techStack ? techStack.split(',').map(s => s.trim()).filter(s => s) : ['Productivity'],
      highestStreak: parseInt(highestStreak) || 0,
      followersCount: parseInt(followersCount) || 0,
      followingCount: parseInt(followingCount) || 0,
    });
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Glowing circles */}
      <div className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-30%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      {/* Launcher branding logo */}
      <div className="flex items-center gap-3.5 mb-10 select-none animate-in fade-in slide-in-from-top-4 duration-500 relative">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <span className="text-black font-black text-xl">S</span>
        </div>
        <span className="text-3xl font-extrabold tracking-tight text-white font-heading">Streakly</span>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-[#0F1317] border border-zinc-500/70 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white font-heading">Sign In to Streakly</h2>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Access your developer network and metrics</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 animate-pulse">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Type your username"
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-2xl h-12 mt-4 text-sm transition-all shadow-[0_10px_35px_-10px_rgba(16,185,129,0.4)]"
              >
                Log In
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-500/50">
              <span className="text-zinc-500 text-xs font-semibold">New to Streakly? </span>
              <button
                onClick={() => {
                  setError('');
                  setScreen('register');
                }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-extrabold text-xs"
              >
                Create an Account
              </button>
            </div>
          </motion.div>
        )}

        {screen === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-[#0F1317] border border-zinc-500/70 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white font-heading">Create Developer Space</h2>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Start documenting consistency effortlessly</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-2xl h-12 mt-4 text-sm transition-all shadow-[0_10px_35px_-10px_rgba(16,185,129,0.4)]"
              >
                Register
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-500/50">
              <span className="text-zinc-500 text-xs font-semibold">Already have an account? </span>
              <button
                onClick={() => {
                  setError('');
                  setScreen('login');
                }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-extrabold text-xs"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        )}

        {screen === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-5xl bg-[#0F1317] border border-zinc-500/70 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-8"
          >
            <div className="text-center space-y-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                Step 2: Initialize Display Settings
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white font-heading">Create Your Streakly Identity</h2>
              <p className="text-zinc-500 text-xs font-medium max-w-md mx-auto">
                Customize your developer card to showcase your skills, highest streak, and links to your network.
              </p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Onboarding Preview Section */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center bg-zinc-950/40 rounded-3xl p-6 border border-zinc-500 border-dashed relative">
                  <div className="absolute top-4 right-4 text-zinc-500 flex items-center gap-1 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-500 text-[8px] font-black tracking-widest uppercase">
                    Preview Card
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-2xl font-sans"></div>
                    <div className="relative w-36 h-36 bg-zinc-900 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.1)] border-4 border-zinc-950 overflow-hidden text-zinc-600">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                          <User className="w-16 h-16 stroke-[1.25]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center space-y-1.5 w-full">
                    <h4 className="text-xl font-bold text-white line-clamp-1">{name || 'Your Name'}</h4>
                    <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider line-clamp-1">{role || 'Full-Stack Developer'}</p>
                    <p className="text-xs text-zinc-300 font-medium line-clamp-2 px-2 leading-relaxed">{bio || 'Your bio will appear here.'}</p>
                  </div>
                </div>

                {/* Form Fields: Unified styled precisely like EDIT PROFILE */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Display Name</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Algo-Jo"
                        className="bg-zinc-950 border-zinc-500 h-11 text-sm font-bold focus:ring-emerald-500/50 rounded-xl px-4 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Current Role / Title</label>
                      <Input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Full-Stack Developer"
                        className="bg-zinc-950 border-zinc-500 h-11 text-sm font-bold focus:ring-emerald-500/50 rounded-xl px-4 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Personal Bio</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="About yourself..."
                      className="bg-zinc-950 border-zinc-500 min-h-[70px] p-4 text-xs focus:ring-emerald-500/50 rounded-xl resize-none text-zinc-300 leading-relaxed"
                    />
                  </div>

                  {/* Profile Picture */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Profile Picture (Empty FIRST for blank placeholder)</label>
                    <div 
                      className={`w-full border border-dashed rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all ${
                        dragActive 
                          ? 'border-emerald-500 bg-emerald-500/5' 
                          : 'border-zinc-500 bg-zinc-950 hover:border-zinc-300'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <label className="cursor-pointer text-[10px] text-white font-extrabold hover:text-emerald-400 transition-colors">
                        Upload avatar file
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                      <p className="text-[8px] text-zinc-500">or drop here</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-6 border-t border-zinc-500/50">
                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-2xl px-12 h-12 transition-all shadow-[0_10px_35px_-10px_rgba(16,185,129,0.4)] text-sm"
                >
                  Complete Onboarding
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
