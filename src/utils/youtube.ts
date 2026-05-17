import type { SearchResultItem } from '../types';
import { Logger } from './logger';

const VEROME_API_BASE_URL = 'https://verome-api.deno.dev';

// Cache to prevent redundant stream API requests for previously played songs
// Caches expire after 1 hour (3600000 ms) since signed URLs often expire
const streamUrlCache = new Map<string, { urls: string[], timestamp: number }>();
const CACHE_TTL = 3600000;

/**
 * Searches YouTube Music for a given query using the Verome API and maps it to a unified SearchResultItem type.
 */
export async function searchYouTubeMusic(query: string, filter: string = 'songs'): Promise<SearchResultItem[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    let url = `${VEROME_API_BASE_URL}/api/search?q=${encodedQuery}`;

    // Verome API uses empty filter or omits filter for 'All'
    if (filter && filter.toLowerCase() !== 'all') {
        url += `&filter=${encodeURIComponent(filter.toLowerCase())}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    const items: SearchResultItem[] = [];

    for (const item of data.results) {
      if (!item.title) continue;

      const title = item.title;
      // Get the first artist name, fallback to Unknown Artist for songs/albums
      // For artists themselves, they usually don't have an artists array, the title is their name.
      let artist = 'Unknown Artist';
      if (item.artists && item.artists.length > 0) {
          artist = item.artists.map((a: any) => a.name).join(', ');
      } else if (item.resultType === 'artist') {
          artist = 'Artist';
      } else if (item.author) {
          artist = item.author;
      }

      let thumbnailUrl = '';
      if (item.thumbnails && item.thumbnails.length > 0) {
        // Fallback to the largest/last thumbnail if possible
        thumbnailUrl = item.thumbnails[item.thumbnails.length - 1].url.replace(/=w\d+-h\d+-l90-rj/, '=w1080-h1080-l90-rj').replace(/=w\d+-h\d+$/, '=w1080-h1080');
      }

      const type = item.resultType || 'song';
      let id = '';

      if (type === 'song' || type === 'video') {
         id = item.fallbackVideoId || item.videoId;
      } else {
         id = item.browseId || item.playlistId;
      }

      if (!id) continue;

      const finalTitle = item.fallbackTitle || title;

      items.push({
        type: type,
        id: id,
        title: finalTitle,
        artist: artist,
        thumbnailUrl: thumbnailUrl,
        duration: item.duration || '',
      });
    }

    return items;
  } catch (err) {
    Logger.error('Failed to search via Verome API:', err);
    return [];
  }
}

/**
 * Gets the raw stream URL for playback natively in Capacitor via Verome API.
 * Uses the requested audio quality preference from local storage.
 */
export async function getYouTubeAudioStream(videoId: string): Promise<string[]> {
  let audioQuality = 'normal';
  try {
    const stored = window.localStorage.getItem('owners_vibe_audio_quality');
    if (stored) {
      audioQuality = JSON.parse(stored);
    }
  } catch (e) {
    Logger.warn('Failed to parse audio quality from localStorage', e);
  }

  const cacheKey = `${videoId}_${audioQuality}`;
  const cached = streamUrlCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.urls;
  }

  try {
    const response = await fetch(`${VEROME_API_BASE_URL}/api/stream?id=${encodeURIComponent(videoId)}`);

    if (!response.ok) {
      throw new Error(`Stream fetch failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.streamingUrls || data.streamingUrls.length === 0) {
      return [];
    }

    let targetItag = 140; // Default to normal
    if (audioQuality === 'low') {
      targetItag = 249;
    } else if (audioQuality === 'high') {
      targetItag = 251;
    }

    const extractItag = (streamUrl: string) => {
      try {
        const urlObj = new URL(streamUrl);
        const itag = urlObj.searchParams.get('itag');
        return itag ? parseInt(itag, 10) : null;
      } catch (e) {
        return null;
      }
    };

    const fallbackUrls: string[] = [];

    // Prioritize streams matching the target itag
    const targetStreams = data.streamingUrls.filter((s: any) => extractItag(s.url || s.directUrl) === targetItag);
    for (const s of targetStreams) {
      const url = s.url || s.directUrl;
      if (url && !fallbackUrls.includes(url)) fallbackUrls.push(url);
    }

    // Add fallback itag 140 (normal) if target wasn't 140
    if (targetItag !== 140) {
      const normalStreams = data.streamingUrls.filter((s: any) => extractItag(s.url || s.directUrl) === 140);
      for (const s of normalStreams) {
        const url = s.url || s.directUrl;
        if (url && !fallbackUrls.includes(url)) fallbackUrls.push(url);
      }
    }

    // Add all other remaining streams
    for (const s of data.streamingUrls) {
      const url = s.url || s.directUrl;
      if (url && !fallbackUrls.includes(url)) fallbackUrls.push(url);
    }

    if (fallbackUrls.length > 0) {
      streamUrlCache.set(cacheKey, { urls: fallbackUrls, timestamp: Date.now() });
    }

    return fallbackUrls;

  } catch (err) {
    Logger.error(`Failed to get audio stream from Verome API for ${videoId}:`, err);
    return [];
  }
}
