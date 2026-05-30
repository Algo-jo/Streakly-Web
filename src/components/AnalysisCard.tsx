import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, TrendingUp, Lightbulb, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ProductivityAnalysis } from '../lib/types';
import { motion } from 'motion/react';

interface AnalysisCardProps {
  analysis: ProductivityAnalysis | null;
  loading?: boolean;
}

export function AnalysisCard({ analysis, loading = false }: AnalysisCardProps) {
  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-500/50 animate-pulse">
        <CardContent className="h-[250px] flex items-center justify-center">
          <Brain className="w-8 h-8 text-zinc-700 animate-bounce" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  // Check if streak is at risk
  const isStreakAtRisk = analysis.summary.toLowerCase().includes('bahaya') || 
                         analysis.summary.toLowerCase().includes('terancam');

  return (
    <Card className="bg-[#0F1317] border border-zinc-500/50 overflow-hidden relative rounded-[2.5rem]">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Brain className="w-24 h-24 text-white" />
      </div>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-black flex items-center gap-2 text-white">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Productivity Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Streak Risk Alert Banner */}
        <div className={`p-4 rounded-2xl border text-xs font-semibold leading-relaxed flex gap-3 items-start ${
          isStreakAtRisk 
            ? 'bg-red-500/5 border-red-500/20 text-red-400' 
            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
        }`}>
          {isStreakAtRisk ? (
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          ) : (
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
          )}
          <div>
            <p className="font-extrabold uppercase tracking-wider mb-0.5">
              {isStreakAtRisk ? 'Streak Terancam!' : 'Status Streak'}
            </p>
            <p className="text-zinc-300">"{analysis.summary}"</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-500/30">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Konsistensi (7 Hari)
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {analysis.productivityScore}%
            </div>
          </div>
          <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-500/30">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-wider mb-1.5">
              <Brain className="w-3.5 h-3.5 text-emerald-400" />
              Fokus Utama
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.topCategories.length === 0 ? (
                <span className="text-[10px] text-zinc-600 italic">Belum ada</span>
              ) : (
                analysis.topCategories.map((cat, i) => (
                  <Badge key={i} variant="secondary" className="bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-300 py-0.5">
                    {cat}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            Saran & Rekomendasi
          </h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="text-xs text-zinc-400 flex gap-2 font-medium leading-relaxed"
              >
                <span className="text-emerald-500 font-bold shrink-0">•</span>
                <span>{s}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
