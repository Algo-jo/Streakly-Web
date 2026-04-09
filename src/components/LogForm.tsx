import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Github, Folder, Tag, Plus } from 'lucide-react';

interface LogFormProps {
  onAdd: (log: { title: string; content: string; category: string; metadata?: any }) => void;
  mode: 'repo' | 'project';
  existingRepos?: string[];
}

export function LogForm({ onAdd, onSuccess, mode, existingRepos = [] }: LogFormProps & { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(mode === 'repo' ? 'code' : 'note');
  const [repo, setRepo] = useState('');
  const [folder, setFolder] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    const metadata = {
      repo: (mode === 'repo' || repo) ? repo : undefined,
      folder: mode === 'repo' ? folder : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      description: mode === 'project' ? quickDesc : undefined,
    };

    onAdd({ title, content, category, metadata });
    setTitle('');
    setQuickDesc('');
    setContent('');
    setRepo('');
    setFolder('');
    setTags('');
    if (onSuccess) onSuccess();
  };

  return (
    <div className="bg-zinc-950 p-2">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
              {mode === 'repo' ? 'REPOSITORY NAME' : 'NOTE TITLE'}
            </label>
            <Input
              placeholder={mode === 'repo' ? "e.g. Streakly Dashboard" : "What are we building?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 h-14 text-lg font-bold focus:ring-emerald-500/50 rounded-2xl px-6"
            />
          </div>

          {mode === 'project' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">NOTE QUICK DESC</label>
              <Input
                placeholder="A brief summary of this note..."
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 h-12 text-sm font-medium focus:ring-emerald-500/50 rounded-2xl px-6"
              />
            </div>
          )}

          {mode === 'repo' ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">REPOSITORY ID</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="owner/repo"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 pl-11 h-12 rounded-2xl text-sm font-mono"
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
                    className="bg-zinc-900/50 border-zinc-800 pl-11 h-12 rounded-2xl text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">SELECT REPOSITORY</label>
              <div className="relative">
                <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 pl-11 h-12 rounded-2xl text-sm font-mono appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-300"
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

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">TAGS</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="ui, refactor, bugfix"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 pl-11 h-12 rounded-2xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
              {mode === 'repo' ? 'ACHIEVEMENTS' : 'NOTE CONTENT (MAIN DESCRIPTION)'}
            </label>
            <Textarea
              placeholder={mode === 'repo' ? "Document your progress..." : "Detail your thoughts or progress..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 min-h-[180px] p-6 focus:ring-emerald-500/50 rounded-2xl resize-none text-zinc-300 leading-relaxed"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xl rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)]"
        >
          {mode === 'repo' ? 'COMMIT REPOSITORY' : 'SAVE NOTE'}
        </Button>
      </form>
    </div>
  );
}
