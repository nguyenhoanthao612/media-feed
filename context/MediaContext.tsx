'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { MediaItem, Collection } from '@/types/media';
import { 
  getAllMedia, saveMediaItem, deleteMediaItem, 
  toggleFavorite, getAllCollections, reorderMediaItems 
} from '@/lib/db';
import {
  getStoredSheetsWebAppUrl,
  getStoredAutoSync,
  fetchItemsFromSheets,
  pushAllItemsToSheets,
} from '@/lib/google-sheets';

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

  // Google Sheets Sync
  isSheetsSyncing: boolean;
  lastSheetsSyncTime: string | null;
  handleManualSheetsSync: () => Promise<boolean>;

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

  // Sheets Sync State
  const [isSheetsSyncing, setIsSheetsSyncing] = useState(false);
  const [lastSheetsSyncTime, setLastSheetsSyncTime] = useState<string | null>(null);

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
        let [mediaList, colList] = await Promise.all([
          getAllMedia(),
          getAllCollections(),
        ]);

        if (!isMounted) return;

        // Display local IndexedDB data immediately
        setItems(mediaList);
        setCollections(colList);

        if (mediaList.length > 0) {
          setActiveItemId((prev) => prev || mediaList[0].id);
        }

        // Try syncing automatically from Google Sheets on startup
        const webAppUrl = getStoredSheetsWebAppUrl();
        if (webAppUrl) {
          try {
            setIsSheetsSyncing(true);
            const remoteItems = await fetchItemsFromSheets(webAppUrl);
            if (remoteItems.length > 0) {
              // Merge remote items with local items, prioritizing remote Google Sheets items
              const itemMap = new Map<string, MediaItem>();
              remoteItems.forEach((it) => itemMap.set(it.id, it));
              mediaList.forEach((it) => {
                if (!itemMap.has(it.id)) {
                  itemMap.set(it.id, it);
                }
              });
              
              const mergedList = Array.from(itemMap.values());
              // Persist remote items to local IndexedDB
              for (const rItem of remoteItems) {
                await saveMediaItem(rItem);
              }
              
              if (isMounted) {
                setItems(mergedList);
                if (mergedList.length > 0) {
                  setActiveItemId((prev) => prev || mergedList[0].id);
                }
                setLastSheetsSyncTime(new Date().toLocaleTimeString('vi-VN'));
              }
            }
          } catch (e) {
            console.warn('Initial Google Sheets sync skipped or failed:', e);
          } finally {
            if (isMounted) setIsSheetsSyncing(false);
          }
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

  // Helper to trigger background sync to Google Sheets
  const triggerAutoSheetsSync = async (currentItems: MediaItem[]) => {
    const webAppUrl = getStoredSheetsWebAppUrl();
    const autoSync = getStoredAutoSync();
    if (webAppUrl && autoSync) {
      try {
        setIsSheetsSyncing(true);
        await pushAllItemsToSheets(webAppUrl, currentItems);
        setLastSheetsSyncTime(new Date().toLocaleTimeString('vi-VN'));
      } catch (err) {
        console.error('Background Google Sheets sync error:', err);
      } finally {
        setIsSheetsSyncing(false);
      }
    }
  };

  // Manual Sheets Sync Button action
  const handleManualSheetsSync = async (): Promise<boolean> => {
    const webAppUrl = getStoredSheetsWebAppUrl();
    if (!webAppUrl) return false;
    try {
      setIsSheetsSyncing(true);
      // First fetch remote
      const remoteItems = await fetchItemsFromSheets(webAppUrl);
      const itemMap = new Map<string, MediaItem>();
      items.forEach((it) => itemMap.set(it.id, it));
      remoteItems.forEach((it) => itemMap.set(it.id, it));

      const mergedList = Array.from(itemMap.values());
      setItems(mergedList);
      for (const item of mergedList) {
        await saveMediaItem(item);
      }

      // Then push combined list back to Sheets
      await pushAllItemsToSheets(webAppUrl, mergedList);
      setLastSheetsSyncTime(new Date().toLocaleTimeString('vi-VN'));
      return true;
    } catch (err) {
      console.error('Manual Google Sheets sync failed:', err);
      return false;
    } finally {
      setIsSheetsSyncing(false);
    }
  };

  // Handle Save New Media
  const handleSaveMedia = async (newItem: MediaItem) => {
    const saved = await saveMediaItem(newItem);
    const updatedList = [saved, ...items];
    setItems(updatedList);
    setActiveItemId(saved.id);
    triggerAutoSheetsSync(updatedList);
  };

  // Handle Edit Media Item
  const handleUpdateItem = async (updatedItem: MediaItem) => {
    const saved = await saveMediaItem(updatedItem);
    const updatedList = items.map((i) => (i.id === saved.id ? saved : i));
    setItems(updatedList);
    triggerAutoSheetsSync(updatedList);
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
    const updatedList = items.filter((i) => i.id !== id);
    setItems(updatedList);
    if (activeItemId === id) {
      setActiveItemId(updatedList[0]?.id || null);
    }
    setItemToDelete(null);
    triggerAutoSheetsSync(updatedList);
  };

  // Handle Favorite Toggle
  const handleFavoriteToggle = async (id: string) => {
    const newFav = await toggleFavorite(id);
    const updatedList = items.map((i) => (i.id === id ? { ...i, favorite: newFav } : i));
    setItems(updatedList);
    triggerAutoSheetsSync(updatedList);
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
    triggerAutoSheetsSync(newItems);
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

        isSheetsSyncing,
        lastSheetsSyncTime,
        handleManualSheetsSync,

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

