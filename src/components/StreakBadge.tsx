import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500"
    >
      <Flame className="w-5 h-5 fill-orange-500" />
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold">{streak}</span>
        <span className="text-[10px] uppercase tracking-tighter">Day Streak</span>
      </div>
    </motion.div>
  );
}
