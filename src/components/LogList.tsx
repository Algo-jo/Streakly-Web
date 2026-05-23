import React from 'react';
import { WorkLog } from '../lib/gemini';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Code, FileText, BookOpen, MoreHorizontal, Clock, Github, Folder, Paperclip, Download, Edit2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LogListProps {
  logs: WorkLog[];
  onEdit?: (log: WorkLog) => void;
  onDelete?: (id: string) => void;
}

const iconMap = {
  code: Code,
  note: FileText,
  paper: BookOpen,
  other: MoreHorizontal,
};

export function LogList({ logs, onEdit, onDelete }: LogListProps) {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const handleSimulatedDownload = (fileName: string) => {
    alert(`Downloading attachment: ${fileName} (simulated)`);
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-900/20 border border-dashed border-zinc-500 rounded-3xl">
        <p className="text-zinc-500 text-sm">No activities logged yet. Your journey starts here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {sortedLogs.map((log) => {
        const Icon = iconMap[log.category] || MoreHorizontal;
        
        // Level styling definitions
        const levelStyles = {
          HARD: 'border-red-500/30 text-red-400 bg-red-500/10',
          MEDIUM: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
          EASY: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
          NONE: 'border-zinc-500 text-zinc-500 bg-zinc-900/40',
        };

        const hasPriority = log.priority && log.priority !== 'NONE';

        // Map old / new priority values safely for display
        const getDisplayLevel = (p: string) => {
          if (p === 'LOW' || p === 'EASY') return 'EASY';
          if (p === 'MID' || p === 'MEDIUM') return 'MEDIUM';
          if (p === 'HIGH' || p === 'HARD') return 'HARD';
          return p;
        };

        const displayLevel = log.priority ? getDisplayLevel(log.priority) : 'NONE';

        return (
          <div key={log.id} className="bg-[#0F1317] border border-zinc-500/50 rounded-3xl p-5 sm:p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-zinc-500/10 sm:border-b-0 sm:pb-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-zinc-950 rounded-2xl border border-zinc-500 group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                  <Icon className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-tight text-sm sm:text-base line-clamp-1">{log.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] mt-1">
                    <Clock className="w-3 h-3" />
                    {format(log.timestamp, 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {/* Level status display if present */}
                {hasPriority && (
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border ${levelStyles[displayLevel as 'EASY' | 'MEDIUM' | 'HARD' | 'NONE'] || levelStyles.NONE}`}
                  >
                    {displayLevel} LEVEL
                  </Badge>
                )}

                <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase border-zinc-500 text-zinc-500 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-zinc-900/20">
                  {log.category === 'code' ? 'Category log' : 'Activity log'}
                </Badge>

                {onEdit && (
                  <button
                    onClick={() => onEdit(log)}
                    className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-500 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    title="Edit Activity"
                  >
                    <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this?")) {
                        onDelete(log.id);
                      }
                    }}
                    className="p-1.5 sm:p-2 bg-zinc-950 border border-red-500/40 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>
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
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 text-zinc-400 text-[10px] font-bold rounded-full border border-zinc-500 font-mono">
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

            <div className="text-sm text-zinc-400 prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-500 prose-pre:rounded-xl mb-4">
              <ReactMarkdown>{log.content}</ReactMarkdown>
            </div>

            {/* Attached Files display section */}
            {log.files && log.files.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-500/30">
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-600" />
                  Attached Files ({log.files.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {log.files.map((file, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSimulatedDownload(file.name)}
                      className="flex items-center justify-between p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-500 rounded-xl cursor-pointer transition-all group/file text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.previewUrl ? (
                          <img src={file.previewUrl} alt={file.name} className="w-8 h-8 object-cover rounded-lg border border-zinc-500" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-500 flex items-center justify-center text-zinc-500">
                            <Paperclip className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-300 line-clamp-1 group-hover/file:text-emerald-400 transition-colors">{file.name}</p>
                          <p className="text-[10px] text-zinc-500 leading-none mt-0.5">{file.size}</p>
                        </div>
                      </div>
                      <div className="p-1.5 text-zinc-600 group-hover/file:text-emerald-500 group-hover/file:bg-emerald-500/10 rounded-lg transition-all mr-1">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
