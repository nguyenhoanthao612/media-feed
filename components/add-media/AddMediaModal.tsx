'use client';

import React, { useState, useRef } from 'react';
import { MediaItem, MediaType, Collection } from '@/types/media';
import { detectMediaTypeFromFile, detectMediaTypeFromUrl } from '@/lib/media-detector';
import { extractYouTubeId } from '@/lib/youtube';
import { 
  Upload, Link as LinkIcon, Sparkles, X, Check, 
  Video, Music, Image as ImageIcon, AlertCircle, FileText 
} from 'lucide-react';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMedia: (item: MediaItem) => Promise<void>;
  collections: Collection[];
}

export function AddMediaModal({
  isOpen,
  onClose,
  onSaveMedia,
  collections,
}: AddMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'image_audio' | 'url'>('upload');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  
  // File state (Tab 1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectedType, setDetectedType] = useState<MediaType>('video');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  
  // Image + Audio state (Tab 2)
  const [comboImageFile, setComboImageFile] = useState<File | null>(null);
  const [comboAudioFile, setComboAudioFile] = useState<File | null>(null);
  const [comboImagePreview, setComboImagePreview] = useState<string | null>(null);
  const [comboAudioName, setComboAudioName] = useState<string | null>(null);

  // URL state (Tab 3)
  const [urlInput, setUrlInput] = useState('');
  const [urlDetectedType, setUrlDetectedType] = useState<MediaType>('video');
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlValidated, setUrlValidated] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle Drag & Drop for File Upload
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSingleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSingleFileSelect = (file: File) => {
    setUploadedFile(file);
    const type = detectMediaTypeFromFile(file);
    setDetectedType(type);
    
    // Auto populate title from filename
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }

    // Create temporary object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
  };

  // Validate URL input
  const handleValidateUrl = () => {
    if (!urlInput.trim()) return;
    setUrlValidating(true);
    setUrlError(null);

    try {
      const detected = detectMediaTypeFromUrl(urlInput);
      setUrlDetectedType(detected);
      setUrlValidated(true);
      setUrlValidating(false);

      if (!title) {
        if (detected === 'external_video') {
          const ytId = extractYouTubeId(urlInput);
          setTitle(`YouTube Video (${ytId || 'Link'})`);
        } else {
          setTitle(`Media URL (${detected})`);
        }
      }
    } catch (err) {
      setUrlError('Không thể nhận diện liên kết media này. Vui lòng kiểm tra lại URL.');
      setUrlValidating(false);
    }
  };

  // Handle Final Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    const tagsArr = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newItemId = `user-${Date.now()}`;

    let newItem: MediaItem;

    if (activeTab === 'upload') {
      if (!uploadedFile) {
        setIsSubmitting(false);
        return;
      }

      newItem = {
        id: newItemId,
        title,
        description,
        type: detectedType,
        fileBlob: uploadedFile,
        tags: tagsArr,
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: Date.now(),
        collectionId: selectedCollection || undefined,
      };
    } else if (activeTab === 'image_audio') {
      if (!comboImageFile || !comboAudioFile) {
        setIsSubmitting(false);
        return;
      }

      newItem = {
        id: newItemId,
        title,
        description,
        type: 'image_audio',
        imageBlob: comboImageFile,
        audioBlob: comboAudioFile,
        tags: tagsArr,
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: Date.now(),
        collectionId: selectedCollection || undefined,
      };
    } else {
      // Tab URL
      const detected = urlInput ? detectMediaTypeFromUrl(urlInput) : urlDetectedType;
      const ytId = urlInput ? extractYouTubeId(urlInput) : null;
      let computedThumbnail: string | undefined = undefined;

      if (ytId) {
        computedThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else if (detected === 'external_video') {
        computedThumbnail = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';
      }

      newItem = {
        id: newItemId,
        title: title || (ytId ? `YouTube Video (${ytId})` : 'Media URL'),
        description,
        type: detected,
        sourceUrl: urlInput,
        thumbnailUrl: computedThumbnail,
        tags: tagsArr,
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: Date.now(),
        collectionId: selectedCollection || undefined,
      };
    }

    try {
      await onSaveMedia(newItem);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error saving media item:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 text-zinc-100">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Thêm Media Mới</h2>
              <p className="text-xs text-zinc-400">Tải lên hoặc nhập liên kết nội dung cá nhân của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="grid grid-cols-3 bg-zinc-950 p-1.5 border-b border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'upload' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải tệp lên</span>
          </button>
          <button
            onClick={() => setActiveTab('image_audio')}
            className={`py-2 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'image_audio' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Ảnh + Nhạc</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`py-2 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'url' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nhập URL</span>
          </button>
        </div>

        {/* MODAL BODY FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/70 bg-zinc-950/60 rounded-2xl p-6 text-center cursor-pointer transition-colors space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleSingleFileSelect(e.target.files[0])}
                  accept="video/*,audio/*,image/*"
                  className="hidden"
                />
                <div className="p-3 bg-zinc-900 w-12 h-12 rounded-full mx-auto border border-zinc-800 flex items-center justify-center text-indigo-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Kéo thả tệp video, audio hoặc ảnh vào đây</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Hỗ trợ .mp4, .webm, .mp3, .wav, .jpg, .png</p>
                </div>
              </div>

              {uploadedFile && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    {detectedType === 'video' && <Video className="w-5 h-5 text-blue-400" />}
                    {detectedType === 'audio' && <Music className="w-5 h-5 text-emerald-400" />}
                    {detectedType === 'image' && <ImageIcon className="w-5 h-5 text-purple-400" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-200 truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {detectedType}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                    Sẵn sàng
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMAGE + AUDIO COMBINATION */}
          {activeTab === 'image_audio' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Image Input */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-center">
                <p className="text-xs font-semibold text-zinc-300">1. Chọn hình ảnh nền</p>
                {comboImagePreview ? (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-700">
                    <img src={comboImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <label className="block p-4 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer text-[11px] text-zinc-400">
                    <span>+ Chọn ảnh (.jpg, .png)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setComboImageFile(file);
                          setComboImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Audio Input */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-center">
                <p className="text-xs font-semibold text-zinc-300">2. Chọn tệp nhạc đi kèm</p>
                {comboAudioName ? (
                  <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-indigo-300 truncate">
                    🎵 {comboAudioName}
                  </div>
                ) : (
                  <label className="block p-4 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer text-[11px] text-zinc-400">
                    <span>+ Chọn audio (.mp3, .wav)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setComboAudioFile(file);
                          setComboAudioName(file.name);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADD FROM URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="url"
                  placeholder="Dán liên kết (YouTube, direct .mp4, .mp3, .jpg)..."
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setUrlValidated(false);
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleValidateUrl}
                  disabled={!urlInput.trim() || urlValidating}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Kiểm tra
                </button>
              </div>

              {urlValidated && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                  <span>✔ Liên kết hợp lệ: Loại {urlDetectedType}</span>
                </div>
              )}

              {urlError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {urlError}
                </div>
              )}
            </div>
          )}

          {/* COMMON METADATA INPUTS */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Tiêu đề <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập tên nội dung..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Mô tả ngắn
              </label>
              <textarea
                rows={2}
                placeholder="Thêm lời ghi chú hoặc cảm nhận về media này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Tags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="#music, #relax, #study"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Bộ sưu tập
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Không phân loại</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-semibold text-xs shadow-lg transition-colors"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu vào Thư viện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
