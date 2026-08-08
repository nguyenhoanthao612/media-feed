'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { MediaItem, Collection } from '@/types/media';
import { 
  getAllMedia, saveMediaItem, deleteMediaItem, 
  toggleFavorite, getAllCollections, reorderMediaItems 
} from '@/lib/db';

const LOCAL_STORAGE_LAST_STATE = 'my_media_feed_last_position';
const LOCAL_STORAGE_CONTINUOUS = 'my_media_feed_continuous_play';

interface MediaContextType {
  items: MediaItem[];
  collections: Collection[];
  isLoading: boolean;
  activeItemId: string | null;
  setActiveItemId: React.Dispatch<React.SetStateAction<string | null>>;
  continuousPlay: boolean;
  setContinuousPlay: React.Dispatch<React.SetStateAction<boolean>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  favoriteItems: MediaItem[];

  // Modals & Drawers
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  editingItem: MediaItem | null;
  setEditingItem: (item: MediaItem | null) => void;
  itemToDelete: MediaItem | null;
  setItemToDelete: (item: MediaItem | null) => void;

  // Actions
  handleSaveMedia: (newItem: MediaItem) => Promise<void>;
  handleUpdateItem: (updatedItem: MediaItem) => Promise<void>;
  handleDeleteItem: (id: string) => void;
  handleConfirmDelete: () => Promise<void>;
  handleFavoriteToggle: (id: string) => Promise<void>;
  handleToggleContinuousPlay: () => void;
  handleReorderItems: (newItems: MediaItem[]) => Promise<void>;

  // Resume State
  resumeItem: MediaItem | null;
  resumePosition: number;
  showResumeBanner: boolean;
  setShowResumeBanner: (show: boolean) => void;
  handleResumePlay: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const favoriteItems = useMemo(() => items.filter((i) => i.favorite), [items]);

  // Handle Save New Media
  const handleSaveMedia = async (newItem: MediaItem) => {
    const saved = await saveMediaItem(newItem);
    setItems((prev) => [saved, ...prev]);
    setActiveItemId(saved.id);
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

  // Handle Reorder Items
  const handleReorderItems = async (newItems: MediaItem[]) => {
    setItems(newItems);
    await reorderMediaItems(newItems.map((i) => i.id));
  };

  // Handle Resume Play action
  const handleResumePlay = () => {
    if (resumeItem) {
      setActiveItemId(resumeItem.id);
      setShowResumeBanner(false);
    }
  };

  return (
    <MediaContext.Provider
      value={{
        items,
        collections,
        isLoading,
        activeItemId,
        setActiveItemId,
        continuousPlay,
        setContinuousPlay,
        isMuted,
        setIsMuted,
        favoriteItems,

        isAddModalOpen,
        setIsAddModalOpen,
        isQueueOpen,
        setIsQueueOpen,
        editingItem,
        setEditingItem,
        itemToDelete,
        setItemToDelete,

        handleSaveMedia,
        handleUpdateItem,
        handleDeleteItem,
        handleConfirmDelete,
        handleFavoriteToggle,
        handleToggleContinuousPlay,
        handleReorderItems,

        resumeItem,
        resumePosition,
        showResumeBanner,
        setShowResumeBanner,
        handleResumePlay,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}
