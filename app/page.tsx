'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MediaItem, Collection } from '@/types/media';
import { 
  getAllMedia, saveMediaItem, deleteMediaItem, 
  toggleFavorite, getAllCollections, reorderMediaItems 
} from '@/lib/db';

import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { MediaFeed } from '@/components/feed/MediaFeed';
import { LibraryView } from '@/components/library/LibraryView';
import { AddMediaModal } from '@/components/add-media/AddMediaModal';
import { QueueDrawer } from '@/components/queue/QueueDrawer';
import { EditMediaModal } from '@/components/edit-media/EditMediaModal';
import { SettingsView } from '@/components/settings/SettingsView';
import { ResumeBanner } from '@/components/common/ResumeBanner';
import { Loader2, Trash2 } from 'lucide-react';

const LOCAL_STORAGE_LAST_STATE = 'my_media_feed_last_position';
const LOCAL_STORAGE_CONTINUOUS = 'my_media_feed_continuous_play';

export default function HomePage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab & View States
  const [currentTab, setCurrentTab] = useState<'feed' | 'library' | 'favorites' | 'settings'>('feed');
  const [continuousPlay, setContinuousPlay] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);

  // Resume Session Banner State
  const [resumeItem, setResumeItem] = useState<MediaItem | null>(null);
  const [resumePosition, setResumePosition] = useState<number>(0);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [mediaList, colList] = await Promise.all([
          getAllMedia(),
          getAllCollections(),
        ]);

        if (!isMounted) return;

        setItems(mediaList);
        setCollections(colList);

        if (mediaList.length > 0) {
          setActiveItemId((prev) => prev || mediaList[0].id);
        }

        // Check Saved Playback State
        const savedState = localStorage.getItem(LOCAL_STORAGE_LAST_STATE);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            if (parsed.id && parsed.position > 5) {
              const found = mediaList.find((i) => i.id === parsed.id);
              if (found) {
                setResumeItem(found);
                setResumePosition(parsed.position);
                setShowResumeBanner(true);
              }
            }
          } catch (e) {
            console.warn('Failed to parse saved playback state');
          }
        }

        // Read Continuous Play Preference
        const savedContinuous = localStorage.getItem(LOCAL_STORAGE_CONTINUOUS);
        if (savedContinuous !== null) {
          setContinuousPlay(savedContinuous === 'true');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading media database:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Save New Media
  const handleSaveMedia = async (newItem: MediaItem) => {
    const saved = await saveMediaItem(newItem);
    setItems((prev) => [saved, ...prev]);
    setActiveItemId(saved.id);
    setCurrentTab('feed');
  };

  // Handle Edit Media Item
  const handleUpdateItem = async (updatedItem: MediaItem) => {
    const saved = await saveMediaItem(updatedItem);
    setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
  };

  // Handle Delete Media Item Request
  const handleDeleteItem = (id: string) => {
    const found = items.find((i) => i.id === id);
    if (found) {
      setItemToDelete(found);
    }
  };

  // Perform Delete after confirmation
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    await deleteMediaItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeItemId === id) {
      const remaining = items.filter((i) => i.id !== id);
      setActiveItemId(remaining[0]?.id || null);
    }
    setItemToDelete(null);
  };

  // Handle Favorite Toggle
  const handleFavoriteToggle = async (id: string) => {
    const newFav = await toggleFavorite(id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, favorite: newFav } : i))
    );
  };

  // Handle Continuous Play Toggle
  const handleToggleContinuousPlay = () => {
    const nextVal = !continuousPlay;
    setContinuousPlay(nextVal);
    localStorage.setItem(LOCAL_STORAGE_CONTINUOUS, String(nextVal));
  };

  // Handle Mute Toggle
  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Handle Item Activated in Feed (Save position for resume)
  const handleItemActivated = (item: MediaItem) => {
    setActiveItemId(item.id);
    localStorage.setItem(
      LOCAL_STORAGE_LAST_STATE,
      JSON.stringify({
        id: item.id,
        position: 10, // Simulated last timestamp
        timestamp: Date.now(),
      })
    );
  };

  // Resume Session Callback
  const handleResumeSession = () => {
    if (resumeItem) {
      setActiveItemId(resumeItem.id);
      setCurrentTab('feed');
    }
    setShowResumeBanner(false);
  };

  // Filter items for Favorites view
  const favoriteItems = items.filter((i) => i.favorite);

  return (
    <div className="flex h-screen w-full bg-black text-zinc-100 overflow-hidden font-sans select-none">
      {/* DESKTOP SIDEBAR */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
        favoriteCount={favoriteItems.length}
      />

      {/* MAIN VIEWPORT CANVAS */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar relative">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-zinc-400">Đang khởi tạo Thư viện Media...</p>
          </div>
        ) : (
          <>
            {/* 1. HOME FEED VIEW */}
            {currentTab === 'feed' && (
              <MediaFeed
                items={items}
                activeItemId={activeItemId}
                continuousPlay={continuousPlay}
                isMuted={isMuted}
                onToggleContinuousPlay={handleToggleContinuousPlay}
                onToggleMute={handleToggleMute}
                onFavoriteToggle={handleFavoriteToggle}
                onOpenQueue={() => setIsQueueOpen(true)}
                onEditItem={(item) => setEditingItem(item)}
                onDeleteItem={handleDeleteItem}
                onItemActivated={handleItemActivated}
              />
            )}

            {/* 2. LIBRARY VIEW */}
            {currentTab === 'library' && (
              <LibraryView
                items={items}
                onPlayItem={(item) => {
                  setActiveItemId(item.id);
                  setCurrentTab('feed');
                }}
                onFavoriteToggle={handleFavoriteToggle}
                onEditItem={(item) => setEditingItem(item)}
                onDeleteItem={handleDeleteItem}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            )}

            {/* 3. FAVORITES VIEW */}
            {currentTab === 'favorites' && (
              <LibraryView
                items={favoriteItems}
                initialFilter="favorites"
                onPlayItem={(item) => {
                  setActiveItemId(item.id);
                  setCurrentTab('feed');
                }}
                onFavoriteToggle={handleFavoriteToggle}
                onEditItem={(item) => setEditingItem(item)}
                onDeleteItem={handleDeleteItem}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            )}

            {/* 4. SETTINGS VIEW */}
            {currentTab === 'settings' && (
              <SettingsView
                continuousPlay={continuousPlay}
                isMuted={isMuted}
                onToggleContinuousPlay={handleToggleContinuousPlay}
                onToggleMute={handleToggleMute}
                mediaCount={items.length}
              />
            )}
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      {/* ADD MEDIA MODAL */}
      <AddMediaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveMedia={handleSaveMedia}
        collections={collections}
      />

      {/* EDIT MEDIA MODAL */}
      <EditMediaModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdateItem}
        collections={collections}
      />

      {/* UP NEXT QUEUE DRAWER */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        items={items}
        activeItemId={activeItemId}
        onPlayItem={(item) => {
          setActiveItemId(item.id);
          setCurrentTab('feed');
        }}
        onRemoveFromQueue={handleDeleteItem}
        onReorder={(newOrder) => {
          setItems(newOrder);
          reorderMediaItems(newOrder.map((i) => i.id));
        }}
      />

      {/* RESUME PLAYBACK BANNER */}
      {showResumeBanner && resumeItem && (
        <ResumeBanner
          lastItem={resumeItem}
          lastPosition={resumePosition}
          onResume={handleResumeSession}
          onDismiss={() => setShowResumeBanner(false)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Xác nhận xóa Media</h3>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa <span className="font-semibold text-white">&quot;{itemToDelete.title}&quot;</span> khỏi thư viện? Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
