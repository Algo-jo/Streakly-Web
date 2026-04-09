import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, TrendingUp, Lightbulb } from 'lucide-react';
import { ProductivityAnalysis } from '../lib/gemini';
import { motion } from 'motion/react';

interface AnalysisCardProps {
  analysis: ProductivityAnalysis | null;
  loading: boolean;
}

export function AnalysisCard({ analysis, loading }: AnalysisCardProps) {
  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 animate-pulse">
        <CardContent className="h-[300px] flex items-center justify-center">
          <Brain className="w-8 h-8 text-zinc-700 animate-bounce" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Brain className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          AI Productivity Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-zinc-300 leading-relaxed italic">
            "{analysis.summary}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-1">
              <TrendingUp className="w-3 h-3" />
              Efficiency
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              {analysis.productivityScore}%
            </div>
          </div>
          <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-1">
              <Brain className="w-3 h-3" />
              Focus Areas
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.topCategories.map((cat, i) => (
                <Badge key={i} variant="secondary" className="bg-zinc-800 text-[10px]">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Suggestions
          </h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="text-sm text-zinc-400 flex gap-2"
              >
                <span className="text-emerald-500">•</span>
                {s}
              </motion.li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
