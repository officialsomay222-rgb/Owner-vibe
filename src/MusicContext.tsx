import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from './types';
import { getYouTubeAudioStream } from './utils/youtube';

interface MusicContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isExpanded: boolean;
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  toggleShuffle: () => void;
  toggleRepeat: () => void;
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
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');

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
    const handleEnded = () => {
        if (repeatMode === 'one') {
            audio.currentTime = 0;
            safePlay();
        } else {
            playNext();
        }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, currentSong, repeatMode]);

  const playSong = async (song: Song, newQueue?: Song[]) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Auto expand the player when playing a new song
    setIsExpanded(true);
    setCurrentTime(0); // Reset seeker

    // If streamUrl is not present (e.g. from YouTube search), fetch it!
    if (!song.streamUrl && song.videoId) {
      try {
        const streamUrl = await getYouTubeAudioStream(song.videoId);
        if (streamUrl) {
          song.streamUrl = streamUrl;
        } else {
            console.error("Failed to find suitable stream URL");
        }
      } catch (err) {
        console.error("Failed to fetch youtube stream:", err);
      }
    }

    setCurrentSong(song);
    if (newQueue) {
      setOriginalQueue(newQueue);
      if (isShuffle) {
          const shuffled = [...newQueue].sort(() => Math.random() - 0.5);
          // Ensure current song is first in shuffled queue
          const filtered = shuffled.filter(s => s.videoId !== song.videoId);
          setQueue([song, ...filtered]);
      } else {
          setQueue(newQueue);
      }
    } else if (queue.length === 0) {
      setOriginalQueue([song]);
      setQueue([song]);
    }
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.videoId === currentSong.videoId);

    if (currentIndex !== -1) {
        if (currentIndex < queue.length - 1) {
          if (audioRef.current) audioRef.current.pause();
          setCurrentSong(queue[currentIndex + 1]);
          setCurrentTime(0);
          setIsPlaying(true);
        } else if (repeatMode === 'all') {
          // Loop back to the first song
          if (audioRef.current) audioRef.current.pause();
          setCurrentSong(queue[0]);
          setCurrentTime(0);
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
    }
  };

  const playPrevious = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.videoId === currentSong.videoId);

    if (currentIndex > 0) {
      if (audioRef.current) audioRef.current.pause();
      setCurrentSong(queue[currentIndex - 1]);
      setCurrentTime(0);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      // Go to the last song
      if (audioRef.current) audioRef.current.pause();
      setCurrentSong(queue[queue.length - 1]);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const toggleShuffle = () => {
      const newShuffleState = !isShuffle;
      setIsShuffle(newShuffleState);

      if (newShuffleState) {
          // Turn on shuffle
          if (currentSong) {
              const remaining = originalQueue.filter(s => s.videoId !== currentSong.videoId);
              const shuffled = remaining.sort(() => Math.random() - 0.5);
              setQueue([currentSong, ...shuffled]);
          } else {
              setQueue([...originalQueue].sort(() => Math.random() - 0.5));
          }
      } else {
          // Turn off shuffle
          setQueue(originalQueue);
      }
  };

  const toggleRepeat = () => {
      setRepeatMode(prev => {
          if (prev === 'none') return 'all';
          if (prev === 'all') return 'one';
          return 'none';
      });
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
      isShuffle,
      repeatMode,
      toggleShuffle,
      toggleRepeat,
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
