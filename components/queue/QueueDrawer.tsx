'use client';

import React from 'react';
import { MediaItem } from '@/types/media';
import { formatDuration } from '@/lib/media-detector';
import { X, Play, Trash2, ChevronUp, ChevronDown, ListMusic, Music } from 'lucide-react';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  activeItemId: string | null;
  onPlayItem: (item: MediaItem) => void;
  onRemoveFromQueue: (id: string) => void;
  onReorder: (newItems: MediaItem[]) => void;
}

export function QueueDrawer({
  isOpen,
  onClose,
  items,
  activeItemId,
  onPlayItem,
  onRemoveFromQueue,
  onReorder,
}: QueueDrawerProps) {
  if (!isOpen) return null;

  const activeIndex = items.findIndex((i) => i.id === activeItemId);
  const activeItem = activeIndex !== -1 ? items[activeIndex] : null;
  const nextItems = activeIndex !== -1 ? items.slice(activeIndex + 1) : items;

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onReorder(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onReorder(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col justify-between shadow-2xl text-zinc-100">
        {/* HEADER */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ListMusic className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-sm text-white">Hàng chờ phát (Up Next Queue)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {/* NOW PLAYING SECTION */}
          {activeItem && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Đang phát</span>
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center space-x-3">
                <div className="relative w-12 h-12 bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0">
                  {activeItem.previewUrl || activeItem.thumbnailUrl ? (
                    <img src={activeItem.previewUrl || activeItem.thumbnailUrl} alt={activeItem.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Music className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-white text-white animate-pulse" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-white truncate">{activeItem.title}</h4>
                  <p className="text-[10px] text-zinc-400 capitalize">{activeItem.type}</p>
                </div>
              </div>
            </div>
          )}

          {/* UP NEXT SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tiếp theo ({nextItems.length})</span>
            </div>

            {nextItems.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Không có media nào tiếp theo trong hàng chờ.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => {
                  if (index <= activeIndex) return null; // Only show up next items
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all"
                    >
                      <div 
                        className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => {
                          onPlayItem(item);
                          onClose();
                        }}
                      >
                        <div className="w-10 h-10 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0">
                          {item.previewUrl || item.thumbnailUrl ? (
                            <img src={item.previewUrl || item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                              <Music className="w-4 h-4 text-zinc-500" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h5 className="font-medium text-xs text-zinc-200 truncate group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h5>
                          <span className="text-[10px] text-zinc-500">{formatDuration(item.duration)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleMoveUp(index)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveFromQueue(item.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
