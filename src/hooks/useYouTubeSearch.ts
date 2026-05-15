import { useState, useCallback } from 'react';
import { searchYouTubeMusic } from '../utils/youtube';
import type { SearchResultItem } from '../types';
import { Logger } from '../utils/logger';

export const useYouTubeSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filter: string = 'songs'): Promise<SearchResultItem[]> => {
    if (!query) return [];

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchYouTubeMusic(query, filter);
      return results;
    } catch (err: any) {
      Logger.error('YouTube Search error:', err);
      setError(err.message || "Failed to search YouTube");
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { search, isSearching, error };
};
