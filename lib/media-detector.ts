import { MediaType } from '@/types/media';
import { isYouTubeUrl } from './youtube';

export function detectMediaTypeFromUrl(url: string): MediaType {
  if (!url) return 'video';

  const cleanUrl = url.split('?')[0].toLowerCase();

  if (isYouTubeUrl(url) || url.includes('vimeo.com')) {
    return 'external_video';
  }

  if (cleanUrl.match(/\.(mp4|webm|ogv|mov|m4v|m3u8)$/i)) {
    return 'video';
  }

  if (cleanUrl.match(/\.(mp3|wav|ogg|aac|m4a|flac|opus)$/i)) {
    return 'audio';
  }

  if (cleanUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i)) {
    return 'image';
  }

  // Default fallback if unknown
  return 'video';
}

export function detectMediaTypeFromFile(file: File): MediaType {
  const mime = file.type.toLowerCase();
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('image/')) return 'image';

  return detectMediaTypeFromUrl(file.name);
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');
  return `${paddedMins}:${paddedSecs}`;
}
