import React from 'react';
import { Laptop, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileCardProps {
  streak: number;
  projectCount: number;
}

export function ProfileCard({ streak, projectCount }: ProfileCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-10 bg-[#0F1317] rounded-[2.5rem] border border-zinc-800/30 backdrop-blur-md">
      <div className="relative mb-8 group">
        <div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative w-48 h-48 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.25)] border-4 border-zinc-950">
          <Laptop className="w-24 h-24 text-black" />
        </div>
      </div>

      <div className="space-y-2 mb-10">
        <h2 className="text-2xl font-bold text-white tracking-tight font-heading">Welcome, Algo-Jo!</h2>
        <p className="text-sm text-zinc-400 font-medium">Keep building, keep growing.</p>
      </div>

      <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl h-14 mb-10 transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] text-base">
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Profile
      </Button>

      <div className="flex justify-center w-full pt-8 border-t border-zinc-800/50">
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-white tracking-tight">{projectCount}</span>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Total Projects</span>
        </div>
      </div>
    </div>
  );
}
