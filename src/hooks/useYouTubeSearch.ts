import { useState, useEffect, useCallback } from 'react';
import { Innertube, UniversalCache } from 'youtubei.js';
import localforage from 'localforage';

// Global instance to reuse across renders
let ytInstance: Innertube | null = null;
let initPromise: Promise<Innertube> | null = null;

const getYouTubeInstance = async () => {
  if (ytInstance) return ytInstance;
  if (initPromise) return initPromise;

  initPromise = Innertube.create({
    cache: new UniversalCache(true), // We'll just use the default internal IndexedDB cache that UniversalCache implements when available, passing an object causes type errors
    generate_session_locally: true,
    clientType: 'WEB' // We use WEB for browser compatibility, could also try TV if there are issues
  }).then(instance => {
    ytInstance = instance;
    return instance;
  });

  return initPromise;
};


export const useYouTubeSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start initialization early
  useEffect(() => {
    getYouTubeInstance()
      .then(() => setIsInitializing(false))
      .catch(e => {
        console.error("Failed to initialize Innertube:", e);
        setError("Failed to initialize search engine.");
        setIsInitializing(false);
      });
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query) return [];

    setIsSearching(true);
    setError(null);

    try {
      const yt = await getYouTubeInstance();
      const searchResults = await yt.search(query);

      // Filter out non-video results and get top 10
      const topResults = searchResults.videos
        .filter((item: any) => item.type === 'Video')
        .slice(0, 10)
        .map((video: any) => {
          // Get highest resolution thumbnail
          const highResThumb = video.thumbnails?.sort((a: any, b: any) => b.width - a.width)[0]?.url || '';

          return {
            videoId: video.id,
            title: video.title?.text || '',
            artist: video.author?.name || '',
            duration: video.duration?.text || '',
            thumbnailUrl: highResThumb,
          };
        });

      return topResults;
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || "Failed to search YouTube");
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { search, isSearching, isInitializing, error };
};
