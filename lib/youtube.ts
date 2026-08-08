export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // Match standard query param v=
  const vParamMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // Match short urls: youtu.be/ID
  const beMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (beMatch && beMatch[1]) {
    return beMatch[1];
  }

  // Match path-based: /shorts/ID, /embed/ID, /v/ID, /live/ID
  const pathMatch = trimmed.match(/youtube\.com\/(?:shorts|embed|v|live)\/([a-zA-Z0-9_-]{11})/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Fallback pattern if ID length or formatting differs slightly
  const fallbackMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }

  return null;
}

export function getYouTubeEmbedUrl(videoId: string, autoplay = true, muted = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  });

  if (typeof window !== 'undefined' && window.location.origin) {
    params.set('origin', window.location.origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return Boolean(extractYouTubeId(url)) || url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
}
