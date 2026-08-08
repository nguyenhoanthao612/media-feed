'use client';

import React from 'react';
import { useMedia } from '@/context/MediaContext';
import { MediaFeed } from '@/components/feed/MediaFeed';

export default function HomePage() {
  const {
    items,
    activeItemId,
    continuousPlay,
    handleToggleContinuousPlay,
    isMuted,
    setIsMuted,
    handleFavoriteToggle,
    handleDeleteItem,
    setEditingItem,
  } = useMedia();

  return (
    <MediaFeed
      items={items}
      activeItemId={activeItemId}
      continuousPlay={continuousPlay}
      onToggleContinuousPlay={handleToggleContinuousPlay}
      isMuted={isMuted}
      onToggleMute={() => setIsMuted((prev) => !prev)}
      onFavoriteToggle={handleFavoriteToggle}
      onDeleteItem={handleDeleteItem}
      onEditItem={(item) => setEditingItem(item)}
    />
  );
}
