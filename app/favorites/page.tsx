'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMedia } from '@/context/MediaContext';
import { LibraryView } from '@/components/library/LibraryView';

export default function FavoritesPage() {
  const router = useRouter();
  const {
    favoriteItems,
    setActiveItemId,
    handleFavoriteToggle,
    handleDeleteItem,
    setEditingItem,
    setIsAddModalOpen,
  } = useMedia();

  return (
    <LibraryView
      items={favoriteItems}
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
