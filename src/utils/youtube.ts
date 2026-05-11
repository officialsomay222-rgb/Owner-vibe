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
    cache: new UniversalCache(true),
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
 * Searches YouTube Music for a given query and maps it to the generic Song type.
 */
export async function searchYouTubeMusic(query: string): Promise<Song[]> {
  try {
    const yt = await getYouTube();

    // We search youtube music
    const search = await yt.music.search(query, { type: 'song' });

    if (!search.contents || search.contents.length === 0) {
      return [];
    }

    // `contents` is typically an array of Sections, and each Section has `contents`
    // We only care about the first one with music items
    const songs: Song[] = [];

    // Fallback if type is song, the array structure may be direct
    const results = search.contents.flatMap(section =>
        // @ts-ignore
        section.contents || []
    );

    for (const item of results) {
        // @ts-ignore
        if (item.type === 'MusicResponsiveListItem' || item.type === 'MusicTwoRowItem') {
            const videoId = item.id;
            const title = item.title;
            const artist = item.author?.name || item.authors?.[0]?.name || 'Unknown Artist';
            const duration = item.duration?.text || '';
            const thumbnails = item.thumbnails || item.thumbnail?.contents || [];

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
    }

    return songs;
  } catch (err) {
    console.error('Failed to search YouTube Music:', err);
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
    const url = format?.decipher(yt.session.player);
    return url || null;

  } catch (err) {
    console.error(`Failed to get YouTube audio stream for ${videoId}:`, err);
    return null;
  }
}
