'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';
import { RotateCw, Sparkles, Volume2, VolumeX, AlertCircle, Shuffle } from 'lucide-react';

export interface FeedEntry {
  feedKey: string;
  item: MediaItem;
  roundIndex: number;
}

interface MediaFeedProps {
  items: MediaItem[];
  isLoading?: boolean;
  isSheetsSyncing?: boolean;
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

// Fisher-Yates Shuffle helper with optional constraint to avoid duplicating boundary items
function shuffleList(array: MediaItem[], avoidFirstId?: string): MediaItem[] {
  if (array.length <= 1) return [...array];

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If first item matches avoidFirstId and array length > 1, swap with another index
  if (avoidFirstId && shuffled[0].id === avoidFirstId && shuffled.length > 1) {
    const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
  }

  return shuffled;
}

// Helper to create a randomized round of FeedEntry
function createRoundEntries(
  items: MediaItem[],
  roundIndex: number,
  firstItemOverride?: MediaItem,
  avoidFirstId?: string
): FeedEntry[] {
  if (items.length === 0) return [];

  let roundItems: MediaItem[] = [];

  if (firstItemOverride) {
    const remaining = items.filter((it) => it.id !== firstItemOverride.id);
    const shuffledRemaining = shuffleList(remaining, firstItemOverride.id);
    roundItems = [firstItemOverride, ...shuffledRemaining];
  } else {
    roundItems = shuffleList(items, avoidFirstId);
  }

  return roundItems.map((item, idx) => ({
    feedKey: `${item.id}_r${roundIndex}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    item,
    roundIndex,
  }));
}

export function MediaFeed({
  items,
  isLoading = false,
  isSheetsSyncing = false,
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
  const [feedSequence, setFeedSequence] = useState<FeedEntry[]>([]);
  const [activeFeedKey, setActiveFeedKey] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // Derive current round number from active feed key
  const currentRoundNumber = useMemo(() => {
    return feedSequence.find((e) => e.feedKey === activeFeedKey)?.roundIndex || 1;
  }, [feedSequence, activeFeedKey]);

  // Initialize or rebuild feed sequence when items change or externalActiveItemId is passed
  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(() => {
      if (isCancelled) return;

      if (!items || items.length === 0) {
        setFeedSequence([]);
        setActiveFeedKey(null);
        return;
      }

      let initialEntries: FeedEntry[] = [];
      let startKey: string | null = null;

      if (externalActiveItemId) {
        const targetItem = items.find((i) => i.id === externalActiveItemId);
        if (targetItem) {
          const r1 = createRoundEntries(items, 1, targetItem);
          const lastR1Id = r1[r1.length - 1]?.item.id;
          const r2 = createRoundEntries(items, 2, undefined, lastR1Id);
          initialEntries = [...r1, ...r2];
          startKey = r1[0].feedKey;
        }
      }

      if (initialEntries.length === 0) {
        const r1 = createRoundEntries(items, 1);
        const lastR1Id = r1[r1.length - 1]?.item.id;
        const r2 = createRoundEntries(items, 2, undefined, lastR1Id);
        initialEntries = [...r1, ...r2];
        startKey = r1[0]?.feedKey || null;
      }

      setFeedSequence(initialEntries);
      setActiveFeedKey(startKey);

      if (startKey) {
        isProgrammaticScrollRef.current = true;
        const scrollTimer = setTimeout(() => {
          const node = itemRefs.current.get(startKey!);
          if (node) {
            node.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 300);
        }, 50);
        return () => clearTimeout(scrollTimer);
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [items, externalActiveItemId]);

  // Reshuffle feed on user request
  const handleReshuffle = useCallback(() => {
    if (!items || items.length === 0) return;
    const r1 = createRoundEntries(items, 1);
    const lastR1Id = r1[r1.length - 1]?.item.id;
    const r2 = createRoundEntries(items, 2, undefined, lastR1Id);
    const newSeq = [...r1, ...r2];
    
    setFeedSequence(newSeq);
    const startKey = r1[0]?.feedKey || null;
    setActiveFeedKey(startKey);

    if (startKey) {
      isProgrammaticScrollRef.current = true;
      const node = itemRefs.current.get(startKey);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 400);
    }
  }, [items]);

  // Helper to append next round when approaching sequence end
  const maybeAppendNextRound = useCallback((currentKey: string, sequence: FeedEntry[]) => {
    if (!currentKey || sequence.length === 0 || items.length === 0) return;
    const activeIndex = sequence.findIndex((e) => e.feedKey === currentKey);
    if (activeIndex !== -1 && activeIndex >= sequence.length - 3) {
      const highestRound = sequence[sequence.length - 1]?.roundIndex || 1;
      const lastItemId = sequence[sequence.length - 1]?.item.id;
      const nextRound = createRoundEntries(items, highestRound + 1, undefined, lastItemId);
      setFeedSequence((prev) => [...prev, ...nextRound]);
    }
  }, [items]);

  // Intersection Observer to detect active card in feed
  useEffect(() => {
    if (!feedSequence || feedSequence.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-key');
            if (key) {
              setActiveFeedKey(key);
              const found = feedSequence.find((e) => e.feedKey === key);
              if (found && onItemActivated) {
                onItemActivated(found.item);
              }
              maybeAppendNextRound(key, feedSequence);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6,
      }
    );

    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [feedSequence, onItemActivated, maybeAppendNextRound]);

  // Continuous play next trigger
  const handleItemEnded = (endingFeedKey: string) => {
    if (!continuousPlay) return;

    const currentIndex = feedSequence.findIndex((entry) => entry.feedKey === endingFeedKey);
    if (currentIndex !== -1) {
      let targetIndex = currentIndex + 1;

      // If at end of sequence, append next round immediately
      if (targetIndex >= feedSequence.length) {
        const highestRound = feedSequence[feedSequence.length - 1]?.roundIndex || 1;
        const lastItemId = feedSequence[feedSequence.length - 1]?.item.id;
        const nextRound = createRoundEntries(items, highestRound + 1, undefined, lastItemId);
        const updatedSeq = [...feedSequence, ...nextRound];
        setFeedSequence(updatedSeq);
      }

      const nextEntry = feedSequence[targetIndex] || feedSequence[currentIndex];
      if (nextEntry) {
        isProgrammaticScrollRef.current = true;
        setActiveFeedKey(nextEntry.feedKey);
        if (onItemActivated) {
          onItemActivated(nextEntry.item);
        }

        const nextNode = itemRefs.current.get(nextEntry.feedKey);
        if (nextNode) {
          nextNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
      }
    }
  };

  if (items.length === 0) {
    if (isLoading || isSheetsSyncing) {
      return (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <Sparkles className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-semibold text-zinc-200">Đang tải danh sách Media...</h3>
            <p className="text-xs text-zinc-400">Đang đồng bộ dữ liệu từ Google Sheets / Bộ nhớ. Vui lòng chờ trong giây lát.</p>
          </div>
        </div>
      );
    }

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
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium flex items-center space-x-1 border border-indigo-500/30">
            <Shuffle className="w-3 h-3 text-indigo-400 inline" />
            <span>Random Vòng {currentRoundNumber}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReshuffle}
            className="p-2 rounded-full backdrop-blur-xl bg-zinc-900/80 border border-zinc-800/80 text-indigo-400 hover:bg-zinc-800 hover:text-indigo-300 transition-all shadow-xl"
            title="Ngẫu nhiên lại danh sách (Reshuffle)"
          >
            <Shuffle className="w-4 h-4" />
          </button>

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
        {feedSequence.map((entry) => (
          <div
            key={entry.feedKey}
            data-key={entry.feedKey}
            ref={(el) => {
              if (el) itemRefs.current.set(entry.feedKey, el);
              else itemRefs.current.delete(entry.feedKey);
            }}
            className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)] my-1"
          >
            <MediaCard
              item={entry.item}
              isActive={activeFeedKey === entry.feedKey}
              continuousPlay={continuousPlay}
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              onEnded={() => handleItemEnded(entry.feedKey)}
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

