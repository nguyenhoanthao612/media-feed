import { MediaItem, Playlist } from '@/types/media';

const LOCAL_STORAGE_PLAYLISTS = 'my_media_feed_custom_playlists';

export function getSmartPlaylists(items: MediaItem[]): Playlist[] {
  const smartPlaylists: Playlist[] = [];

  // 1. All Videos / Video Playlist
  const videoItems = items.filter((i) => i.type === 'video' || i.type === 'external_video');
  if (videoItems.length > 0) {
    smartPlaylists.push({
      id: 'smart-videos',
      name: 'Video & Clip Ngắn',
      description: 'Tất cả các video cá nhân và trực tuyến trong thư viện',
      category: 'Video',
      icon: 'Video',
      color: 'from-purple-600/30 to-indigo-600/30 text-purple-400',
      itemIds: videoItems.map((i) => i.id),
      createdAt: Date.now(),
    });
  }

  // 2. Relax & Nature
  const relaxItems = items.filter(
    (i) =>
      i.collectionId === 'relax' ||
      i.collectionId === 'nature' ||
      i.tags.some((t) => ['#relax', '#nature', '#waterfall', '#sunset', '#ambient'].includes(t.toLowerCase()))
  );
  if (relaxItems.length > 0) {
    smartPlaylists.push({
      id: 'smart-relax',
      name: 'Thư Giãn & Thiên Nhiên',
      description: 'Âm thanh tự nhiên, thiên nhiên hoang dã và không gian yên bình',
      category: 'Thư giãn',
      icon: 'Sparkles',
      color: 'from-emerald-600/30 to-teal-600/30 text-emerald-400',
      itemIds: relaxItems.map((i) => i.id),
      createdAt: Date.now(),
    });
  }

  // 3. Study & Lofi
  const studyItems = items.filter(
    (i) =>
      i.collectionId === 'study' ||
      i.tags.some((t) => ['#study', '#lofi', '#chill', '#focus'].includes(t.toLowerCase()))
  );
  if (studyItems.length > 0) {
    smartPlaylists.push({
      id: 'smart-study',
      name: 'Học Tập & Focus Lofi',
      description: 'Nhạc Lofi, tiếng mưa rơi và giai điệu tập trung công việc',
      category: 'Học tập',
      icon: 'BookOpen',
      color: 'from-blue-600/30 to-cyan-600/30 text-blue-400',
      itemIds: studyItems.map((i) => i.id),
      createdAt: Date.now(),
    });
  }

  // 4. Audio & Music
  const musicItems = items.filter(
    (i) =>
      i.type === 'audio' ||
      i.type === 'image_audio' ||
      i.tags.some((t) => ['#music', '#piano', '#song'].includes(t.toLowerCase()))
  );
  if (musicItems.length > 0) {
    smartPlaylists.push({
      id: 'smart-music',
      name: 'Âm Nhạc & Podcasts',
      description: 'Các bản nhạc, podcast và hình ảnh kèm âm thanh hay nhất',
      category: 'Âm nhạc',
      icon: 'Music',
      color: 'from-rose-600/30 to-pink-600/30 text-rose-400',
      itemIds: musicItems.map((i) => i.id),
      createdAt: Date.now(),
    });
  }

  // 5. YouTube & Streaming
  const youtubeItems = items.filter((i) => i.type === 'external_video' || i.tags.some((t) => t.toLowerCase().includes('youtube')));
  if (youtubeItems.length > 0) {
    smartPlaylists.push({
      id: 'smart-youtube',
      name: 'YouTube & Stream Online',
      description: 'Video phát trực tiếp và liên kết YouTube đã lưu',
      category: 'Giải trí',
      icon: 'Youtube',
      color: 'from-red-600/30 to-orange-600/30 text-red-400',
      itemIds: youtubeItems.map((i) => i.id),
      createdAt: Date.now(),
    });
  }

  // 6. Favorites Playlist
  const favItems = items.filter((i) => i.favorite);
  if (favItems.length > 0) {
    smartPlaylists.push({
      id: 'smart-favorites',
      name: 'Danh Sách Yêu Thích',
      description: 'Tất cả các mục media được đánh dấu yêu thích',
      category: 'Yêu thích',
      icon: 'Heart',
      color: 'from-amber-600/30 to-yellow-600/30 text-amber-400',
      itemIds: favItems.map((i) => i.id),
      createdAt: Date.now(),
    });
  }

  return smartPlaylists;
}

export function getCustomPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLAYLISTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomPlaylist(playlist: Playlist): Playlist[] {
  const playlists = getCustomPlaylists();
  const existingIndex = playlists.findIndex((p) => p.id === playlist.id);

  let updated: Playlist[];
  if (existingIndex >= 0) {
    updated = [...playlists];
    updated[existingIndex] = playlist;
  } else {
    updated = [playlist, ...playlists];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_PLAYLISTS, JSON.stringify(updated));
  }
  return updated;
}

export function deleteCustomPlaylist(playlistId: string): Playlist[] {
  const playlists = getCustomPlaylists();
  const updated = playlists.filter((p) => p.id !== playlistId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_PLAYLISTS, JSON.stringify(updated));
  }
  return updated;
}

export function addMediaToPlaylist(playlistId: string, mediaId: string): Playlist[] {
  const playlists = getCustomPlaylists();
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return playlists;

  if (!target.itemIds.includes(mediaId)) {
    target.itemIds.push(mediaId);
    return saveCustomPlaylist(target);
  }
  return playlists;
}
