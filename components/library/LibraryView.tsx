'use client';

import React, { useState, useMemo } from 'react';
import { MediaItem, MediaType } from '@/types/media';
import { formatDuration } from '@/lib/media-detector';
import { 
  Grid, List, Search, Heart, Play, Trash2, Edit3, 
  Video, Music, Image as ImageIcon, Sparkles, ExternalLink, 
  Plus, Tag, Filter, Clock, Eye 
} from 'lucide-react';

interface LibraryViewProps {
  items: MediaItem[];
  onPlayItem: (item: MediaItem) => void;
  onFavoriteToggle: (id: string) => void;
  onEditItem: (item: MediaItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenAddModal: () => void;
  initialFilter?: string;
}

export function LibraryView({
  items,
  onPlayItem,
  onFavoriteToggle,
  onEditItem,
  onDeleteItem,
  onOpenAddModal,
  initialFilter = 'all',
}: LibraryViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'plays'>('newest');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [items]);

  // Filter & Sort items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by Type or Favorites
      if (selectedType === 'favorites' && !item.favorite) return false;
      if (selectedType === 'video' && item.type !== 'video') return false;
      if (selectedType === 'audio' && item.type !== 'audio') return false;
      if (selectedType === 'image' && item.type !== 'image') return false;
      if (selectedType === 'image_audio' && item.type !== 'image_audio') return false;
      if (selectedType === 'external_video' && item.type !== 'external_video') return false;

      // Filter by Tag
      if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'plays') return (b.playCount || 0) - (a.playCount || 0);
      return 0;
    });
  }, [items, selectedType, selectedTag, searchQuery, sortBy]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 text-zinc-100 pb-24">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Thư viện Media</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-indigo-400 font-mono">
              {filteredItems.length} / {items.length}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Quản lý và sắp xếp tất cả các bài hát, video, hình ảnh cá nhân của bạn</p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Media Mới</span>
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mô tả hoặc tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3 flex items-center space-x-2">
            <span className="text-xs text-zinc-400 whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="title">Tên A - Z</option>
              <option value="plays">Lượt xem nhiều nhất</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="md:col-span-3 flex items-center justify-end space-x-2">
            <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Lưới"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MEDIA TYPE CATEGORY TABS */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Tất cả', icon: Sparkles },
            { id: 'favorites', label: 'Yêu thích', icon: Heart, count: items.filter(i => i.favorite).length },
            { id: 'video', label: 'Video', icon: Video },
            { id: 'audio', label: 'Âm thanh', icon: Music },
            { id: 'image', label: 'Hình ảnh', icon: ImageIcon },
            { id: 'image_audio', label: 'Ảnh + Âm thanh', icon: Sparkles },
            { id: 'external_video', label: 'YouTube', icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-zinc-950/40 rounded-full font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAG PILLS */}
        {allTags.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-medium text-zinc-500 flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>Tags:</span>
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
              >
                ✕ Xóa bộ lọc #{selectedTag}
              </button>
            )}
            {allTags.map((tag) => {
              const isTagSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isTagSelected ? null : tag)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full transition-colors border ${
                    isTagSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MEDIA GRID / LIST RESULTS */}
      {filteredItems.length === 0 ? (
        <div className="w-full py-16 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/50">
          <p className="text-zinc-400 text-sm">Không tìm thấy nội dung media nào phù hợp với bộ lọc.</p>
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedTag(null);
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-indigo-400 hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between shadow-lg"
            >
              {/* Media Thumbnail Container */}
              <div 
                className="relative aspect-video w-full bg-zinc-950 overflow-hidden cursor-pointer"
                onClick={() => onPlayItem(item)}
              >
                {item.previewUrl || item.thumbnailUrl ? (
                  <img
                    src={item.previewUrl || item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                    <Music className="w-10 h-10 text-zinc-600" />
                  </div>
                )}

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 rounded-full bg-indigo-600 text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                {item.duration ? (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-zinc-300 border border-white/10">
                    {formatDuration(item.duration)}
                  </span>
                ) : null}

                {/* Favorite Heart Badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle(item.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-zinc-300 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${item.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Card Meta Content */}
              <div className="p-3.5 space-y-2">
                <h3 className="font-semibold text-xs text-zinc-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{item.description}</p>
                )}

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/80">
                  <span className="capitalize">{item.type.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      title="Sửa"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
            >
              <div 
                className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                onClick={() => onPlayItem(item)}
              >
                <div className="relative w-16 h-12 bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0">
                  {item.previewUrl || item.thumbnailUrl ? (
                    <img src={item.previewUrl || item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Music className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 fill-white text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-zinc-200 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                    <span className="capitalize">{item.type}</span>
                    {item.duration ? <span>• {formatDuration(item.duration)}</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onFavoriteToggle(item.id)}
                  className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${item.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
                <button
                  onClick={() => onEditItem(item)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
