import { useState, useEffect, RefObject } from 'react';

/**
 * Custom hook to track audio playback time locally.
 *
 * ⚡ OPTIMIZATION: Moving `currentTime` state out of the global MusicContext and into
 * this local hook prevents the entire app (and heavy components like tabs) from
 * re-rendering 4 times per second during audio playback.
 */
export const useAudioTime = (audioRef: RefObject<HTMLMediaElement | null>) => {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('seeked', updateTime);
    audio.addEventListener('loadeddata', updateTime);

    // Initial sync
    updateTime();

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('seeked', updateTime);
      audio.removeEventListener('loadeddata', updateTime);
    };
  }, [audioRef]);

  return currentTime;
};
