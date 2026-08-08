'use client';

import React from 'react';
import { useMedia } from '@/context/MediaContext';
import { SettingsView } from '@/components/settings/SettingsView';

export default function SettingsPage() {
  const {
    items,
    continuousPlay,
    handleToggleContinuousPlay,
    isMuted,
    setIsMuted,
  } = useMedia();

  return (
    <SettingsView
      continuousPlay={continuousPlay}
      isMuted={isMuted}
      onToggleContinuousPlay={handleToggleContinuousPlay}
      onToggleMute={() => setIsMuted((prev) => !prev)}
      mediaCount={items.length}
    />
  );
}
