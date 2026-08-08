'use client';

import React from 'react';
import { Home, Library, Heart, Plus, ListMusic, Sparkles, Settings } from 'lucide-react';

interface SidebarProps {
  currentTab: 'feed' | 'library' | 'favorites' | 'settings';
  onSelectTab: (tab: 'feed' | 'library' | 'favorites' | 'settings') => void;
  onOpenAddModal: () => void;
  onOpenQueue: () => void;
  favoriteCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  onOpenQueue,
  favoriteCount,
}: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col justify-between w-60 h-screen bg-zinc-950 border-r border-zinc-800 p-4 select-none sticky top-0">
      {/* BRAND & LOGO */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">My Media Feed</h1>
            <p className="text-[10px] text-zinc-400">Trình phát cá nhân</p>
          </div>
        </div>

        {/* ADD MEDIA BIG BUTTON */}
        <button
          onClick={onOpenAddModal}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>＋ Add Media</span>
        </button>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          <button
            onClick={() => onSelectTab('feed')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              currentTab === 'feed'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Home className="w-4 h-4 text-indigo-400" />
            <span>Home Feed</span>
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              currentTab === 'library'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Library className="w-4 h-4 text-blue-400" />
            <span>Thư viện (Library)</span>
          </button>

          <button
            onClick={() => onSelectTab('favorites')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              currentTab === 'favorites'
                ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              <span>Yêu thích</span>
            </div>
            {favoriteCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                {favoriteCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenQueue}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <ListMusic className="w-4 h-4 text-emerald-400" />
            <span>Hàng chờ (Queue)</span>
          </button>
        </nav>
      </div>

      {/* FOOTER USER / SETTINGS */}
      <div className="pt-4 border-t border-zinc-800/80">
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
            currentTab === 'settings'
              ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Cài đặt & Tùy chọn</span>
        </button>
      </div>
    </aside>
  );
}
