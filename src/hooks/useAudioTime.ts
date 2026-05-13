import { useState, useEffect, RefObject } from 'react';

export const useAudioTime = (audioRef: RefObject<HTMLAudioElement>) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };

    const resetTime = () => {
      setCurrentTime(0);
      setDuration(0);
    };

    // Attach listeners
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('emptied', resetTime);
    audio.addEventListener('loadstart', resetTime);

    // Initial sync
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('emptied', resetTime);
      audio.removeEventListener('loadstart', resetTime);
    };
  }, [audioRef]);

  return { currentTime, duration };
};
