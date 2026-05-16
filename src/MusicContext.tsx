import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from './types';
import { musicService } from './services/MusicService';
import { MediaSession } from '@capgo/capacitor-media-session';
import { Logger } from './utils/logger';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Capacitor } from '@capacitor/core';

interface MusicContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  // ⚡ OPTIMIZATION: `currentTime` was removed from context to prevent global re-renders
  // on every timeupdate. It is now tracked locally via the `useAudioTime` hook.
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
  playHistory: Song[];
  favorites: Song[];
  toggleFavorite: (song: Song) => void;
  addToQueue: (song: Song) => void;
  addToPlaylist: (song: Song) => void;
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
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [playHistory, setPlayHistory] = useLocalStorage<Song[]>('playHistory', []);
  const [favorites, setFavorites] = useLocalStorage<Song[]>('favorites', []);

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
        Logger.log('SafePlay: Playback aborted by new load request. Safely ignored.');
      } else {
        Logger.error('SafePlay: Actual playback error:', error);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        safePlay();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Auto-fetch stream URL for current song if missing
  useEffect(() => {
    if (currentSong && !currentSong.streamUrl && currentSong.videoId) {
      const fetchStream = async () => {
        try {
          const streamUrl = await musicService.getStreamUrl(currentSong.videoId);
          if (streamUrl) {
            setCurrentSong((prev) => {
              if (prev && prev.videoId === currentSong.videoId) {
                return { ...prev, streamUrl };
              }
              return prev;
            });
          } else {
              Logger.error("Failed to find suitable stream URL for", currentSong.videoId);
          }
        } catch (err) {
          Logger.error("Failed to fetch youtube stream:", err);
        }
      };
      fetchStream();
    }
  }, [currentSong]);

  // Sync Media Session Metadata
  useEffect(() => {
    if (currentSong) {
      // Extract high resolution image by rewriting standard YouTube thumbnail URLs
      // e.g. "w60-h60-l90-rj" -> "w500-h500-l90-rj"
      let highResArtUrl = currentSong.thumbnailUrl;
      if (highResArtUrl) {
        highResArtUrl = highResArtUrl.replace(/=w\d+-h\d+/, '=w500-h500');
      }

      MediaSession.setMetadata({
        title: currentSong.title,
        artist: currentSong.artist || 'Unknown Artist',
        album: 'Owner Vibe',
        artwork: [
          {
            src: highResArtUrl || '',
            sizes: '500x500',
            type: 'image/jpeg'
          }
        ]
      });
    }
  }, [currentSong]);

  // Ref to hold the latest actions so we don't have to rebind MediaSession on every state change
  const actionsRef = useRef({ playNext: () => {}, playPrevious: () => {}, setIsPlaying: (val: boolean) => {}, seekTo: (t: number) => {} });

  // Update the ref with the latest functions
  useEffect(() => {
    actionsRef.current = {
      playNext: playNext,
      playPrevious: playPrevious,
      setIsPlaying: setIsPlaying,
      seekTo: seekTo
    };
  }, [queue, currentSong, repeatMode, isShuffle, isPlaying, duration]);

  // Bind Native Media Session Actions ONCE
  useEffect(() => {
    MediaSession.setActionHandler({ action: 'play' }, () => {
      actionsRef.current.setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(e => {
            if (e.name !== 'AbortError') Logger.error('MediaSession Play Error:', e);
        });
      }
    });

    MediaSession.setActionHandler({ action: 'pause' }, () => {
      actionsRef.current.setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    MediaSession.setActionHandler({ action: 'nexttrack' }, () => {
      actionsRef.current.playNext();
    });

    MediaSession.setActionHandler({ action: 'previoustrack' }, () => {
      actionsRef.current.playPrevious();
    });

    MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
      if (details && typeof details.seekTime === 'number') {
        actionsRef.current.seekTo(details.seekTime);
      }
    });

    // We don't remove action handlers here as we want them always bound.
  }, []); // Empty dependency array so bindings happen only once

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => {
        setDuration(audio.duration);
        MediaSession.setPositionState({
            position: audio.currentTime,
            duration: audio.duration || 0,
            playbackRate: audio.playbackRate || 1
        });
    };

    const handleTimeUpdate = () => {
        // Sync position to OS media notification roughly every second to keep the seek bar accurate
        MediaSession.setPositionState({
            position: audio.currentTime,
            duration: audio.duration || 0,
            playbackRate: audio.playbackRate || 1
        });
    };
    const handleEnded = () => {
        if (repeatMode === 'one') {
            audio.currentTime = 0;
            safePlay();
        } else {
            playNext();
        }
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    // Use timeupdate for smooth OS notification seek bar sync
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [queue, currentSong, repeatMode]);

  const playSong = async (song: Song, newQueue?: Song[]) => {
    setPlayHistory((prev: Song[]) => {
      const filtered = prev.filter(s => s.videoId !== song.videoId);
      return [song, ...filtered].slice(0, 50);
    });

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    // Instantly update UI with the new song data before fetching stream
    setIsExpanded(true);
    setCurrentSong(song);
    setIsPlaying(true);

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

  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.videoId === currentSong.videoId);

    if (currentIndex !== -1) {
        if (currentIndex < queue.length - 1) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
          setCurrentSong(queue[currentIndex + 1]);
          setIsPlaying(true);
        } else if (repeatMode === 'all') {
          // Loop back to the first song
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
          setCurrentSong(queue[0]);
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      setCurrentSong(queue[currentIndex - 1]);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      // Go to the last song
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      setCurrentSong(queue[queue.length - 1]);
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

  const toggleFavorite = (song: Song) => {
    setFavorites((prev: Song[]) => {
      const isFav = prev.some(s => s.videoId === song.videoId);
      if (isFav) {
        return prev.filter(s => s.videoId !== song.videoId);
      } else {
        return [song, ...prev];
      }
    });
  };

  const addToQueue = (song: Song) => {
    setOriginalQueue(prev => [...prev, song]);
    setQueue(prev => [...prev, song]);
    // If not currently playing anything, start playing this song
    if (!currentSong) {
      playSong(song);
    }
  };

  const addToPlaylist = (song: Song) => {
    // We would typically show a playlist selector modal here,
    // but for now, we'll log it as a placeholder until the user requests full playlist management
    Logger.log("Added to playlist:", song.title);
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
      MediaSession.setPositionState({
        position: time,
        duration: audioRef.current.duration || 0,
        playbackRate: audioRef.current.playbackRate || 1
      });
    }
  };

  return (
    <MusicContext.Provider value={{
      currentSong,
      queue,
      isPlaying,
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
      audioRef,
      playHistory,
      favorites,
      toggleFavorite,
      addToQueue,
      addToPlaylist
    }}>
      {children}
      <audio
        ref={audioRef}
        src={currentSong?.streamUrl || ''}
        playsInline={true}
        onLoadStart={() => Logger.log('1. Audio: Load Started')}
        onLoadedMetadata={() => Logger.log('2. Audio: Metadata Loaded')}
        onCanPlay={() => {
          Logger.log('3. Audio: Can Play (Buffer ready)');
          if (isPlaying) {
             safePlay(); // Trigger our safe play here
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          MediaSession.setPlaybackState({ playbackState: 'playing' });
        }}
        onPause={(e) => {
          // If readyState is 0, it means the src was changed/cleared, so don't update pause state
          // as we are probably switching songs and want it to play once loaded.
          if (e.currentTarget.readyState > 0) {
            setIsPlaying(false);
            MediaSession.setPlaybackState({ playbackState: 'paused' });
          }
        }}
        onWaiting={() => Logger.log('Audio: Waiting for data/buffering...')}
        onStalled={() => Logger.warn('Audio: Stalled (Network issue)')}
        onError={(e) => {
          Logger.error('Audio Tag Fatal Error:', e.currentTarget.error);
          Logger.log('Failed URL:', currentSong?.streamUrl);
        }}
      />
    </MusicContext.Provider>
  );
};
