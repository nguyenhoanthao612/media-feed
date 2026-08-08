'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMedia } from '@/context/MediaContext';
import { PlaylistsView } from '@/components/playlists/PlaylistsView';

export default function PlaylistsPage() {
  const router = useRouter();
  const {
    items,
    setActiveItemId,
    setIsAddModalOpen,
  } = useMedia();

  return (
    <PlaylistsView
      items={items}
      onPlayPlaylist={(plItems, startMediaId) => {
        if (startMediaId) {
          setActiveItemId(startMediaId);
        } else if (plItems.length > 0) {
          setActiveItemId(plItems[0].id);
        }
        router.push('/');
      }}
      onOpenAddMediaModal={() => setIsAddModalOpen(true)}
    />
  );
}
