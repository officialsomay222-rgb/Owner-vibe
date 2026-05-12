import type { Song, SearchResultItem } from '../types';

const VEROME_API_BASE_URL = 'https://verome-api.deno.dev';

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
    console.error('Failed to search via Verome API:', err);
    return [];
  }
}

/**
 * Gets the raw stream URL for playback natively in Capacitor via Verome API.
 * Prioritizes the highest bitrate M4A (mp4a/audio/mp4) audio for WebView compatibility.
 */
export async function getYouTubeAudioStream(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(`${VEROME_API_BASE_URL}/api/stream?id=${encodeURIComponent(videoId)}`);

    if (!response.ok) {
      throw new Error(`Stream fetch failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.streamingUrls || data.streamingUrls.length === 0) {
      return null;
    }

    // Filter for audio/mp4 (M4A) and sort by bitrate descending
    const mp4Streams = data.streamingUrls
      .filter((s: any) => s.mimeType && s.mimeType.includes('audio/mp4'))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    if (mp4Streams.length > 0) {
      return mp4Streams[0].url;
    }

    // Fallback: Just return the highest bitrate audio available
    const anyStream = [...data.streamingUrls].sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    return anyStream.length > 0 ? anyStream[0].url : null;

  } catch (err) {
    console.error(`Failed to get audio stream from Verome API for ${videoId}:`, err);
    return null;
  }
}
