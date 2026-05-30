import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, Lock, Sparkles, Upload, X, AlertCircle, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, uploadAvatar } from '../lib/supabase';

interface AuthProps {
  onLoginSuccess: (profile: any) => void;
  // If user signed in via OAuth but hasn't completed onboarding
  initialSessionUser?: any;
}

export function Auth({ onLoginSuccess, initialSessionUser }: AuthProps) {
  const [screen, setScreen] = useState<'login' | 'register' | 'onboarding'>(
    initialSessionUser ? 'onboarding' : 'login'
  );
  
  // Login input states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register input states
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');

  // Onboarding metadata states
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); 
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reference for the logged in user during onboarding step
  const [onboardingUserId, setOnboardingUserId] = useState<string>(
    initialSessionUser?.id || ''
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setError('');
    setLoading(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Fetch user profile to see if onboarding is completed
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile || !profile.name) {
          setOnboardingUserId(data.user.id);
          setScreen('onboarding');
        } else {
          onLoginSuccess(profile);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regEmail || !regPassword || !regUsername) {
      setError('Harap isi semua kolom.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      // Clean username to keep only letters, numbers, and underscores
      const sanitizedUsername = regUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!sanitizedUsername) {
        setError('Username tidak valid.');
        setLoading(false);
        return;
      }

      // Check if username is already taken in the profiles table
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', sanitizedUsername)
        .maybeSingle();

      if (existingUser) {
        setError('Username sudah digunakan orang lain.');
        setLoading(false);
        return;
      }

      // Sign up the user
      const { data, error: authError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            username: sanitizedUsername,
            name: regUsername, // Default display name
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setOnboardingUserId(data.user.id);
        setDisplayName(regUsername); // Pre-fill with username
        setScreen('onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (authError) {
        setError(authError.message);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke Google.');
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const userId = onboardingUserId || initialSessionUser?.id;
    if (!userId) {
      setError('Sesi pengguna tidak valid.');
      setLoading(false);
      return;
    }

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Upload photo if selected
      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadAvatar(userId, avatarFile);
        } catch (uploadErr) {
          console.error('Avatar upload failed:', uploadErr);
          // Fallback, don't crash the whole registration
        }
      }

      // 2. Update profiles in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: displayName || 'Anonymous User',
          role: headline || 'Consistency Enthusiast',
          bio: bio || 'Saya menggunakan Streakly untuk memantau aktivitas harian!',
          avatar_url: finalAvatarUrl || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // 3. Fetch completed profile
      const { data: completedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      onLoginSuccess(completedProfile);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyelesaikan onboarding.');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop avatar handlers
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
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang diizinkan untuk avatar.');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glowing circles */}
      <div className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-30%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

      {/* Brand logo */}
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
            className="w-full max-w-md bg-[#0F1317] border border-zinc-500/70 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white font-heading">Sign In to Streakly</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Pelacak Konsistensi Harian Anda</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Google OAuth Login Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-700 font-extrabold rounded-2xl h-12 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Atau</span>
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    required
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
                    required
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold rounded-2xl h-12 mt-4 text-sm transition-all shadow-[0_10px_35px_-10px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-800">
              <span className="text-zinc-500 text-xs font-semibold">Belum punya akun? </span>
              <button
                onClick={() => {
                  setError('');
                  setScreen('register');
                }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-extrabold text-xs cursor-pointer"
              >
                Daftar Sekarang
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
            className="w-full max-w-md bg-[#0F1317] border border-zinc-500/70 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white font-heading">Daftar Akun Streakly</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Mulai memantau konsistensi Anda sekarang</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Google OAuth Register Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-700 font-extrabold rounded-2xl h-12 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign Up with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Atau</span>
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Username Unik</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Pilih username unik (contoh: budi_21)"
                    required
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Masukkan alamat email"
                    required
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
                    placeholder="Minimal 6 karakter"
                    required
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password"
                    required
                    className="bg-zinc-950 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-bold text-white focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold rounded-2xl h-12 mt-4 text-sm transition-all shadow-[0_10px_35px_-10px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                {loading ? 'Mendaftar...' : 'Daftar & Lanjutkan'}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-800">
              <span className="text-zinc-500 text-xs font-semibold">Sudah punya akun? </span>
              <button
                onClick={() => {
                  setError('');
                  setScreen('login');
                }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-extrabold text-xs cursor-pointer"
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
            className="w-full max-w-4xl bg-[#0F1317] border border-zinc-500/70 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-8 font-sans"
          >
            <div className="text-center space-y-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                LANGKAH 2: INISIALISASI PROFIL
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white font-heading">Buat Identitas Streakly Anda</h2>
              <p className="text-zinc-500 text-xs font-medium max-w-md mx-auto">
                Sesuaikan kartu profil Anda agar terlihat menarik saat dibagikan ke publik.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleOnboardingSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Onboarding Preview Section */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center bg-zinc-950/40 rounded-3xl p-6 border border-zinc-500 border-dashed relative">
                  <div className="absolute top-4 right-4 text-zinc-500 flex items-center gap-1 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-500 text-[8px] font-black tracking-widest uppercase">
                    Preview Card
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-2xl font-sans"></div>
                    <div className="relative w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.1)] border-4 border-zinc-950 overflow-hidden text-zinc-600">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                          <User className="w-14 h-14 stroke-[1.25]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center space-y-1.5 w-full">
                    <h4 className="text-lg font-bold text-white line-clamp-1">{displayName || 'Nama Anda'}</h4>
                    <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider line-clamp-1">{headline || 'Headline / Minat'}</p>
                    <p className="text-xs text-zinc-300 font-medium line-clamp-2 px-2 leading-relaxed">{bio || 'Deskripsi singkat mengenai perjalanan konsistensi Anda.'}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Nama Tampilan</label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Contoh: Budi Susanto"
                        required
                        className="bg-zinc-950 border-zinc-500 h-11 text-sm font-bold focus:ring-emerald-500/50 rounded-xl px-4 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Headline / Minat Utama</label>
                      <Input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="Contoh: Pegiat Gym / Pembaca Buku"
                        required
                        className="bg-zinc-950 border-zinc-500 h-11 text-sm font-bold focus:ring-emerald-500/50 rounded-xl px-4 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Biografi Singkat</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Ceritakan sedikit tentang kebiasaan harian yang ingin Anda bangun..."
                      required
                      className="bg-zinc-950 border-zinc-500 min-h-[70px] p-4 text-xs focus:ring-emerald-500/50 rounded-xl resize-none text-zinc-300 leading-relaxed"
                    />
                  </div>

                  {/* Profile Picture Upload */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Foto Profil (Avatar)</label>
                    <div 
                      className={`w-full border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1 transition-all ${
                        dragActive 
                          ? 'border-emerald-500 bg-emerald-500/5' 
                          : 'border-zinc-500 bg-zinc-950 hover:border-zinc-300'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <label className="cursor-pointer text-[10px] text-white font-extrabold hover:text-emerald-400 transition-colors">
                        Pilih file foto profil
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                      <p className="text-[8px] text-zinc-500">atau seret file ke sini</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-6 border-t border-zinc-500/50">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold rounded-2xl px-12 h-12 transition-all shadow-[0_10px_35px_-10px_rgba(16,185,129,0.4)] text-sm cursor-pointer"
                >
                  {loading ? 'Menyimpan...' : 'Inisialisasi Profil & Selesai'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
