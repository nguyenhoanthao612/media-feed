import { MediaItem, Collection } from '@/types/media';

const DB_NAME = 'MyMediaFeedDB';
const DB_VERSION = 1;
const STORE_MEDIA = 'media_items';
const STORE_COLLECTIONS = 'collections';
const STORE_SETTINGS = 'settings';

// Cache for Object URLs created from Blobs to prevent memory leaks
const objectUrlCache = new Map<string, string>();

function getObjectUrlForBlob(id: string, key: string, blob?: Blob): string | undefined {
  if (!blob) return undefined;
  const cacheKey = `${id}_${key}`;
  if (objectUrlCache.has(cacheKey)) {
    return objectUrlCache.get(cacheKey);
  }
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(cacheKey, url);
  return url;
}

export function revokeObjectUrlsForItem(id: string) {
  for (const [key, url] of objectUrlCache.entries()) {
    if (key.startsWith(`${id}_`)) {
      URL.revokeObjectURL(url);
      objectUrlCache.delete(key);
    }
  }
}

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB only available on client-side'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        const mediaStore = db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
        mediaStore.createIndex('order', 'order', { unique: false });
        mediaStore.createIndex('type', 'type', { unique: false });
        mediaStore.createIndex('favorite', 'favorite', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_COLLECTIONS)) {
        db.createObjectStore(STORE_COLLECTIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Seed Initial Sample Media Data if Database is Fresh
const INITIAL_SEED_ITEMS: Omit<MediaItem, 'previewUrl'>[] = [
  {
    id: 'seed-1',
    title: 'Thác Nước Thiên Nhiên 4K (Nature Waterfall)',
    description: 'Âm thanh tự nhiên thư giãn với thác nước chảy rừng nguyên sinh.',
    type: 'video',
    sourceUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
    duration: 15,
    tags: ['#nature', '#relax', '#4k', '#waterfall'],
    favorite: true,
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
    order: 1,
    collectionId: 'relax',
    playCount: 12
  },
  {
    id: 'seed-2',
    title: 'Giai Điệu Lofi Chill Ban Đêm (Night Rain Lofi)',
    description: 'Âm nhạc Lofi kết hợp tiếng mưa rơi giúp tập trung học tập và ngủ ngon.',
    type: 'audio',
    sourceUrl: 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    duration: 180,
    tags: ['#lofi', '#study', '#chill', '#music'],
    favorite: true,
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
    order: 2,
    collectionId: 'study',
    playCount: 45
  },
  {
    id: 'seed-3',
    title: 'Hoàng Hôn Biển & Nhạc Cổ Điển (Sunset & Waves)',
    description: 'Ảnh chụp khung cảnh hoàng hôn rực rỡ ghép cùng bản nhạc piano nhẹ nhàng.',
    type: 'image_audio',
    sourceUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    audioUrl: 'https://actions.google.com/sounds/v1/music/piano_moment.ogg',
    duration: 240,
    tags: ['#sunset', '#piano', '#ambient', '#relax'],
    favorite: false,
    createdAt: Date.now() - 30000,
    updatedAt: Date.now() - 30000,
    order: 3,
    collectionId: 'relax',
    playCount: 8
  },
  {
    id: 'seed-4',
    title: 'Động Vật Hoang Dã Thú Vị (Wildlife Highlights)',
    description: 'Thước phim thiên nhiên hoang dã tuyệt đẹp chất lượng cao.',
    type: 'video',
    sourceUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80',
    duration: 15,
    tags: ['#wildlife', '#animals', '#documentary'],
    favorite: false,
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 20000,
    order: 4,
    collectionId: 'nature',
    playCount: 19
  },
  {
    id: 'seed-5',
    title: 'Lofi Girl - Relaxing Beats to Study/Relax to',
    description: 'Video phát trực tuyến âm nhạc Lofi nổi tiếng trên YouTube.',
    type: 'external_video',
    sourceUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    duration: 0,
    tags: ['#youtube', '#lofigirl', '#study', '#live'],
    favorite: true,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
    order: 5,
    collectionId: 'study',
    playCount: 88
  },
  {
    id: 'seed-6',
    title: 'Khám Phá Vũ Trụ & Tinh Vân (Cosmic Nebula)',
    description: 'Bức ảnh chụp dải ngân hà tuyệt đẹp với độ phân giải siêu nét.',
    type: 'image',
    sourceUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    duration: 10,
    tags: ['#space', '#nebula', '#wallpaper', '#art'],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: 6,
    collectionId: 'art',
    playCount: 5
  }
];

const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'relax', name: 'Thư Giãn & Thiên Nhiên', icon: 'Sparkles', color: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'study', name: 'Học Tập & Focus Lofi', icon: 'BookOpen', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'music', name: 'Âm Nhạc & Podcasts', icon: 'Music', color: 'bg-rose-500/20 text-rose-400' },
  { id: 'video', name: 'Video & Clip Ngắn', icon: 'Video', color: 'bg-purple-500/20 text-purple-400' },
  { id: 'youtube', name: 'YouTube & Stream Online', icon: 'Youtube', color: 'bg-red-500/20 text-red-400' },
];

