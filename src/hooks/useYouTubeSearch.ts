import { useState, useCallback } from 'react';
import { searchYouTubeMusic } from '../utils/youtube';
import type { Song } from '../types';

export const useYouTubeSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string): Promise<Song[]> => {
    if (!query) return [];

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchYouTubeMusic(query);
      return results;
    } catch (err: any) {
      console.error('YouTube Search error:', err);
      setError(err.message || "Failed to search YouTube");
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { search, isSearching, error };
};
