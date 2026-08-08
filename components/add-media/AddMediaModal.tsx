'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaItem, MediaType, Collection } from '@/types/media';
import { detectMediaTypeFromFile, detectMediaTypeFromUrl } from '@/lib/media-detector';
import { extractYouTubeId } from '@/lib/youtube';
import { getCustomPlaylists, addMediaToPlaylist } from '@/lib/playlists';
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
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [audioInputMode, setAudioInputMode] = useState<'file' | 'url'>('file');

  const [comboImageFile, setComboImageFile] = useState<File | null>(null);
  const [comboImageUrl, setComboImageUrl] = useState('');
  
  const [comboAudioFile, setComboAudioFile] = useState<File | null>(null);
  const [comboAudioUrl, setComboAudioUrl] = useState('');

  const [comboImagePreview, setComboImagePreview] = useState<string | null>(null);
  const [comboAudioName, setComboAudioName] = useState<string | null>(null);

  // URL state (Tab 3)
  const [urlInput, setUrlInput] = useState('');
  const [urlDetectedType, setUrlDetectedType] = useState<MediaType>('video');
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlValidated, setUrlValidated] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Auto Title Fetching State
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [fetchedTitleSuccess, setFetchedTitleSuccess] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchTitleFromUrl = async (urlStr: string) => {
    if (!urlStr || !urlStr.trim().startsWith('http')) return;
    setIsFetchingTitle(true);
    setFetchedTitleSuccess(null);
    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(urlStr.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setTitle(data.title);
          setFetchedTitleSuccess(data.title);
        }
      }
    } catch (err) {
      console.warn('Failed to auto-fetch title:', err);
    } finally {
      setIsFetchingTitle(false);
    }
  };

  // Auto-fetch title when URL changes in URL tab
  useEffect(() => {
    if (activeTab === 'url' && urlInput.trim().startsWith('http')) {
      const timer = setTimeout(() => {
        fetchTitleFromUrl(urlInput.trim());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [urlInput, activeTab]);

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

      fetchTitleFromUrl(urlInput.trim());
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
      const hasImage = imageInputMode === 'file' ? Boolean(comboImageFile) : Boolean(comboImageUrl.trim());
      const hasAudio = audioInputMode === 'file' ? Boolean(comboAudioFile) : Boolean(comboAudioUrl.trim());

      if (!hasImage || !hasAudio) {
        setIsSubmitting(false);
        return;
      }

      const imageUrl = imageInputMode === 'url' ? comboImageUrl.trim() : undefined;
      const audioUrlVal = audioInputMode === 'url' ? comboAudioUrl.trim() : undefined;

      newItem = {
        id: newItemId,
        title,
        description,
        type: 'image_audio',
        imageBlob: imageInputMode === 'file' ? (comboImageFile || undefined) : undefined,
        audioBlob: audioInputMode === 'file' ? (comboAudioFile || undefined) : undefined,
        sourceUrl: imageUrl || audioUrlVal,
        thumbnailUrl: imageUrl,
        previewUrl: imageUrl,
        audioUrl: audioUrlVal,
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
      if (selectedCollection && selectedCollection.startsWith('custom-pl-')) {
        addMediaToPlaylist(selectedCollection, newItemId);
      }
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
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300">1. Hình ảnh nền</p>
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('file')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        imageInputMode === 'file' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Tải tệp
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        imageInputMode === 'url' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {imageInputMode === 'file' ? (
                  comboImagePreview ? (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-700 group">
                      <img src={comboImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setComboImageFile(null);
                          setComboImagePreview(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full backdrop-blur-sm transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block p-4 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer text-center text-[11px] text-zinc-400">
                      <span>+ Chọn tệp ảnh (.jpg, .png)</span>
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
                  )
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Dán URL ảnh (https://images.unsplash.com/...)..."
                      value={comboImageUrl}
                      onChange={(e) => setComboImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                    {comboImageUrl.trim() ? (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                        <img
                          src={comboImageUrl.trim()}
                          alt="URL Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-zinc-900/50 border border-zinc-800/60 rounded-lg text-[10px] text-zinc-500 text-center">
                        Nhập URL ảnh trực tiếp từ Unsplash, Imgur, Web...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Audio Input */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300">2. Nhạc / Audio đi kèm</p>
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAudioInputMode('file')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        audioInputMode === 'file' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Tải tệp
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudioInputMode('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        audioInputMode === 'url' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {audioInputMode === 'file' ? (
                  comboAudioName ? (
                    <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-indigo-300 flex items-center justify-between">
                      <span className="truncate">🎵 {comboAudioName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setComboAudioFile(null);
                          setComboAudioName(null);
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-400 transition-colors ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block p-4 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer text-center text-[11px] text-zinc-400">
                      <span>+ Chọn tệp nhạc (.mp3, .wav)</span>
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
                  )
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Dán URL âm thanh (direct .mp3, .wav, .ogg)..."
                      value={comboAudioUrl}
                      onChange={(e) => setComboAudioUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                    {comboAudioUrl.trim() ? (
                      <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[11px] text-indigo-300 flex items-center space-x-2">
                        <Music className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate font-medium">URL âm thanh đã sẵn sàng</span>
                      </div>
                    ) : (
                      <div className="p-2 bg-zinc-900/50 border border-zinc-800/60 rounded-lg text-[10px] text-zinc-500 text-center">
                        Dán liên kết tệp .mp3 / .wav trực tiếp từ server
                      </div>
                    )}
                  </div>
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

              {urlInput && extractYouTubeId(urlInput) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed space-y-1">
                  <p className="font-semibold text-amber-300">💡 Lưu ý về Video YouTube Chế độ Riêng tư:</p>
                  <p>
                    YouTube <b>không cho phép nhúng (embed)</b> các video cài đặt chế độ <b>&quot;Riêng tư&quot; (Private)</b>. Để phát được trên ứng dụng, vui lòng đổi quyền riêng tư của video trên YouTube thành <b>&quot;Công khai&quot; (Public)</b> hoặc <b>&quot;Không công khai&quot; (Unlisted)</b>.
                  </p>
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-400">
                  Tiêu đề <span className="text-rose-400">*</span>
                </label>
                {activeTab === 'url' && urlInput.trim() && (
                  <button
                    type="button"
                    onClick={() => fetchTitleFromUrl(urlInput.trim())}
                    disabled={isFetchingTitle}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>{isFetchingTitle ? 'Đang lấy tiêu đề...' : '✨ Tự động lấy tiêu đề'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Nhập tên nội dung (hoặc tự động lấy từ YouTube)..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
              {isFetchingTitle && (
                <p className="text-[10px] text-indigo-400 mt-1 flex items-center space-x-1 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>Đang tự động truy xuất tiêu đề video từ YouTube/Web...</span>
                </p>
              )}
              {!isFetchingTitle && fetchedTitleSuccess && (
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Đã tự động lấy tiêu đề! Bạn vẫn có thể tự chỉnh sửa lại nếu muốn.</span>
                </p>
              )}
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
                  Bộ sưu tập / Danh sách phát
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Không phân loại</option>
                  <optgroup label="Danh Sách Phát Mặc Định">
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </optgroup>
                  {getCustomPlaylists().length > 0 && (
                    <optgroup label="Danh Sách Phát Tùy Chỉnh">
                      {getCustomPlaylists().map((pl) => (
                        <option key={pl.id} value={pl.id}>{pl.name}</option>
                      ))}
                    </optgroup>
                  )}
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