export async function getAllMedia(): Promise<MediaItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readonly');
    const store = tx.objectStore(STORE_MEDIA);
    const request = store.getAll();

    request.onsuccess = async () => {
      let items: MediaItem[] = request.result || [];

      // Seed if empty
      if (items.length === 0) {
        await seedDefaultData(db);
        const seedTx = db.transaction(STORE_MEDIA, 'readonly');
        const seedReq = seedTx.objectStore(STORE_MEDIA).getAll();
        seedReq.onsuccess = () => {
          resolve(processMediaItems(seedReq.result || []));
        };
        return;
      }

      resolve(processMediaItems(items));
    };

    request.onerror = () => reject(request.error);
  });
}

function processMediaItems(items: MediaItem[]): MediaItem[] {
  return items.map((item) => {
    const processed = { ...item };

    // Sanitize legacy soundhelix URLs that fail CORS
    if (processed.sourceUrl && processed.sourceUrl.includes('soundhelix.com')) {
      processed.sourceUrl = 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg';
    }
    if (processed.audioUrl && processed.audioUrl.includes('soundhelix.com')) {
      processed.audioUrl = 'https://actions.google.com/sounds/v1/music/piano_moment.ogg';
    }

    // Sanitize legacy video URLs that fail CORS
    if (processed.type === 'video' && processed.sourceUrl && (processed.sourceUrl.includes('commondatastorage.googleapis.com') || processed.sourceUrl.includes('gtv-videos-bucket'))) {
      if (processed.id === 'seed-4') {
        processed.sourceUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
      } else {
        processed.sourceUrl = 'https://vjs.zencdn.net/v/oceans.mp4';
      }
    }

    // Process Blob for primary file if present
    if (processed.fileBlob) {
      processed.previewUrl = getObjectUrlForBlob(processed.id, 'file', processed.fileBlob);
    } else if (processed.type === 'video' || processed.type === 'image') {
      processed.previewUrl = processed.sourceUrl || processed.thumbnailUrl;
    }

    // Process Blob for Image in image_audio
    if (processed.imageBlob) {
      processed.previewUrl = getObjectUrlForBlob(processed.id, 'image', processed.imageBlob);
    } else if (processed.type === 'image_audio') {
      processed.previewUrl = processed.sourceUrl || processed.thumbnailUrl;
    }

    // Process Blob for Audio in image_audio or audio
    if (processed.audioBlob) {
      processed.audioUrl = getObjectUrlForBlob(processed.id, 'audio', processed.audioBlob);
    } else if (processed.type === 'audio' && !processed.audioUrl) {
      if (processed.sourceUrl && !processed.sourceUrl.includes('images.unsplash.com')) {
        processed.audioUrl = processed.sourceUrl;
      }
    }

    return processed;
  }).sort((a, b) => a.order - b.order);
}

