'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';
import { RotateCw, Search, Sparkles, Filter, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface MediaFeedProps {
  items: MediaItem[];
  activeItemId?: string | null;
  continuousPlay: boolean;
  isMuted: boolean;
  onToggleContinuousPlay: () => void;
  onToggleMute: () => void;
  onFavoriteToggle: (id: string) => void;
  onSelectTag?: (tag: string) => void;
  onOpenQueue?: () => void;
  onEditItem?: (item: MediaItem) => void;
  onDeleteItem?: (id: string) => void;
  onItemActivated?: (item: MediaItem) => void;
}

export function MediaFeed({
  items,
  activeItemId: externalActiveItemId,
  continuousPlay,
  isMuted,
  onToggleContinuousPlay,
  onToggleMute,
  onFavoriteToggle,
  onSelectTag,
  onOpenQueue,
  onEditItem,
  onDeleteItem,
  onItemActivated,
}: MediaFeedProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(externalActiveItemId || items[0]?.id || null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll active item into view when externalActiveItemId is provided
  useEffect(() => {
    if (externalActiveItemId) {
      const timer = setTimeout(() => {
        setActiveItemId(externalActiveItemId);
        const node = itemRefs.current.get(externalActiveItemId);
        if (node) {
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [externalActiveItemId]);

  // Set up IntersectionObserver to detect which item is active (center of viewport)
  useEffect(() => {
    if (!items || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id) {
              setActiveItemId(id);
              const found = items.find((it) => it.id === id);
              if (found && onItemActivated) {
                onItemActivated(found);
              }
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6, // At least 60% of card visible
      }
    );

    // Observe all card nodes
    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [items, onItemActivated]);

  // Handle continuous play next trigger
  const handleItemEnded = (currentItemId: string) => {
    if (!continuousPlay) return;

    const currentIndex = items.findIndex((it) => it.id === currentItemId);
    if (currentIndex !== -1 && currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      const nextNode = itemRefs.current.get(nextItem.id);
      if (nextNode) {
        nextNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg font-bold text-zinc-200">Feed của bạn đang trống</h3>
          <p className="text-xs text-zinc-400">Chưa có tệp media nào hợp lệ. Nhấn nút &quot;+ Add Media&quot; để tải lên video, âm thanh, hoặc liên kết YouTube yêu thích!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] md:h-screen flex flex-col items-center justify-start overflow-hidden">
      {/* FLOATING TOP HEADER FEED CONTROL */}
      <div className="sticky top-2 z-30 w-full max-w-lg px-4 flex items-center justify-between pointer-events-auto">
        <div className="px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 shadow-2xl flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-zinc-100 tracking-wide">My Media Feed</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {items.length} items
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-full backdrop-blur-xl border shadow-xl transition-all ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-zinc-900/80 border-zinc-800/80 text-emerald-400 hover:bg-zinc-800'
            }`}
            title={isMuted ? 'Đang tắt tiếng (Bấm để bật)' : 'Đang bật tiếng'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleContinuousPlay}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border shadow-xl transition-all flex items-center space-x-1.5 ${
              continuousPlay
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${continuousPlay ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">Phát liên tục:</span>
            <span>{continuousPlay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* VERTICAL SNAP FEED SCROLL CONTAINER */}
      <div
        ref={containerRef}
        className="snap-feed-container w-full h-full pt-2 pb-20 no-scrollbar"
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-id={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el);
              else itemRefs.current.delete(item.id);
            }}
            className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)] my-1"
          >
            <MediaCard
              item={item}
              isActive={activeItemId === item.id}
              continuousPlay={continuousPlay}
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              onEnded={() => handleItemEnded(item.id)}
              onFavoriteToggle={onFavoriteToggle}
              onSelectTag={onSelectTag}
              onOpenQueue={onOpenQueue}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onToggleContinuousPlay={onToggleContinuousPlay}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
