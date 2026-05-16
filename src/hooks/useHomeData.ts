import { useState, useEffect } from 'react';
import { searchYouTubeMusic } from '../utils/youtube';
import type { Song, SearchResultItem } from '../types';

export interface HomeSection {
  title: string;
  items: SearchResultItem[];
}

const RANDOM_CATEGORIES = [
  'Top Funk', 'Top Bhajan', 'Trending Pop', 'Global Top 50', 'Lofi Hip Hop',
  'Punjabi Hits', 'Bollywood Top 50', 'Phonk Drift', 'Workout Hits', 'Chill Vibes'
];

function getRandomCategories(count: number) {
  const shuffled = [...RANDOM_CATEGORIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const useHomeData = (playHistory: Song[]) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const newSections: HomeSection[] = [];

        if (playHistory.length === 0) {
          // Empty history: fetch random categories
          const categories = getRandomCategories(4);
          const promises = categories.map(async (category) => {
            const results = await searchYouTubeMusic(category, 'songs');
            return { title: category, items: results };
          });

          const results = await Promise.all(promises);
          if (isMounted) {
              setSections(results.filter(r => r.items.length > 0));
          }
        } else {
          // Has history: fetch based on recent artists
          // Get unique artists from recent history (up to 3)
          const recentArtists = Array.from(new Set(playHistory.map(song => song.artist)))
            .filter(artist => artist && artist !== 'Unknown Artist')
            .slice(0, 3);

          if (recentArtists.length > 0) {
              const promises = recentArtists.map(async (artist) => {
                const results = await searchYouTubeMusic(`${artist} hits`, 'songs');
                return { title: `Because you listen to ${artist}`, items: results };
              });

              // Also add a trending or random section just to mix it up
              const randomCat = getRandomCategories(1)[0];
              const randomPromise = searchYouTubeMusic(randomCat, 'songs').then(results => ({
                  title: `Recommended: ${randomCat}`,
                  items: results
              }));
              promises.push(randomPromise);

              const results = await Promise.all(promises);
              if (isMounted) {
                  setSections(results.filter(r => r.items.length > 0));
              }
          } else {
             // Fallback if somehow history has no valid artists
             const categories = getRandomCategories(4);
             const promises = categories.map(async (category) => {
                const results = await searchYouTubeMusic(category, 'songs');
                return { title: category, items: results };
             });
             const results = await Promise.all(promises);
             if (isMounted) {
                 setSections(results.filter(r => r.items.length > 0));
             }
          }
        }
      } catch (err) {
        console.error("Failed to fetch home data", err);
      } finally {
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, [playHistory]);

  return { sections, isLoading };
};
