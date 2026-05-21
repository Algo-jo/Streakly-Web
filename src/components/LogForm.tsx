import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Github, Folder, Tag, Plus, Paperclip, ChevronRight, ChevronLeft, Check } from 'lucide-react';

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
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialData?.title || '');
  const [quickDesc, setQuickDesc] = useState(initialData?.metadata?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category] = useState(initialData?.category || (mode === 'repo' ? 'code' : 'note'));
  const [repo, setRepo] = useState(initialData?.metadata?.repo || '');
  const [folder, setFolder] = useState(initialData?.metadata?.folder || '');
  const [tags, setTags] = useState(initialData?.metadata?.tags?.join(', ') || '');
  const [priority, setPriority] = useState<'NONE' | 'LOW' | 'MID' | 'HIGH'>(initialData?.priority || 'NONE');
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
    if (!title || !content) return;
    
    const metadata = {
      repo: (mode === 'repo' || repo) ? repo : undefined,
      folder: mode === 'repo' ? folder : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      description: mode === 'activity' ? quickDesc : undefined,
    };

    onAdd({ 
      title, 
      content, 
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
    setPriority('NONE');
    setFiles([]);
    setStep(1);
    if (onStepChange) onStepChange(1);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="bg-zinc-950 p-2">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${step === 1 ? 'bg-emerald-500 text-black' : 'bg-emerald-950 text-emerald-400'}`}>1</span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Specifications</span>
        </div>
        <div className="h-[2px] bg-zinc-800 flex-1 mx-4">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: step === 2 ? '100%' : '0%' }}></div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${step === 2 ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}>2</span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-sans">Attachments & Content</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="max-h-[60vh] overflow-y-auto pr-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800/50 scrollbar-track-transparent">
          
          {/* STEP 1: Metadata inputs */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Title column */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  {mode === 'repo' ? 'REPOSITORY NAME' : 'ACTIVITY TITLE'} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={mode === 'repo' ? "e.g. Streakly Dashboard" : "What activity are you working on?"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-500 h-14 text-base font-bold focus:ring-emerald-500/50 rounded-2xl px-6"
                  required
                />
              </div>

              {/* Quick Description (specific for activities) */}
              {mode === 'activity' && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">ACTIVITY QUICK DESC</label>
                  <Input
                    placeholder="A brief summary of this activity..."
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-500 h-12 text-sm font-medium focus:ring-emerald-500/50 rounded-2xl px-6"
                  />
                </div>
              )}

              {/* Repository Links */}
              {mode === 'repo' ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">REPOSITORY ID</label>
                    <div className="relative">
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        placeholder="owner/repo"
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        className="bg-zinc-900/50 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">PATH</label>
                    <div className="relative">
                      <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        placeholder="src/components"
                        value={folder}
                        onChange={(e) => setFolder(e.target.value)}
                        className="bg-zinc-900/50 border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">SELECT REPOSITORY</label>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <select
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-500 pl-11 h-12 rounded-2xl text-sm font-mono appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-300"
                    >
                      <option value="">None</option>
                      {existingRepos.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Plus className="w-4 h-4 text-zinc-600 rotate-45" />
                    </div>
                  </div>
                </div>
              )}

              {/* Priority selection row */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">ACTIVITY PRIORITY</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['NONE', 'LOW', 'MID', 'HIGH'] as const).map((p) => {
                    const isSelected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`h-11 rounded-xl border text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center ${
                          isSelected 
                            ? p === 'NONE' ? 'bg-zinc-800 text-white border-zinc-500' :
                              p === 'LOW' ? 'bg-blue-500/10 text-blue-300 border-blue-500/50' :
                              p === 'MID' ? 'bg-amber-500/10 text-amber-300 border-amber-500/50' :
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

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">TAGS</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="ui, refactor, bugfix"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-500 pl-11 h-12 rounded-2xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Large text content & File uploads */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Drag & Drop File Upload at the TOP of step 2 - Compact layout */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">UPLOAD ATTACHMENTS (OPTIONAL)</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl py-3 px-4 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'border-zinc-500 bg-zinc-900/10 hover:border-zinc-700 hover:bg-zinc-900/20'
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
                      Drag & drop files here, or <span className="text-emerald-500 font-extrabold underline decoration-wavy">browse files</span>
                    </p>
                  </div>
                </div>

                {/* Uploaded lists */}
                {files.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-[120px] overflow-y-auto pr-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-500 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt={file.name} className="w-8 h-8 object-cover rounded-lg border border-zinc-500 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-500 shrink-0">
                              <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-200 truncate pr-2">{file.name}</p>
                            <p className="text-[10px] text-zinc-500">{file.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity main description - EXTREMELY SPACIOUS FULL SCREEN EDITOR */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  {mode === 'repo' ? 'ACHIEVEMENTS / LOG DECK' : 'ACTIVITY CONTENT (MAIN DESCRIPTION)'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Textarea
                    placeholder={mode === 'repo' ? "Document your repository progress here... (Use rich text / markdown if needed)" : "Work hard & document detail. State clearly your tasks, code snippets, or logs..."}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-zinc-900/60 border-zinc-500 min-h-[350px] md:min-h-[420px] p-6 focus:ring-emerald-500/50 rounded-3xl resize-y text-zinc-100 leading-relaxed font-mono text-sm shadow-inner"
                    style={{ lineHeight: '1.6' }}
                    required
                  />
                  <div className="absolute bottom-3 right-4 text-[9px] text-zinc-500 uppercase tracking-[0.1em] font-mono select-none">
                    Markdown Supported • {content.length} characters
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Nav Buttons - FIXED FROM OVERFLOWING TO THE RIGHT */}
        <div className="flex gap-4 pt-4 border-t border-zinc-900">
          {step === 2 && (
            <Button
              type="button"
              onClick={() => {
                setStep(1);
                if (onStepChange) onStepChange(1);
              }}
              className="px-6 h-14 bg-zinc-900 border border-zinc-500 hover:bg-zinc-800 hover:text-white text-zinc-300 font-bold rounded-2xl transition-all flex items-center gap-2 shrink-0"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </Button>
          )}

          {step === 1 ? (
            <Button
              type="button"
              disabled={!title}
              onClick={() => {
                if (title) {
                  setStep(2);
                  if (onStepChange) onStepChange(2);
                }
              }}
              className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed text-black font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_-10px_rgba(16,185,129,0.3)]"
            >
              CONTINUE TO DETAILS <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!content || !title}
              className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed text-black font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_-10px_rgba(16,185,129,0.4)]"
            >
              <Check className="w-5 h-5" /> {initialData 
                ? (mode === 'repo' ? 'UPDATE REPOSITORY' : 'UPDATE ACCOMPLISHMENTS') 
                : (mode === 'repo' ? 'COMMIT REPOSITORY' : 'SAVE SPECIFICATION')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
