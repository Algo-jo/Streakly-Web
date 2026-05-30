import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Silakan periksa file .env Anda!'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ====================================================================
// IMAGE COMPRESSION UTILITIES (WebP, Max 500KB)
// ====================================================================

const DEFAULT_IMAGE_COMPRESS_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: "image/webp",
} as const;

function toWebpFile(compressed: Blob | File, originalFile: File): File {
  if (compressed instanceof File && compressed.name && compressed.name !== "blob") {
    return compressed;
  }

  const originalName = originalFile?.name ?? "documentation";
  const baseName = originalName.replace(/\.[^/.]+$/, "") || "documentation";
  return new File([compressed], `${baseName}.webp`, { type: "image/webp" });
}

export async function compressImageFile(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, DEFAULT_IMAGE_COMPRESS_OPTIONS);
    return toWebpFile(compressed, file);
  } catch (err) {
    console.error('Image compression failed, using original file instead:', err);
    return file;
  }
}

// ====================================================================
// STORAGE UPLOADS WITH COMPRESSION
// ====================================================================

/**
 * Upload an avatar image file to the public 'avatars' bucket.
 * Automatically compresses the image to a lightweight WebP format before uploading.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Compress image to WebP
  const compressedFile = await compressImageFile(file);
  const filePath = `${userId}.webp`;

  // Upload/overwrite file in the 'avatars' bucket
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, compressedFile, {
      upsert: true,
      contentType: 'image/webp',
    });

  if (error) {
    throw error;
  }

  // Get the public URL of the uploaded image
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  
  // Append a random timestamp query to bypass browser cache
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Upload a log attachment file to the public 'attachments' bucket.
 * Automatically compresses the file if it is an image to optimize space.
 */
export async function uploadAttachment(file: File): Promise<{ name: string; size: string; previewUrl: string }> {
  let fileToUpload = file;

  // Compress if the file is an image
  if (file.type.startsWith('image/')) {
    fileToUpload = await compressImageFile(file);
  }

  const sanitizedName = fileToUpload.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const fileName = `${Date.now()}_${sanitizedName}`;
  const filePath = fileName;

  const { error } = await supabase.storage
    .from('attachments')
    .upload(filePath, fileToUpload, {
      contentType: fileToUpload.type,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);

  let sizeStr = `${(fileToUpload.size / 1024).toFixed(1)} KB`;
  if (fileToUpload.size > 1024 * 1024) {
    sizeStr = `${(fileToUpload.size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return {
    name: fileToUpload.name,
    size: sizeStr,
    previewUrl: data.publicUrl,
  };
}
