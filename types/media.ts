export type MediaType = 'video' | 'audio' | 'image' | 'image_audio' | 'external_video';

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  type: MediaType;
  
  // File URLs or Blob references
  sourceUrl?: string;          // Direct URL or YouTube link
  fileBlob?: Blob;             // Saved in IndexedDB for direct upload
  imageBlob?: Blob;            // Saved image for image_audio
  audioBlob?: Blob;            // Saved audio for image_audio
  
  // Object URLs or external URLs generated at runtime
  previewUrl?: string;         // Object URL or direct image URL
  audioUrl?: string;           // Object URL or direct audio URL
  thumbnailUrl?: string;       // Poster or thumbnail image URL
  
  duration?: number;           // In seconds
  tags: string[];              // e.g. ["#relax", "#music"]
  favorite: boolean;
  createdAt: number;           // Timestamp
  updatedAt: number;           // Timestamp
  order: number;               // Ordering position
  collectionId?: string;       // Collection group ID
  playCount?: number;
}

export interface Collection {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  itemIds: string[];
  isCustom?: boolean;
  createdAt: number;
}

export interface PlaybackState {
  lastMediaId: string | null;
  lastPosition: number;
  continuousPlay: boolean;
  isMuted: boolean;
  volume: number;
}
