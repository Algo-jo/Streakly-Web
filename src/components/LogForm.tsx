import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Folder, Plus, Paperclip, Check, Loader2 } from 'lucide-react';
import { uploadAttachment } from '../lib/supabase';
import { Category } from '../lib/types';

interface LogFormProps {
  onAdd: (data: { 
    category_id?: string;
    category_name?: string; // used for creating new category
    description?: string; 
    activity_level?: 'LOW' | 'MID' | 'HIGH';
    files?: { name: string; size: string; previewUrl: string }[];
  }) => void;
  mode: 'repo' | 'activity';
  categories: Category[];
  initialData?: any;
  onSuccess?: () => void;
}

export function LogForm({ onAdd, onSuccess, mode, categories = [], initialData }: LogFormProps) {
  // Category mode states
  const [newCategoryName, setNewCategoryName] = useState('');

  // Activity mode states
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialData?.category_id || (categories.length > 0 ? categories[0].id : '')
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<'LOW' | 'MID' | 'HIGH'>(
    initialData?.activity_level || 'LOW'
  );
  const [files, setFiles] = useState<{ name: string; size: string; previewUrl: string; uploading?: boolean }[]>(
    initialData?.files || []
  );

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File uploading handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (fileList: FileList) => {
    setUploadError('');
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Add to state with uploading = true
      const tempId = Math.random().toString();
      const newFileObj = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        previewUrl: '',
        uploading: true
      };
      
      setFiles(prev => [...prev, newFileObj]);

      try {
        const uploadedFile = await uploadAttachment(file);
        
        // Update state with uploaded public URL
        setFiles(prev => prev.map(f => {
          if (f.name === file.name && f.uploading) {
            return {
              ...f,
              previewUrl: uploadedFile.previewUrl,
              uploading: false
            };
          }
          return f;
        }));
      } catch (err: any) {
        console.error('File upload failed:', err);
        setUploadError(`Gagal mengunggah file: ${file.name}`);
        // Remove from list if failed
        setFiles(prev => prev.filter(f => !(f.name === file.name && f.uploading)));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (mode === 'repo') {
      if (!newCategoryName.trim()) return;
      onAdd({
        category_name: newCategoryName.trim()
      });
      setNewCategoryName('');
    } else {
      if (!selectedCategoryId) {
        alert('Harap buat kategori terlebih dahulu sebelum mencatat aktivitas!');
        return;
      }

      // Check if any file is still uploading
      if (files.some(f => f.uploading)) {
        alert('Harap tunggu hingga semua file selesai diunggah.');
        return;
      }

      onAdd({
        category_id: selectedCategoryId,
        description: description.trim(),
        activity_level: priority,
        files: files.map(f => ({
          name: f.name,
          size: f.size,
          previewUrl: f.previewUrl
        }))
      });

      setDescription('');
      setFiles([]);
    }

    if (onSuccess) onSuccess();
  };

  return (
    <div className="bg-zinc-950 p-1">
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'repo' ? (
          /* New Category */
          <div className="space-y-5 py-2 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                NAMA KATEGORI <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Gym, Membaca Buku, Belajar"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-zinc-900/50 border-zinc-500 h-14 text-base font-bold focus:ring-emerald-500/50 rounded-2xl px-6 text-white"
                required
              />
            </div>
            
            <div className="pt-4 border-t border-zinc-900">
              <Button 
                type="submit" 
                disabled={!newCategoryName.trim()}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_-10px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Check className="w-5 h-5" /> BUAT KATEGORI
              </Button>
            </div>
          </div>
        ) : (
          /* New Activity / Edit Activity */
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
            
            {/* Select Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">KATEGORI AKTIVITAS</label>
              <div className="relative">
                <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  required
                  className="w-full bg-[#11161B] border border-zinc-500/80 pl-11 pr-10 h-13 rounded-2xl text-xs font-mono appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-300 cursor-pointer"
                >
                  {categories.length === 0 ? (
                    <option value="">(Buat Kategori terlebih dahulu)</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                DESKRIPSI AKTIVITAS <span className="text-zinc-500 text-[8px] font-normal tracking-wide">(OPSIONAL)</span>
              </label>
              <Textarea
                placeholder="e.g. Melakukan angkat beban dada 4 set, lari treadmil 15 menit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#11161B] border-zinc-500/80 min-h-[100px] text-xs font-semibold focus:ring-emerald-500/50 rounded-2xl p-4.5 resize-none leading-relaxed text-white"
              />
            </div>

            {/* Activity Level selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">BEBAN AKTIVITAS</label>
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
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">LAMPIRAN (OPSIONAL)</label>
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
                    Seret file ke sini atau <span className="text-emerald-500 font-extrabold underline decoration-wavy">pilih file komputer</span>
                  </p>
                </div>
              </div>

              {uploadError && (
                <p className="text-[10px] text-red-400 font-bold ml-1">{uploadError}</p>
              )}

              {/* Uploaded File list */}
              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-[140px] overflow-y-auto pr-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-zinc-500/40 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {file.uploading ? (
                          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-500 shrink-0">
                            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                          </div>
                        ) : file.previewUrl ? (
                          <img src={file.previewUrl} alt={file.name} className="w-8 h-8 object-cover rounded-lg border border-zinc-500 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-500 shrink-0 text-zinc-500">
                            <Paperclip className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-200 truncate pr-2 leading-tight">{file.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{file.uploading ? 'Mengunggah...' : file.size}</p>
                        </div>
                      </div>
                      {!file.uploading && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form submission controls */}
            <div className="pt-6 border-t border-zinc-900 flex justify-end">
              <Button 
                type="submit" 
                disabled={!selectedCategoryId || files.some(f => f.uploading)}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_-10px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Check className="w-5 h-5" /> {initialData ? 'UPDATE AKTIVITAS' : 'CATAT AKTIVITAS'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
