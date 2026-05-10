import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Song } from './types';

interface MusicContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isExpanded: boolean;
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setIsExpanded: (expanded: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const safePlay = async () => {
    if (!audioRef.current) return;
    try {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('SafePlay: Playback aborted by new load request. Safely ignored.');
      } else {
        console.error('SafePlay: Actual playback error:', error);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current && currentSong?.streamUrl) {
      if (isPlaying) {
        safePlay();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong?.streamUrl]);

  useEffect(() => {
    if (audioRef.current && currentSong?.streamUrl) {
      audioRef.current.load();
    }
  }, [currentSong?.streamUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, currentSong]);

  const playSong = (song: Song, newQueue?: Song[]) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentSong(song);
    setCurrentTime(0); // Reset seeker
    if (newQueue) {
      setQueue(newQueue);
    } else if (queue.length === 0) {
      setQueue([song]);
    }
    setIsPlaying(true);

    // Auto expand the player when playing a new song
    setIsExpanded(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.videoId === currentSong.videoId);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentSong(queue[currentIndex + 1]);
      setCurrentTime(0); // Reset seeker
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.videoId === currentSong.videoId);
    if (currentIndex > 0) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentSong(queue[currentIndex - 1]);
      setCurrentTime(0); // Reset seeker
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <MusicContext.Provider value={{
      currentSong,
      queue,
      isPlaying,
      currentTime,
      duration,
      isExpanded,
      playSong,
      togglePlayPause,
      playNext,
      playPrevious,
      seekTo,
      setIsExpanded,
      audioRef
    }}>
      {children}
      <audio
        ref={audioRef}
        src={currentSong?.streamUrl || ''}
        playsInline={true}
        onLoadStart={() => console.log('1. Audio: Load Started')}
        onLoadedMetadata={() => console.log('2. Audio: Metadata Loaded')}
        onCanPlay={() => {
          console.log('3. Audio: Can Play (Buffer ready)');
          safePlay(); // Trigger our safe play here
        }}
        onWaiting={() => console.log('Audio: Waiting for data/buffering...')}
        onStalled={() => console.warn('Audio: Stalled (Network issue)')}
        onError={(e) => {
          console.error('Audio Tag Fatal Error:', e.currentTarget.error);
          console.log('Failed URL:', currentSong?.streamUrl);
        }}
      />
    </MusicContext.Provider>
  );
};
