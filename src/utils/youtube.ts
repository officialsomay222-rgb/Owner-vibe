import type { Song } from '../types';

const VEROME_API_BASE_URL = 'https://verome-api.deno.dev';

/**
 * Searches YouTube Music for a given query using the Verome API and maps it to the generic Song type.
 */
export async function searchYouTubeMusic(query: string): Promise<Song[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`${VEROME_API_BASE_URL}/api/search?q=${encodedQuery}&filter=songs`);

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    const songs: Song[] = [];

    for (const item of data.results) {
      if (!item.videoId || !item.title) continue;

      const title = item.title;
      // Get the first artist name, fallback to Unknown Artist
      const artist = (item.artists && item.artists.length > 0) ? item.artists[0].name : 'Unknown Artist';

      let thumbnailUrl = '';
      if (item.thumbnails && item.thumbnails.length > 0) {
        // Fallback to the largest/last thumbnail if possible
        thumbnailUrl = item.thumbnails[item.thumbnails.length - 1].url.replace(/=w\d+-h\d+-l90-rj/, '=w1080-h1080-l90-rj').replace(/=w\d+-h\d+$/, '=w1080-h1080');
      }

      // Use fallback videoId if provided (as standard in Verome-API for better playback stability)
      const finalVideoId = item.fallbackVideoId || item.videoId;
      const finalTitle = item.fallbackTitle || title;

      songs.push({
        videoId: finalVideoId,
        title: finalTitle,
        artist: artist,
        thumbnailUrl: thumbnailUrl,
        duration: item.duration || '',
      });
    }

    return songs;
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
