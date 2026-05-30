import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Upload, User, Link as LinkIcon } from 'lucide-react';
import { supabase, uploadAvatar } from '../lib/supabase';
import { Profile } from '../lib/types';

interface ProfileEditProps {
  profile: Profile;
  onUpdateProfile: (updated: Profile) => void;
  onLogout?: () => void;
  activityCount?: number;
}

export function ProfileEdit({ profile, onUpdateProfile, onLogout, activityCount = 0 }: ProfileEditProps) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [savedMessage, setSavedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const publicLink = `${window.location.origin}/?u=${profile.username}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Upload new avatar if selected
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(profile.id, avatarFile);
        setAvatarUrl(finalAvatarUrl);
        setAvatarFile(null); // Clear uploaded file
      }

      // 2. Save changes to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          role,
          bio,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        alert(`Gagal memperbarui profil: ${error.message}`);
        setLoading(false);
        return;
      }

      // 3. Trigger profile update success
      onUpdateProfile({
        ...profile,
        name,
        role,
        bio,
        avatar_url: finalAvatarUrl
      });

      setSavedMessage(true);
      setTimeout(() => {
        setSavedMessage(false);
      }, 3000);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
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
      setAvatarFile(file);
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
            <h2 className="text-2xl font-black text-white tracking-tight line-clamp-1">{name || 'Nama Anda'}</h2>
            <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider line-clamp-1">{role || 'Headline / Minat'}</p>
            <p className="text-xs text-zinc-400 font-medium line-clamp-2 px-2 leading-relaxed">{bio || 'Biografi Anda.'}</p>
          </div>

          {/* Profile metadata info divider */}
          <div className="grid grid-cols-3 gap-2 w-full pt-6 border-t border-zinc-500/20 text-white">
            <div className="flex flex-col items-center gap-0.5 min-w-0 pr-1 border-r border-zinc-500/20">
              <span className="text-lg font-black tracking-tight font-mono text-emerald-400 truncate w-full">{activityCount}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.05em] text-center">Aktivitas</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 px-1 border-r border-zinc-500/20">
              <span className="text-lg font-black tracking-tight font-mono text-white truncate w-full">{profile.followers_count || '0'}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.05em] text-center">Followers</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0 pl-1">
              <span className="text-lg font-black tracking-tight font-mono text-white truncate w-full">{profile.following_count || profile.followed_ids?.length || 0}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.05em] text-center">Following</span>
            </div>
          </div>
        </div>

        {/* Public Sharing Link Card */}
        <div className="p-6 bg-[#0F1317] border border-zinc-500/50 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black tracking-wider uppercase text-white">Tautan Profil Publik</h4>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            Gunakan tautan ini untuk membagikan kebiasaan, streak, dan kalender konsistensi Anda dengan orang lain (Monkeytype-Style).
          </p>
          <div className="flex bg-zinc-950 p-2 rounded-xl border border-zinc-800 gap-2 items-center">
            <input 
              type="text" 
              readOnly 
              value={publicLink} 
              className="bg-transparent border-none text-[10px] font-mono text-zinc-400 select-all focus:outline-none flex-1 truncate px-1"
            />
            <Button 
              size="sm" 
              onClick={handleCopyLink}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[9px] px-3.5 h-8 rounded-lg cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : 'Copy'}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Information form fields */}
      <div className="lg:col-span-8 bg-[#0F1317] border border-zinc-500/50 rounded-[2.5rem] p-8 md:p-10 space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">Pengaturan Profil</h2>
          <p className="text-xs text-zinc-400 font-medium">Sesuaikan profil publik Streakly Anda untuk menginspirasi rekan pelacak lainnya.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Nama Tampilan</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Budi Susanto"
                className="bg-zinc-950 border-zinc-500 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Headline / Minat Utama</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Pegiat Gym / Pembaca Buku"
                className="bg-zinc-950 border-zinc-500 h-12 text-sm font-bold focus:ring-emerald-500/50 rounded-2xl px-5 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Biografi Singkat</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan sedikit tentang kebiasaan harian yang sedang Anda jalani..."
              className="bg-zinc-950 border-zinc-500 min-h-[100px] p-5 focus:ring-emerald-500/50 rounded-2xl resize-none text-zinc-300 leading-relaxed text-sm"
              required
            />
          </div>

          {/* Profile Picture Upload */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Foto Profil</label>
            
            <div 
              className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-1.5 transition-all ${
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
                  Klik untuk unggah foto baru
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </label>
                <p className="text-[10px] text-zinc-500 mt-0.5">atau seret file gambar ke sini</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pt-6 border-t border-zinc-500/40">
            {savedMessage ? (
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-sm animate-bounce">
                <Check className="w-4 h-4" /> Profil berhasil diperbarui!
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-semibold">Semua perubahan langsung tersimpan ke cloud.</span>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl px-10 h-13 transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] select-none w-full sm:w-auto cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
