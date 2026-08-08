'use client';

import React, { useState } from 'react';
import { MediaItem, Collection } from '@/types/media';
import { X, Edit3 } from 'lucide-react';

interface EditMediaModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: MediaItem) => Promise<void>;
  collections: Collection[];
}

export function EditMediaModal({
  item,
  isOpen,
  onClose,
  onSave,
  collections,
}: EditMediaModalProps) {
  if (!isOpen || !item) return null;

  return (
    <EditMediaModalForm
      key={item.id}
      item={item}
      onClose={onClose}
      onSave={onSave}
      collections={collections}
    />
  );
}

function EditMediaModalForm({
  item,
  onClose,
  onSave,
  collections,
}: {
  item: MediaItem;
  onClose: () => void;
  onSave: (updatedItem: MediaItem) => Promise<void>;
  collections: Collection[];
}) {
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [tagsInput, setTagsInput] = useState(item.tags ? item.tags.join(', ') : '');
  const [selectedCollection, setSelectedCollection] = useState(item.collectionId || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);

    const tagsArr = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const updated: MediaItem = {
      ...item,
      title,
      description,
      tags: tagsArr,
      collectionId: selectedCollection || undefined,
      updatedAt: Date.now(),
    };

    try {
      await onSave(updated);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Error saving updated item:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Chỉnh sửa thông tin Media</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-400 mb-1">
              Tiêu đề <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-400 mb-1">Mô tả</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-400 mb-1">Tags</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-400 mb-1">Bộ sưu tập</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Không phân loại</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg"
            >
              {isSaving ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
