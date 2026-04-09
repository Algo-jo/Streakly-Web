import React from 'react';
import { WorkLog } from '../lib/gemini';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Code, FileText, BookOpen, MoreHorizontal, Clock, Github, Folder } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LogListProps {
  logs: WorkLog[];
}

const iconMap = {
  code: Code,
  note: FileText,
  paper: BookOpen,
  other: MoreHorizontal,
};

export function LogList({ logs }: LogListProps) {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
        <p className="text-zinc-500 text-sm">No logs yet. Your productivity journey starts here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedLogs.map((log) => {
        const Icon = iconMap[log.category] || MoreHorizontal;
        return (
          <div key={log.id} className="bg-[#0F1317] border border-zinc-800/50 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-tight">{log.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] mt-1">
                    <Clock className="w-3 h-3" />
                    {format(log.timestamp, 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase border-zinc-800 text-zinc-500 px-3 py-1 rounded-full">
                {log.category}
              </Badge>
            </div>
            
            {log.metadata && (
              <div className="flex flex-wrap gap-2 mb-4">
                {log.metadata.repo && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/5 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20 font-mono">
                    <Github className="w-3 h-3" />
                    {log.metadata.repo}
                  </div>
                )}
                {log.metadata.folder && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 text-zinc-400 text-[10px] font-bold rounded-full border border-zinc-800 font-mono">
                    <Folder className="w-3 h-3" />
                    {log.metadata.folder}
                  </div>
                )}
                {log.metadata.tags?.map((tag, i) => (
                  <div key={i} className="px-3 py-1 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold rounded-full border border-emerald-500/20">
                    #{tag}
                  </div>
                ))}
              </div>
            )}

            {log.metadata?.description && (
              <p className="text-xs text-zinc-300 font-medium mb-4 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                {log.metadata.description}
              </p>
            )}

            <div className="text-sm text-zinc-400 prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl">
              <ReactMarkdown>{log.content}</ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}
