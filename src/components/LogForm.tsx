import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Folder, Plus, Paperclip, Check } from 'lucide-react';

interface LogFormProps {
  onAdd: (log: { 
    title: string; 
    content: string; 
    category: string; 
    priority?: 'NONE' | 'LOW' | 'MID' | 'HIGH';
    files?: { name: string; size: string; previewUrl?: string }[];
    metadata?: any;
  }) => void;
  mode: 'repo' | 'activity';
  existingRepos?: string[];
  initialData?: {
    id: string;
    title: string;
    content: string;
    category: string;
    priority?: 'NONE' | 'LOW' | 'MID' | 'HIGH';
    files?: { name: string; size: string; previewUrl?: string }[];
    metadata?: any;
  };
  onStepChange?: (step: number) => void;
}

export function LogForm({ onAdd, onSuccess, mode, existingRepos = [], initialData, onStepChange }: LogFormProps & { onSuccess?: () => void }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [quickDesc, setQuickDesc] = useState(initialData?.metadata?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category] = useState(initialData?.category || (mode === 'repo' ? 'code' : 'note'));
  const [repo, setRepo] = useState(initialData?.metadata?.repo || '');
  const [folder, setFolder] = useState(initialData?.metadata?.folder || '');
  const [tags, setTags] = useState(initialData?.metadata?.tags?.join(', ') || '');
  const [priority, setPriority] = useState<'NONE' | 'LOW' | 'MID' | 'HIGH'>(initialData?.priority || 'LOW');
  const [files, setFiles] = useState<{ name: string; size: string; previewUrl?: string }[]>(initialData?.files || []);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (fileList: FileList) => {
    const newFiles: { name: string; size: string; previewUrl?: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      if (file.size > 1024 * 1024) {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }
      
      const fileObj: { name: string; size: string; previewUrl?: string } = {
        name: file.name,
        size: sizeStr,
      };

      if (file.type.startsWith('image/')) {
        fileObj.previewUrl = URL.createObjectURL(file);
      }
      
      newFiles.push(fileObj);
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    const finalContent = mode === 'repo' ? (content || `Category ${title} created.`) : (content || title);
    
    const metadata = {
      repo: mode === 'repo' ? title : (repo || undefined),
      folder: mode === 'repo' ? folder : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      description: mode === 'activity' ? quickDesc : undefined,
    };

    onAdd({ 
      title, 
      content: finalContent, 
      category, 
      priority,
      files,
      metadata 
    });

    setTitle('');
    setQuickDesc('');
    setContent('');
    setRepo('');
    setFolder('');
    setTags('');
    setPriority('LOW');
    setFiles([]);
    if (onStepChange) onStepChange(1);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="bg-zinc-950 p-1">
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'repo' ? (
          /* New Category: Simple input layout */
          <div className="space-y-5 py-2 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                CATEGORY NAME <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Designing UI"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900/50 border-zinc-500 h-14 text-base font-bold focus:ring-emerald-500/50 rounded-2xl px-6"
                required
              />
            </div>
            
            <div className="pt-4 border-t border-zinc-900">
              <Button 
                type="submit" 
                disabled={!title}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed text-black font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_-10px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Check className="w-5 h-5" /> CREATE CATEGORY
              </Button>
            </div>
          </div>
        ) : (
          /* New Activity / Edit Activity: Sleek Single-Column Layout */
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
            
            {/* Select Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">SELECT CATEGORY</label>
              <div className="relative">
                <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full bg-[#11161B] border border-zinc-500/80 pl-11 pr-10 h-13 rounded-2xl text-xs font-mono appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-300 cursor-pointer"
                >
                  <option value="">None</option>
                  {existingRepos.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                DESCRIPTION <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="e.g. Built the auth forms and setup validation plus configured the router..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  // Sync key inputs to content so any legacy visualizers keep consistency
                  setContent(e.target.value);
                }}
                className="bg-[#11161B] border-zinc-500/80 min-h-[100px] text-xs font-semibold focus:ring-emerald-500/50 rounded-2xl p-4.5 resize-none leading-relaxed"
                required
              />
            </div>

            {/* Activity Level selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">ACTIVITY LEVEL</label>
              <div className="grid grid-cols-3 gap-2">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((p) => {
                  const dbVal = p === 'EASY' ? 'LOW' : p === 'MEDIUM' ? 'MID' : 'HIGH';
                  const isSelected = priority === dbVal;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(dbVal)}
                      className={`h-11 rounded-xl border text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? p === 'EASY' ? 'bg-blue-500/10 text-blue-300 border-blue-500/50' :
                            p === 'MEDIUM' ? 'bg-amber-500/10 text-amber-300 border-amber-500/50' :
                            'bg-red-500/10 text-red-300 border-red-500/50'
                          : 'bg-zinc-900/30 text-zinc-400 hover:bg-zinc-900 border-zinc-500'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attachment Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">UPLOAD ATTACHMENTS (OPTIONAL)</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl py-4 px-4 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'border-zinc-500/75 bg-zinc-900/10 hover:border-zinc-300 hover:bg-zinc-900/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3">
                  <Paperclip className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs font-bold text-zinc-300">
                    Drag files here or <span className="text-emerald-500 font-extrabold underline decoration-wavy">browse files</span>
                  </p>
                </div>
              </div>

              {/* Uploaded File list */}
              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-[140px] overflow-y-auto pr-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-zinc-500/40 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {file.previewUrl ? (
                          <img src={file.previewUrl} alt={file.name} className="w-8 h-8 object-cover rounded-lg border border-zinc-500 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-500 shrink-0 text-zinc-500">
                            <Paperclip className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-200 truncate pr-2 leading-tight">{file.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{file.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form submission controls */}
            <div className="pt-6 border-t border-zinc-900 flex justify-end">
              <Button 
                type="submit" 
                disabled={!title}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed text-black font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_-10px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Check className="w-5 h-5" /> {initialData ? 'UPDATE ACCOMPLISHMENTS' : 'SAVE SPECIFICATION'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
