import { Innertube, UniversalCache } from 'youtubei.js';
import type { Song } from '../types';

let innertubeInstance: Innertube | null = null;

/**
 * Initializes the YouTube.js Innertube instance using a UniversalCache
 * to speed up subsequent loads by caching cipher routines.
 */
export async function getYouTube(): Promise<Innertube> {
  if (innertubeInstance) {
    return innertubeInstance;
  }

  innertubeInstance = await Innertube.create({
    // Using an explicit cache or false prevents 'LOGIN_REQUIRED'/'Streaming data not available' errors
    // which occur when the default UniversalCache saves a bad session state.
    cache: new UniversalCache(false),
    generate_session_locally: true,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      // CapacitorHttp intercepts window.fetch, so using the browser's default fetch
      // here ensures native requests are proxied via Capacitor without CORS issues.
      return fetch(input, init);
    }
  });

  return innertubeInstance;
}

/**
 * Searches YouTube for a given query and maps it to the generic Song type.
 */
export async function searchYouTubeMusic(query: string): Promise<Song[]> {
  try {
    const yt = await getYouTube();

    // We use standard youtube search because yt.music.search frequently returns empty content
    // or requires complex parsing that breaks easily depending on the query/client.
    const search = await yt.search(query);

    if (!search.videos || search.videos.length === 0) {
      return [];
    }

    const songs: Song[] = [];

    for (const videoItem of search.videos) {
      // Cast to any to bypass strict union type checking from youtubei.js
      const video = videoItem as any;
      if (!video.id || !video.title) continue;

      const videoId = video.id as string;
      const title = video.title?.text || (typeof video.title === 'string' ? video.title : 'Unknown Title');
      const artist = video.author?.name || 'Unknown Artist';
      const duration = video.duration?.text || '';
      const thumbnails = video.thumbnails || [];

      // Get the best thumbnail
      let thumbnailUrl = '';
      if (thumbnails.length > 0) {
        thumbnailUrl = thumbnails[thumbnails.length - 1].url;
      }

      if (videoId && title) {
        songs.push({
          videoId: videoId,
          title: title,
          artist: artist,
          thumbnailUrl: thumbnailUrl,
          duration: duration
        });
      }
    }

    return songs;
  } catch (err) {
    console.error('Failed to search YouTube:', err);
    return [];
  }
}

/**
 * Gets the raw stream URL for playback natively in Capacitor.
 * Prioritizes the highest bitrate M4A (mp4a) audio for WebView compatibility.
 */
export async function getYouTubeAudioStream(videoId: string): Promise<string | null> {
  try {
    const yt = await getYouTube();

    // We specifically use 'IOS' client_type for streaming to avoid signature/URL issues
    const info = await yt.getBasicInfo(videoId, { client: 'IOS' });

    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    const url = await format?.decipher(yt.session.player);
    return url || null;

  } catch (err) {
    console.error(`Failed to get YouTube audio stream for ${videoId}:`, err);
    return null;
  }
}
