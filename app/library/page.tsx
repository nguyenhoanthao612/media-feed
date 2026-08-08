'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMedia } from '@/context/MediaContext';
import { LibraryView } from '@/components/library/LibraryView';

export default function LibraryPage() {
  const router = useRouter();
  const {
    items,
    setActiveItemId,
    handleFavoriteToggle,
    handleDeleteItem,
    setEditingItem,
    setIsAddModalOpen,
  } = useMedia();

  return (
    <LibraryView
      items={items}
      onPlayItem={(item) => {
        setActiveItemId(item.id);
        router.push('/');
      }}
      onFavoriteToggle={handleFavoriteToggle}
      onEditItem={setEditingItem}
      onDeleteItem={handleDeleteItem}
      onOpenAddModal={() => setIsAddModalOpen(true)}
    />
  );
}
