import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export const useJioSaavnSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query) return [];

    setIsSearching(true);
    setError(null);

    try {
      // Create a mock search response during development if CORS fails or we are in a pure SPA dev mode
      // However, we can try to use a reliable proxy like allorigins with jsonp format
      // AllOrigins JSONP wrapper
      const targetUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&n=10&p=1&_marker=0&ctx=web6dot0&q=${encodeURIComponent(query)}`;

      let data;
      const isNative = Capacitor.isNativePlatform();

      if (!isNative) {
         console.log('Fetching via proxy on Web...');
         const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
         const response = await fetch(proxyUrl);
         if (!response.ok) throw new Error(`Proxy Error: ${response.statusText}`);

         data = await response.json();
      } else {
          // Native fetch for Capacitor Prod/Dev
          console.log('Fetching natively...');
          const response = await fetch(targetUrl);
          if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
          data = await response.json();
      }

      console.log('Search response data:', data);

      // The old API sometimes returns the array directly or in a results object
      let resultsArray = [];
      if (Array.isArray(data)) {
         resultsArray = data;
      } else if (data.results && Array.isArray(data.results)) {
         resultsArray = data.results;
      } else if (data.songs && Array.isArray(data.songs)) {
         resultsArray = data.songs;
      } else if (typeof data === 'object') {
         // Some versions of the API return an object where keys are indices
         const possibleKeys = Object.keys(data).filter(k => !isNaN(Number(k)));
         if (possibleKeys.length > 0) {
             resultsArray = possibleKeys.map(k => data[k]);
         }
      }

      console.log('Parsed results array:', resultsArray);

      if (resultsArray.length === 0) {
        return [];
      }

      const results = resultsArray.map((song: any) => {
        // High resolution thumbnail
        const highResThumb = song.image ? song.image.replace('150x150', '500x500').replace('50x50', '500x500') : '';

        // Extract artist safely
        let artistName = song.singers || song.primary_artists || '';
        if (song.more_info?.artistMap?.primary_artists && song.more_info.artistMap.primary_artists.length > 0) {
            artistName = song.more_info.artistMap.primary_artists.map((a: any) => a.name).join(', ');
        } else if (song.more_info?.music) {
            artistName = song.more_info.music;
        } else if (song.subtitle) {
            artistName = song.subtitle;
        }

        let streamUrl = '';
        if (song.media_preview_url) {
            let qualityUrl = song.media_preview_url.replace('preview.saavncdn.com', 'aac.saavncdn.com');
            qualityUrl = qualityUrl.replace(/_96(\.mp4|\.m4a|\.mp3)$/, '_320$1');
            streamUrl = qualityUrl;
        } else if (song.more_info?.vlink) {
             streamUrl = song.more_info.vlink;
        } else if (song.more_info?.encrypted_media_url) {
             // In case there is no preview URL in search, this is a fallback.
             // Normally this shouldn't happen with the current search endpoint format.
        }

        return {
          videoId: song.id, // Using JioSaavn ID
          title: song.song || song.title,
          artist: artistName,
          thumbnailUrl: highResThumb,
          streamUrl: streamUrl,
        };
      });

      return results;
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || "Failed to search JioSaavn");
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { search, isSearching, error };
};
