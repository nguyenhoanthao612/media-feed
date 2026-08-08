'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Plus, Heart, ListVideo } from 'lucide-react';

interface BottomNavProps {
  onOpenAddModal: () => void;
  onOpenQueue: () => void;
}

export function BottomNav({
  onOpenAddModal,
}: BottomNavProps) {
  const pathname = usePathname();

  const isFeed = pathname === '/';
  const isLibrary = pathname.startsWith('/library');
  const isPlaylists = pathname.startsWith('/playlists');
  const isFavorites = pathname.startsWith('/favorites');

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around select-none">
      <Link
        href="/"
        className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-xl transition-colors ${
          isFeed ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">Home</span>
      </Link>

      <Link
        href="/library"
        className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-xl transition-colors ${
          isLibrary ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Library className="w-5 h-5" />
        <span className="text-[10px] font-medium">Thư viện</span>
      </Link>

      {/* Center BIG ADD BUTTON */}
      <button
        onClick={onOpenAddModal}
        className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-600/40 -translate-y-2 active:scale-90 transition-transform"
      >
        <Plus className="w-5 h-5" />
      </button>

      <Link
        href="/playlists"
        className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-xl transition-colors ${
          isPlaylists ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <ListVideo className="w-5 h-5" />
        <span className="text-[10px] font-medium">Danh sách</span>
      </Link>

      <Link
        href="/favorites"
        className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-xl transition-colors ${
          isFavorites ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Heart className="w-5 h-5" />
        <span className="text-[10px] font-medium">Yêu thích</span>
      </Link>
    </div>
  );
}
