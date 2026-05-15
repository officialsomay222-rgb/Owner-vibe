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
  downloadedTracks: Song[];
  downloadSong: (song: Song, onProgress?: (p: number) => void) => Promise<boolean>;
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
  const [downloadedTracks, setDownloadedTracks] = useLocalStorage<Song[]>('downloadedTracks', []);

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
    if (audioRef.current && currentSong?.streamUrl) {
      if (isPlaying) {
        safePlay();
        MediaSession.setPlaybackState({ playbackState: 'playing' });
        MediaSession.setPositionState({
          position: audioRef.current.currentTime,
          duration: audioRef.current.duration || 0,
          playbackRate: audioRef.current.playbackRate || 1
        });
      } else {
        audioRef.current.pause();
        MediaSession.setPlaybackState({ playbackState: 'paused' });
        MediaSession.setPositionState({
          position: audioRef.current.currentTime,
          duration: audioRef.current.duration || 0,
          playbackRate: audioRef.current.playbackRate || 1
        });
      }
    }
  }, [isPlaying, currentSong?.streamUrl]);

  // Explicitly call load only when streamUrl actually changes
  // We cannot remove this completely because changing src dynamically doesn't
  // always trigger the new load properly without it, but we MUST NOT do it when
  // just play/pause toggles.
  useEffect(() => {
    if (audioRef.current && currentSong?.streamUrl) {
      audioRef.current.load();
    }
  }, [currentSong?.streamUrl]);

  // Auto-fetch stream URL for current song if missing
  useEffect(() => {
    if (currentSong && !currentSong.streamUrl && currentSong.videoId) {
      const fetchStream = async () => {
        try {
          const downloaded = downloadedTracks.find(t => t.videoId === currentSong.videoId);
          if (downloaded && downloaded.localPath) {
             const localStreamUrl = Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(downloaded.localPath) : downloaded.localPath;
             setCurrentSong((prev) => {
                if (prev && prev.videoId === currentSong.videoId) {
                  return { ...prev, streamUrl: localStreamUrl };
                }
                return prev;
             });
             return;
          }

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

  // Bind Native Media Session Actions
  useEffect(() => {
    MediaSession.setActionHandler({ action: 'play' }, () => {
      setIsPlaying(true);
    });

    MediaSession.setActionHandler({ action: 'pause' }, () => {
      setIsPlaying(false);
    });

    MediaSession.setActionHandler({ action: 'nexttrack' }, () => {
      playNext();
    });

    MediaSession.setActionHandler({ action: 'previoustrack' }, () => {
      playPrevious();
    });

    MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
      if (details && typeof details.seekTime === 'number') {
        seekTo(details.seekTime);
      }
    });

    // We don't remove action handlers here as we want them always bound.
    // In @capgo/capacitor-media-session, subsequent calls overwrite the handlers.
  }, [queue, currentSong, repeatMode, isShuffle, isPlaying, duration]); // dependencies to ensure handlers use latest state via closures (especially playNext/playPrevious)

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => {
        setDuration(audio.duration);
        MediaSession.setPositionState({
            position: audio.currentTime,
            duration: audio.duration || 0,
            playbackRate: audio.playbackRate
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

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, currentSong, repeatMode]);

  const playSong = async (song: Song, newQueue?: Song[]) => {
    setPlayHistory((prev: Song[]) => {
      const filtered = prev.filter(s => s.videoId !== song.videoId);
      return [song, ...filtered].slice(0, 50);
    });

    if (audioRef.current) {
      audioRef.current.pause();
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
          if (audioRef.current) audioRef.current.pause();
          setCurrentSong(queue[currentIndex + 1]);
          setIsPlaying(true);
        } else if (repeatMode === 'all') {
          // Loop back to the first song
          if (audioRef.current) audioRef.current.pause();
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
      if (audioRef.current) audioRef.current.pause();
      setCurrentSong(queue[currentIndex - 1]);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      // Go to the last song
      if (audioRef.current) audioRef.current.pause();
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

  const toggleRepeat = () => {
      setRepeatMode(prev => {
          if (prev === 'none') return 'all';
          if (prev === 'all') return 'one';
          return 'none';
      });
  };

  const downloadSong = async (song: Song, onProgress?: (p: number) => void): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      alert("Downloading is only supported in the mobile app.");
      return false;
    }
    const existing = downloadedTracks.find(t => t.videoId === song.videoId);
    if (existing) {
      alert("Song is already downloaded.");
      return true; // Already downloaded
    }

    try {
      const localPath = await musicService.downloadTrack(song.videoId, song.title, song.artist, '251', onProgress);
      if (localPath) {
         const downloadedSong = { ...song, localPath };
         setDownloadedTracks((prev: Song[]) => [downloadedSong, ...prev]);
         return true;
      }
    } catch (e) {
      console.error("Download failed:", e);
    }
    return false;
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
      downloadedTracks,
      downloadSong
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
          safePlay(); // Trigger our safe play here
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
