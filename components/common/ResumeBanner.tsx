'use client';

import React from 'react';
import { MediaItem } from '@/types/media';
import { formatDuration } from '@/lib/media-detector';
import { Play, X, RotateCcw } from 'lucide-react';

interface ResumeBannerProps {
  lastItem: MediaItem | null;
  lastPosition: number;
  onResume: () => void;
  onDismiss: () => void;
}

export function ResumeBanner({
  lastItem,
  lastPosition,
  onResume,
  onDismiss,
}: ResumeBannerProps) {
  if (!lastItem) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[92%] max-w-md bg-zinc-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl text-zinc-100 flex items-center justify-between space-x-3 animate-fade-in">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0">
          <RotateCcw className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Tiếp tục phiên trước?</p>
          <h4 className="font-semibold text-xs text-white truncate">{lastItem.title}</h4>
          <p className="text-[10px] text-zinc-400">Vị trí: {formatDuration(lastPosition)}</p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 flex-shrink-0">
        <button
          onClick={onResume}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1 active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Tiếp tục</span>
        </button>

        <button
          onClick={onDismiss}
          className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
