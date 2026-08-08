'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MediaItem, Playlist } from '@/types/media';
import {
  getSmartPlaylists,
  getCustomPlaylists,
  saveCustomPlaylist,
  deleteCustomPlaylist,
} from '@/lib/playlists';
import { formatDuration } from '@/lib/media-detector';
import {
  Play,
  Plus,
  ListVideo,
  Sparkles,
  BookOpen,
  Music,
  Video,
  Youtube,
  Heart,
  Trash2,
  Edit3,
  ChevronRight,
  FolderPlus,
  Clock,
  X,
  Check,
  Search,
  Filter,
} from 'lucide-react';

interface PlaylistsViewProps {
  items: MediaItem[];
  onPlayPlaylist: (playlistItems: MediaItem[], startMediaId?: string) => void;
  onOpenAddMediaModal: () => void;
}

export function PlaylistsView({
  items,
  onPlayPlaylist,
  onOpenAddMediaModal,
}: PlaylistsViewProps) {
  // Smart and Custom Playlists
  const smartPlaylists = useMemo(() => getSmartPlaylists(items), [items]);
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() => getCustomPlaylists());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [detailPlaylist, setDetailPlaylist] = useState<Playlist | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomPlaylist, setEditingCustomPlaylist] = useState<Playlist | null>(null);

  // Form State for Custom Playlist
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Thư giãn');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [formSearch, setFormSearch] = useState('');

  // Combine All Playlists
  const allPlaylists = [...customPlaylists, ...smartPlaylists];

  // Categories list for filter tabs
  const categories = [
    { id: 'all', label: 'Tất cả danh sách' },
    { id: 'custom', label: 'Của tôi (Custom)' },
    { id: 'Thư giãn', label: 'Thư giãn & Thiên nhiên' },
    { id: 'Học tập', label: 'Học tập & Lofi' },
    { id: 'Âm nhạc', label: 'Âm nhạc & Podcasts' },
    { id: 'Video', label: 'Video Clip' },
  ];

  // Filtered Playlists
  const filteredPlaylists = allPlaylists.filter((pl) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'custom'
        ? pl.isCustom
        : pl.category === selectedCategory;

    const matchesSearch =
      !searchQuery.trim() ||
      pl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pl.description && pl.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Get Media Items for a Playlist
  const getItemsForPlaylist = (playlist: Playlist): MediaItem[] => {
    return playlist.itemIds
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is MediaItem => Boolean(i));
  };

  // Icon Helper
  const renderPlaylistIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Music':
        return <Music className="w-5 h-5" />;
      case 'Video':
        return <Video className="w-5 h-5" />;
      case 'Youtube':
        return <Youtube className="w-5 h-5" />;
      case 'Heart':
        return <Heart className="w-5 h-5" />;
      default:
        return <ListVideo className="w-5 h-5" />;
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCustomPlaylist(null);
    setFormName('');
    setFormDesc('');
    setFormCategory('Thư giãn');
    setSelectedMediaIds([]);
    setFormSearch('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (pl: Playlist) => {
    setEditingCustomPlaylist(pl);
    setFormName(pl.name);
    setFormDesc(pl.description || '');
    setFormCategory(pl.category || 'Thư giãn');
    setSelectedMediaIds([...pl.itemIds]);
    setFormSearch('');
    setIsCreateModalOpen(true);
  };

  // Handle Save Custom Playlist
  const handleSaveCustomPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newPlaylist: Playlist = {
      id: editingCustomPlaylist?.id || `custom-pl-${Date.now()}`,
      name: formName.trim(),
      description: formDesc.trim() || 'Danh sách phát tùy chỉnh cá nhân',
      category: formCategory,
      icon: 'ListVideo',
      color: 'from-indigo-600/30 to-violet-600/30 text-indigo-400',
      itemIds: selectedMediaIds,
      isCustom: true,
      createdAt: editingCustomPlaylist?.createdAt || Date.now(),
    };

    const updated = saveCustomPlaylist(newPlaylist);
    setCustomPlaylists(updated);
    setIsCreateModalOpen(false);

    // Update detail drawer if viewing
    if (detailPlaylist && detailPlaylist.id === newPlaylist.id) {
      setDetailPlaylist(newPlaylist);
    }
  };

  // Handle Delete Custom Playlist
  const handleDeleteCustomPlaylist = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh sách phát này?')) {
      const updated = deleteCustomPlaylist(id);
      setCustomPlaylists(updated);
      if (detailPlaylist?.id === id) {
        setDetailPlaylist(null);
      }
    }
  };

  // Toggle Item Selection in Create/Edit Form
  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full min-h-screen bg-black text-zinc-100 p-4 md:p-8 space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg">
              <ListVideo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                Danh Sách Phát (Playlists)
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Phát video và âm thanh theo các chủ đề, thể loại hoặc danh sách tùy chọn
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <FolderPlus className="w-4 h-4" />
          <span>＋ Tạo Danh Sách Phát Mới</span>
        </button>
      </div>

      {/* SEARCH AND CATEGORY FILTERS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* SEARCH BOX */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm danh sách phát..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-zinc-400 font-mono">
            {filteredPlaylists.length} danh sách phát
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* PLAYLISTS GRID */}
      {filteredPlaylists.length === 0 ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl">
          <ListVideo className="w-10 h-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Không tìm thấy danh sách phát phù hợp</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            Bạn có thể tạo danh sách phát mới hoặc tải thêm video vào thư viện của mình.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-semibold transition-all mt-2"
          >
            ＋ Tạo danh sách phát đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaylists.map((playlist) => {
            const plItems = getItemsForPlaylist(playlist);
            const totalDuration = plItems.reduce((acc, curr) => acc + (curr.duration || 0), 0);

            return (
              <div
                key={playlist.id}
                className="group relative bg-zinc-900/90 border border-zinc-800/90 hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                {/* TOP HEADER */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${
                          playlist.color || 'from-indigo-600/30 to-violet-600/30 text-indigo-400'
                        } border border-white/10 shadow-md`}
                      >
                        {renderPlaylistIcon(playlist.icon)}
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                          {playlist.category || 'Danh sách'}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mt-1">
                          {playlist.name}
                        </h3>
                      </div>
                    </div>

                    {playlist.isCustom && (
                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(playlist);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Sửa danh sách phát"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomPlaylist(playlist.id);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Xóa danh sách phát"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 min-h-[2.25rem] leading-relaxed">
                    {playlist.description || 'Danh sách tổng hợp media.'}
                  </p>

                  {/* THUMBNAIL MOSAIC PREVIEW */}
                  <div
                    onClick={() => setDetailPlaylist(playlist)}
                    className="relative w-full h-32 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/80 cursor-pointer group/thumb flex"
                  >
                    {plItems.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-xs">
                        <ListVideo className="w-6 h-6 mb-1 opacity-40" />
                        <span>Danh sách trống</span>
                      </div>
                    ) : plItems.length === 1 ? (
                      <img
                        src={
                          plItems[0].thumbnailUrl ||
                          plItems[0].previewUrl ||
                          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={plItems[0].title}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full grid grid-cols-2 gap-0.5">
                        {plItems.slice(0, 4).map((item, idx) => (
                          <div key={item.id || idx} className="relative w-full h-full bg-zinc-900 overflow-hidden">
                            <img
                              src={
                                item.thumbnailUrl ||
                                item.previewUrl ||
                                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
                              }
                              alt={item.title}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Play Overlay Badge */}
                    <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 group-hover/thumb:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Count badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-zinc-200 border border-white/10">
                      {plItems.length} mục
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="pt-4 mt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px]">
                      {totalDuration > 0 ? formatDuration(totalDuration) : 'Tùy chỉnh'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDetailPlaylist(playlist)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs transition-colors"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() => {
                        if (plItems.length > 0) {
                          onPlayPlaylist(plItems, plItems[0].id);
                        }
                      }}
                      disabled={plItems.length === 0}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Phát</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLAYLIST DETAIL DRAWER / MODAL */}
      {detailPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* DRAWER HEADER */}
            <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/60">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`p-3 rounded-2xl bg-gradient-to-br ${
                    detailPlaylist.color || 'from-indigo-600/30 to-violet-600/30 text-indigo-400'
                  } border border-white/10`}
                >
                  {renderPlaylistIcon(detailPlaylist.icon)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10">
                      {detailPlaylist.category || 'Danh sách phát'}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {getItemsForPlaylist(detailPlaylist).length} nội dung
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{detailPlaylist.name}</h2>
                </div>
              </div>

              <button
                onClick={() => setDetailPlaylist(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DRAWER BODY: ITEMS LIST */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 no-scrollbar">
              {getItemsForPlaylist(detailPlaylist).length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Danh sách phát này chưa có video hoặc bài hát nào.
                </div>
              ) : (
                getItemsForPlaylist(detailPlaylist).map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onPlayPlaylist(getItemsForPlaylist(detailPlaylist), item.id);
                      setDetailPlaylist(null);
                    }}
                    className="group flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-indigo-500/50 hover:bg-zinc-800/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-xs font-mono text-zinc-500 w-5 text-center">
                        {index + 1}
                      </span>
                      <div className="relative w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden flex-shrink-0 border border-zinc-800">
                        <img
                          src={
                            item.thumbnailUrl ||
                            item.previewUrl ||
                            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-indigo-600/40 flex items-center justify-center transition-colors">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {item.type === 'video'
                            ? 'Video'
                            : item.type === 'external_video'
                            ? 'YouTube'
                            : item.type === 'audio'
                            ? 'Audio'
                            : 'Ảnh & Nhạc'}
                          {item.duration ? ` • ${formatDuration(item.duration)}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPlaylist(getItemsForPlaylist(detailPlaylist), item.id);
                        setDetailPlaylist(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white font-medium text-xs transition-colors flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Phát</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* DRAWER FOOTER */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
              <button
                onClick={() => setDetailPlaylist(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  const plItems = getItemsForPlaylist(detailPlaylist);
                  if (plItems.length > 0) {
                    onPlayPlaylist(plItems, plItems[0].id);
                    setDetailPlaylist(null);
                  }
                }}
                disabled={getItemsForPlaylist(detailPlaylist).length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Phát Toàn Bộ Danh Sách</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOM PLAYLIST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* MODAL HEADER */}
            <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {editingCustomPlaylist ? 'Chỉnh Sửa Danh Sách Phát' : 'Tạo Danh Sách Phát Mới'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSaveCustomPlaylist} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Tên danh sách phát *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Nhạc Chill Buổi Tối, Video Động Thực Vật..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Thể loại / Thẻ</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Thư giãn">Thư giãn & Thiên nhiên</option>
                    <option value="Học tập">Học tập & Lofi</option>
                    <option value="Âm nhạc">Âm nhạc & Podcasts</option>
                    <option value="Video">Video Clip</option>
                    <option value="Giải trí">Giải trí</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Mô tả danh sách..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* MEDIA SELECTION LIST */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    Chọn nội dung trong danh sách ({selectedMediaIds.length} đã chọn)
                  </label>
                  <div className="relative w-40">
                    <input
                      type="text"
                      value={formSearch}
                      onChange={(e) => setFormSearch(e.target.value)}
                      placeholder="Lọc media..."
                      className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-white placeholder-zinc-500"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-xl p-2 bg-zinc-950/80 space-y-1.5 no-scrollbar">
                  {items.length === 0 ? (
                    <div className="text-center py-6 text-xs text-zinc-500">Thư viện trống</div>
                  ) : (
                    items
                      .filter((item) => !formSearch || item.title.toLowerCase().includes(formSearch.toLowerCase()))
                      .map((item) => {
                        const isSelected = selectedMediaIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleMediaSelection(item.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' : 'hover:bg-zinc-900 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-zinc-700'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <span className="truncate">{item.title}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {item.type}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* MODAL BUTTONS */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30"
                >
                  {editingCustomPlaylist ? 'Lưu Thay Đổi' : 'Tạo Danh Sách Phát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