async function seedDefaultData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_MEDIA, STORE_COLLECTIONS], 'readwrite');
    const mediaStore = tx.objectStore(STORE_MEDIA);
    const colStore = tx.objectStore(STORE_COLLECTIONS);

    for (const item of INITIAL_SEED_ITEMS) {
      mediaStore.put(item);
    }

    for (const col of INITIAL_COLLECTIONS) {
      colStore.put(col);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveMediaItem(item: MediaItem): Promise<MediaItem> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);

    // Ensure order is assigned
    const itemToSave = { ...item, updatedAt: Date.now() };

    const req = store.put(itemToSave);

    req.onsuccess = () => {
      const processed = processMediaItems([itemToSave])[0];
      resolve(processed);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function deleteMediaItem(id: string): Promise<void> {
  const db = await openDB();
  revokeObjectUrlsForItem(id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: MediaItem = getReq.result;
      if (!item) return reject(new Error('Item not found'));
      item.favorite = !item.favorite;
      item.updatedAt = Date.now();
      const putReq = store.put(item);
      putReq.onsuccess = () => resolve(item.favorite);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function incrementPlayCount(id: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: MediaItem = getReq.result;
      if (!item) return resolve(0);
      item.playCount = (item.playCount || 0) + 1;
      const putReq = store.put(item);
      putReq.onsuccess = () => resolve(item.playCount || 1);
      putReq.onerror = () => resolve(item.playCount || 0);
    };

    getReq.onerror = () => resolve(0);
  });
}

export async function reorderMediaItems(orderedIds: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);

    let completed = 0;
    orderedIds.forEach((id, index) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item: MediaItem = getReq.result;
        if (item) {
          item.order = index + 1;
          store.put(item);
        }
        completed++;
        if (completed === orderedIds.length) {
          resolve();
        }
      };
    });

    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllCollections(): Promise<Collection[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COLLECTIONS, 'readonly');
    const store = tx.objectStore(STORE_COLLECTIONS);
    const req = store.getAll();

    req.onsuccess = () => {
      let cols: Collection[] = req.result || [];
      if (cols.length === 0) {
        cols = INITIAL_COLLECTIONS;
      } else {
        cols = cols.map((c) => {
          if (c.id === 'relax' || c.name === 'Thư giãn & Thả lỏng') {
            return { ...c, id: 'relax', name: 'Thư Giãn & Thiên Nhiên' };
          }
          if (c.id === 'study' || c.name === 'Học tập & Làm việc') {
            return { ...c, id: 'study', name: 'Học Tập & Focus Lofi' };
          }
          if (c.id === 'nature' || c.name === 'Thiên nhiên & Động vật') {
            return { ...c, id: 'relax', name: 'Thư Giãn & Thiên Nhiên' };
          }
          if (c.id === 'art' || c.name === 'Nghệ thuật & Hình ảnh') {
            return { ...c, id: 'video', name: 'Video & Clip Ngắn' };
          }
          return c;
        });
      }

      // Merge with INITIAL_COLLECTIONS to ensure all standard playlists exist
      const colMap = new Map<string, Collection>();
      INITIAL_COLLECTIONS.forEach((c) => colMap.set(c.id, c));
      cols.forEach((c) => colMap.set(c.id, c));
      resolve(Array.from(colMap.values()));
    };

    req.onerror = () => resolve(INITIAL_COLLECTIONS);
  });
}

export async function saveCollection(collection: Collection): Promise<Collection> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COLLECTIONS, 'readwrite');
    const store = tx.objectStore(STORE_COLLECTIONS);
    const req = store.put(collection);

    req.onsuccess = () => resolve(collection);
    req.onerror = () => reject(req.error);
  });
}
