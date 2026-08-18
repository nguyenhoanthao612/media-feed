'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MediaItem } from '@/types/media';
import { formatDuration } from '@/lib/media-detector';
import { extractYouTubeId, getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/youtube';
import { 
  Play, Pause, Volume2, VolumeX, Heart, MoreVertical, 
  RotateCw, Music, Video, Image as ImageIcon, ExternalLink, 
  Maximize, Tag, Trash2, Edit3, ListMusic, AlertTriangle, RefreshCw, 
  Check, Share2, Sparkles 
} from 'lucide-react';

interface MediaCardProps {
  item: MediaItem;
  isActive: boolean;
  continuousPlay: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onEnded: () => void;
  onFavoriteToggle: (id: string) => void;
  onSelectTag?: (tag: string) => void;
  onOpenQueue?: () => void;
  onEdit?: (item: MediaItem) => void;
  onDelete?: (id: string) => void;
  onToggleContinuousPlay?: () => void;
}

// Helper to test if a URL is an image file
function isImageUrl(url?: string): boolean {
  if (!url) return false;
  if (url.includes('images.unsplash.com')) return true;
  if (/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i.test(url)) return true;
  return false;
}

// Helper to resolve valid audio source URL
function getAudioSrc(item: MediaItem): string | undefined {
  if (item.audioUrl && !isImageUrl(item.audioUrl)) return item.audioUrl;
  if (item.type === 'audio' || item.type === 'image_audio') {
    if (item.previewUrl && !isImageUrl(item.previewUrl)) return item.previewUrl;
    if (item.sourceUrl && !isImageUrl(item.sourceUrl)) return item.sourceUrl;
  }
  return undefined;
}

// Helper to resolve valid video source URL
function getVideoSrc(item: MediaItem): string | undefined {
  if (item.type !== 'video') return undefined;
  if (item.sourceUrl && isYouTubeUrl(item.sourceUrl)) return undefined;
  if (item.previewUrl && isYouTubeUrl(item.previewUrl)) return undefined;
  if (item.previewUrl && !isImageUrl(item.previewUrl)) return item.previewUrl;
  if (item.sourceUrl && !isImageUrl(item.sourceUrl)) return item.sourceUrl;
  return undefined;
}

export function MediaCard({
  item,
  isActive,
  continuousPlay,
  isMuted,
  onToggleMute,
  onEnded,
  onFavoriteToggle,
  onSelectTag,
  onOpenQueue,
  onEdit,
  onDelete,
  onToggleContinuousPlay
}: MediaCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 0);
  const [hasAutoplayError, setHasAutoplayError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [initialMuted] = useState(isMuted);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const youtubeId = extractYouTubeId(item.sourceUrl || item.previewUrl || '');
  const isYouTube = Boolean(youtubeId);
  const videoSrc = getVideoSrc(item);
  const audioSrc = getAudioSrc(item);

  // Stable YouTube embed URL to avoid recreating iframe DOM and reloading on active switch
  const youtubeEmbedUrl = useMemo(() => {
    if (!youtubeId) return '';
    return getYouTubeEmbedUrl(youtubeId, true, true);
  }, [youtubeId]);

  // Auto hide controls overlay after 3.5s of inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Synchronize playback active state
  useEffect(() => {
    if (!isActive) {
      // Pause active element when card leaves active viewport
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (iframeRef.current?.contentWindow && isYouTube) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
            '*'
          );
        } catch {}
      }
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current);
      }
      return;
    }

    // Item becomes active -> start playing immediately without delay
    if (item.type === 'video' && videoRef.current) {
      if (videoRef.current.ended) {
        videoRef.current.currentTime = 0;
      }
      videoRef.current.muted = isMutedRef.current;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasAutoplayError(false);
            setLoadError(false);
          })
          .catch((err) => {
            console.warn('Autoplay blocked for video, falling back to muted autoplay:', err);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().then(() => {
                setIsPlaying(true);
                setHasAutoplayError(false);
              }).catch(() => {
                setIsPlaying(false);
              });
            }
          });
      }
    } else if ((item.type === 'audio' || item.type === 'image_audio') && audioRef.current) {
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.muted = isMutedRef.current;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasAutoplayError(false);
            setLoadError(false);
          })
          .catch((err) => {
            console.warn('Autoplay blocked for audio, falling back to muted autoplay:', err);
            if (audioRef.current) {
              audioRef.current.muted = true;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                setHasAutoplayError(false);
              }).catch(() => {
                setIsPlaying(false);
              });
            }
          });
      }
    } else if ((item.type === 'external_video' || isYouTube) && iframeRef.current?.contentWindow) {
      const sendPlayCommand = () => {
        try {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: isMuted ? 'mute' : 'unMute', args: [] }),
            '*'
          );
        } catch {}
      };
      sendPlayCommand();
      // Rapid retry to guarantee YouTube player receives play command immediately without delay
      const t1 = setTimeout(sendPlayCommand, 120);
      const t2 = setTimeout(sendPlayCommand, 300);
      setIsPlaying(true);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (item.type === 'image') {
      // For pure image cards, simulate a viewing duration (default 8s) if continuous play is ON
      if (continuousPlay) {
        if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        imageTimerRef.current = setTimeout(() => {
          onEnded();
        }, (item.duration || 8) * 1000);
      }
    }

    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [isActive, item, isYouTube, isMuted, continuousPlay, onEnded]);

  // Keep playback running when tab becomes visible again
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (item.type === 'video' && videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        } else if ((item.type === 'audio' || item.type === 'image_audio') && audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        } else if ((item.type === 'external_video' || isYouTube) && iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
              '*'
            );
          } catch {}
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, item.type, isYouTube]);

  // Sync volume & mute state when global mute toggles
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    if (iframeRef.current?.contentWindow && isYouTube) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isMuted ? 'mute' : 'unMute',
            args: [],
          }),
          '*'
        );
      } catch {
        // ignore
      }
    }
  }, [isMuted, isYouTube]);

  // Handle Play/Pause toggle manually
  const togglePlayPause = () => {
    if (item.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } else if ((item.type === 'audio' || item.type === 'image_audio') && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } else if (item.type === 'image') {
      setIsPlaying(!isPlaying);
    }
  };

  // Handle Seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  // Handle Video / Audio Time Update
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    const target = e.currentTarget;
    setCurrentTime(target.currentTime);
    if (target.duration && !isNaN(target.duration)) {
      setDuration(target.duration);
    }
  };

  // Handle Media Completion
  const handleMediaEnded = useCallback(() => {
    setIsPlaying(false);
    onEnded();
  }, [onEnded]);

  // Listen to YouTube postMessage events when active
  useEffect(() => {
    if (!isActive || !isYouTube) return;

    const postListening = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
        } catch {
          // ignore
        }
      }
    };

    postListening();
    const interval = setInterval(postListening, 2000);

    const handleWindowMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (!data) return;

        const state = data.info?.playerState !== undefined ? data.info.playerState : data.info;
        const isEnded =
          (data.event === 'onStateChange' && (state === 0 || state === '0')) ||
          (data.event === 'infoDelivery' && (state === 0 || state === '0'));

        if (isEnded) {
          handleMediaEnded();
        }
      } catch {
        // ignore non-json messages
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [isActive, isYouTube, handleMediaEnded]);

  // Fullscreen video toggle
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    const url = item.sourceUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div 
      className="snap-feed-item relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-1rem)] max-w-lg mx-auto bg-zinc-950 text-zinc-100 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col justify-between my-2 group select-none"
      onMouseMove={handleMouseMove}
    >
      {/* --- MEDIA CONTENT PLAYER LAYER --- */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
        {/* 1. VIDEO PLAYER */}
        {item.type === 'video' && !loadError && videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={item.thumbnailUrl}
            playsInline
            preload="auto"
            loop={!continuousPlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleMediaEnded}
            onError={() => setLoadError(true)}
            onClick={togglePlayPause}
            className="w-full h-full object-cover cursor-pointer"
          />
        )}

        {/* 2. AUDIO PLAYER (Visualizer Card) */}
        {item.type === 'audio' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 overflow-hidden">
            {/* Background Image blur glow */}
            {item.thumbnailUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 blur-2xl transform scale-125"
                style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
              />
            )}

            {/* Vinyl Record / Album Art Visualizer */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full border-4 border-zinc-800 shadow-2xl bg-zinc-900 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                {/* Vinyl Record */}
                <div className={`absolute inset-0 bg-zinc-900 rounded-full border-8 border-zinc-950 flex items-center justify-center ${isPlaying ? 'animate-vinyl' : 'animate-vinyl animate-vinyl-paused'}`}>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 p-1 flex items-center justify-center shadow-lg">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Music className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Animated Waveform Indicator */}
              <div className="flex items-center space-x-1.5 h-10 px-4 py-2 bg-zinc-900/80 backdrop-blur-md rounded-full border border-zinc-800/80 shadow-lg">
                <span className={`w-1 bg-indigo-500 rounded-full ${isPlaying ? 'wave-bar-1' : 'h-2'}`} />
                <span className={`w-1 bg-indigo-400 rounded-full ${isPlaying ? 'wave-bar-2' : 'h-3'}`} />
                <span className={`w-1 bg-purple-500 rounded-full ${isPlaying ? 'wave-bar-3' : 'h-5'}`} />
                <span className={`w-1 bg-pink-500 rounded-full ${isPlaying ? 'wave-bar-4' : 'h-3'}`} />
                <span className={`w-1 bg-rose-400 rounded-full ${isPlaying ? 'wave-bar-5' : 'h-2'}`} />
                <span className="text-xs font-mono font-medium text-zinc-300 ml-2">
                  {isPlaying ? 'Đang phát âm thanh...' : 'Đang tạm dừng'}
                </span>
              </div>
            </div>

            {!loadError && audioSrc && (
              <audio
                ref={audioRef}
                src={audioSrc}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleMediaEnded}
                onError={() => setLoadError(true)}
              />
            )}
          </div>
        )}

        {/* 3. IMAGE CARD */}
        {item.type === 'image' && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={item.previewUrl || item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-contain max-h-full transition-transform duration-700 ease-out"
            />
          </div>
        )}

        {/* 4. IMAGE + AUDIO CARD */}
        {item.type === 'image_audio' && (
          <div className="relative w-full h-full flex flex-col justify-between bg-black overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={item.previewUrl || item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-1000 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/20" />
            </div>

            {/* Floating Audio Playing Badge */}
            <div className="relative z-10 top-4 left-4 self-start px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center space-x-2">
              <Music className={`w-4 h-4 text-rose-400 ${isPlaying ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-medium text-zinc-200">Âm thanh đi kèm</span>
            </div>

            {!loadError && audioSrc && (
              <audio
                ref={audioRef}
                src={audioSrc}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleMediaEnded}
                onError={() => setLoadError(true)}
              />
            )}
          </div>
        )}

        {/* 5. YOUTUBE / EXTERNAL VIDEO EMBED */}
        {(item.type === 'external_video' || isYouTube) && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
            {youtubeId ? (
              <iframe
                ref={iframeRef}
                src={youtubeEmbedUrl}
                title={item.title}
                onLoad={() => {
                  if (iframeRef.current?.contentWindow) {
                    try {
                      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
                      iframeRef.current.contentWindow.postMessage(
                        JSON.stringify({
                          event: 'command',
                          func: isMuted ? 'mute' : 'unMute',
                          args: [],
                        }),
                        '*'
                      );
                      if (isActive) {
                        iframeRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                          '*'
                        );
                      } else {
                        iframeRef.current.contentWindow.postMessage(
                          JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                          '*'
                        );
                      }
                    } catch {}
                  }
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0 pointer-events-auto"
              />
            ) : (
              <div className="p-6 text-center space-y-3 bg-zinc-900/90 rounded-xl border border-zinc-800 m-4">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="font-semibold text-zinc-200">Không thể nhúng video này</h4>
                <p className="text-xs text-zinc-400">Video có thể ở chế độ riêng tư hoặc cấm nhúng trên trang khác.</p>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors"
                  >
                    <span>Mở trên YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* ERROR STATE */}
        {loadError && (
          <div className="absolute inset-0 z-20 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-rose-500 animate-pulse" />
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Không thể tải nội dung này</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">Tệp media có thể không hợp lệ hoặc đường dẫn URL đã hết hạn.</p>
            </div>
            <button
              onClick={() => {
                setLoadError(false);
                if (videoRef.current) videoRef.current.load();
                if (audioRef.current) audioRef.current.load();
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* AUTOPLAY BLOCKED BANNER */}
        {hasAutoplayError && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30">
            <button
              onClick={() => {
                onToggleMute();
                setHasAutoplayError(false);
              }}
              className="px-4 py-2 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-medium text-xs shadow-xl backdrop-blur-md border border-rose-400/30 flex items-center space-x-2 animate-bounce"
            >
              <Volume2 className="w-4 h-4" />
              <span>Bật âm thanh (Unmute)</span>
            </button>
          </div>
        )}
      </div>

      {/* --- OVERLAY GRADIENTS & HEADERS --- */}
      <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

      {/* TOP BAR: TYPE BADGE & CONTINUOUS PLAY INDICATOR */}
      <div className="relative z-20 top-0 inset-x-0 p-4 flex items-center justify-between pointer-events-auto">
        {/* Media Type Badge */}
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 text-[11px] font-medium text-zinc-200 flex items-center space-x-1.5 shadow-md">
            {item.type === 'video' && <Video className="w-3.5 h-3.5 text-blue-400" />}
            {item.type === 'audio' && <Music className="w-3.5 h-3.5 text-emerald-400" />}
            {item.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-purple-400" />}
            {item.type === 'image_audio' && <Sparkles className="w-3.5 h-3.5 text-rose-400" />}
            {item.type === 'external_video' && <ExternalLink className="w-3.5 h-3.5 text-red-400" />}
            <span className="capitalize">
              {item.type === 'video' && 'Video'}
              {item.type === 'audio' && 'Âm thanh'}
              {item.type === 'image' && 'Hình ảnh'}
              {item.type === 'image_audio' && 'Ảnh + Âm thanh'}
              {item.type === 'external_video' && 'YouTube / Link'}
            </span>
          </span>
        </div>

        {/* Continuous Play Toggle Badge */}
        <button
          onClick={onToggleContinuousPlay}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center space-x-1.5 border shadow-md ${
            continuousPlay 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:bg-zinc-700/80'
          }`}
          title="Bật/Tắt chế độ phát liên tục khi kết thúc media"
        >
          <RotateCw className={`w-3 h-3 ${continuousPlay ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span>Continuous: {continuousPlay ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* --- RIGHT ACTION BAR (TikTok / Shorts Floating Controls) --- */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center space-y-4 pointer-events-auto">
        {/* Favorite Heart Button */}
        <button
          onClick={() => onFavoriteToggle(item.id)}
          className="group/btn flex flex-col items-center space-y-1 transition-transform active:scale-90"
        >
          <div className={`p-3 rounded-full backdrop-blur-md border shadow-lg transition-colors ${
            item.favorite 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-500' 
              : 'bg-black/50 border-white/10 text-zinc-300 hover:text-white hover:bg-black/70'
          }`}>
            <Heart className={`w-6 h-6 ${item.favorite ? 'fill-rose-500' : ''}`} />
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 shadow-sm">
            {item.favorite ? 'Yêu thích' : 'Lưu'}
          </span>
        </button>

        {/* Mute/Unmute Volume Button */}
        <button
          onClick={onToggleMute}
          className="group/btn flex flex-col items-center space-y-1 transition-transform active:scale-90"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white hover:bg-black/70 shadow-lg">
            {isMuted ? <VolumeX className="w-6 h-6 text-rose-400" /> : <Volume2 className="w-6 h-6 text-emerald-400" />}
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 shadow-sm">
            {isMuted ? 'Muted' : 'Âm thanh'}
          </span>
        </button>

        {/* Queue Button */}
        {onOpenQueue && (
          <button
            onClick={onOpenQueue}
            className="group/btn flex flex-col items-center space-y-1 transition-transform active:scale-90"
          >
            <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white hover:bg-black/70 shadow-lg">
              <ListMusic className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-300 shadow-sm">
              Hàng chờ
            </span>
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="group/btn flex flex-col items-center space-y-1 transition-transform active:scale-90"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white hover:bg-black/70 shadow-lg">
            {copiedLink ? <Check className="w-6 h-6 text-emerald-400" /> : <Share2 className="w-6 h-6" />}
          </div>
          <span className="text-[10px] font-semibold text-zinc-300 shadow-sm">
            {copiedLink ? 'Đã chép' : 'Chia sẻ'}
          </span>
        </button>

        {/* More Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white hover:bg-black/70 shadow-lg transition-transform active:scale-90"
          >
            <MoreVertical className="w-6 h-6" />
          </button>

          {/* Context Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 bottom-12 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
              {isYouTube && item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-indigo-300 hover:text-white hover:bg-indigo-600/20 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  <span>Mở trên YouTube</span>
                </a>
              )}
              {onEdit && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(item);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(item.id);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa khỏi Feed</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- BOTTOM CONTENT INFO & SEEK BAR --- */}
      <div className="relative z-20 p-5 pointer-events-auto space-y-3">
        {/* Title & Description */}
        <div className="max-w-[80%] space-y-1">
          <h3 className="text-base md:text-lg font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-zinc-300/90 line-clamp-2 drop-shadow-sm font-normal">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTag && onSelectTag(tag)}
                  className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SEEK / PROGRESS BAR (for Video & Audio) */}
        {(item.type === 'video' || item.type === 'audio' || item.type === 'image_audio') && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
              />

              <div className="text-[11px] font-mono text-zinc-300 min-w-[70px] text-right">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </div>

              {item.type === 'video' && (
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  title="Toàn màn hình"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
