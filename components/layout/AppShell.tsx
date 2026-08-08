'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMedia } from '@/context/MediaContext';
import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ResumeBanner } from '@/components/common/ResumeBanner';
import { AddMediaModal } from '@/components/add-media/AddMediaModal';
import { QueueDrawer } from '@/components/queue/QueueDrawer';
import { EditMediaModal } from '@/components/edit-media/EditMediaModal';
import { Loader2, Trash2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    items,
    collections,
    isLoading,
    favoriteItems,
    activeItemId,
    setActiveItemId,
    isAddModalOpen,
    setIsAddModalOpen,
    isQueueOpen,
    setIsQueueOpen,
    editingItem,
    setEditingItem,
    itemToDelete,
    setItemToDelete,
    handleConfirmDelete,
    handleSaveMedia,
    handleUpdateItem,
    handleDeleteItem,
    handleReorderItems,
    showResumeBanner,
    setShowResumeBanner,
    resumeItem,
    resumePosition,
    handleResumePlay,
  } = useMedia();

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION (DESKTOP) */}
      <Sidebar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
        favoriteCount={favoriteItems.length}
      />

      {/* MAIN ROUTE VIEW */}
      <main className="flex-1 relative overflow-y-auto bg-black no-scrollbar">
        {/* RESUME PLAYBACK BANNER */}
        {showResumeBanner && resumeItem && (
          <ResumeBanner
            lastItem={resumeItem}
            lastPosition={resumePosition}
            onResume={handleResumePlay}
            onDismiss={() => setShowResumeBanner(false)}
          />
        )}

        {isLoading ? (
          <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs">Đang tải dữ liệu media...</p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* BOTTOM NAVIGATION (MOBILE) */}
      <BottomNav
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      {/* ADD MEDIA MODAL */}
      {isAddModalOpen && (
        <AddMediaModal
          collections={collections}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSaveMedia={handleSaveMedia}
        />
      )}

      {/* EDIT MEDIA MODAL */}
      {editingItem && (
        <EditMediaModal
          item={editingItem}
          collections={collections}
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdateItem}
        />
      )}

      {/* QUEUE DRAWER */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        items={items}
        activeItemId={activeItemId}
        onPlayItem={(item) => {
          setActiveItemId(item.id);
          setIsQueueOpen(false);
          router.push('/');
        }}
        onRemoveFromQueue={handleDeleteItem}
        onReorder={handleReorderItems}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Xác nhận xóa media</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                Bạn có chắc chắn muốn xóa <span className="text-zinc-200 font-semibold">&quot;{itemToDelete.title}&quot;</span> khỏi thư viện?
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all"
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
