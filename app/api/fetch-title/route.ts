import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const cleanUrl = targetUrl.trim();

    // 1. Try YouTube oEmbed directly if it's a YouTube URL
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
      const res = await fetch(oembedUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          return NextResponse.json({
            title: data.title,
            author: data.author_name || '',
            thumbnailUrl: data.thumbnail_url || '',
            type: 'youtube',
          });
        }
      }
    }

    // 2. Try noembed.com for general video/audio sites (YouTube, Vimeo, TikTok, SoundCloud, etc.)
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`;
    const noembedRes = await fetch(noembedUrl, { cache: 'no-store' });
    if (noembedRes.ok) {
      const data = await noembedRes.json();
      if (data.title) {
        return NextResponse.json({
          title: data.title,
          author: data.author_name || '',
          thumbnailUrl: data.thumbnail_url || '',
          type: data.provider_name || 'external',
        });
      }
    }

    // 3. Fallback: Fetch raw HTML and extract <title> or og:title
    const pageRes = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(4000), // 4s timeout
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      // Match <meta property="og:title" content="..." />
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      
      if (ogTitleMatch && ogTitleMatch[1]) {
        return NextResponse.json({
          title: ogTitleMatch[1].trim(),
          type: 'webpage',
        });
      }

      // Match <title>...</title>
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        return NextResponse.json({
          title: titleMatch[1].trim(),
          type: 'webpage',
        });
      }
    }

    return NextResponse.json({ error: 'Could not fetch title' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch title' }, { status: 500 });
  }
}
