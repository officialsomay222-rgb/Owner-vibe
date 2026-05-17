import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from './types';
import { musicService } from './services/MusicService';
import { MediaSession } from '@capgo/capacitor-media-session';
import { Logger } from './utils/logger';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface MusicContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  isLoadingStream: boolean;
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
  addToPlaylist: (song: Song, playlistId?: string) => void;
  showPlaylistModal: (song: Song) => void;
  customPlaylists: any[];
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
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [playHistory, setPlayHistory] = useLocalStorage<Song[]>('playHistory', []);
  const [favorites, setFavorites] = useLocalStorage<Song[]>('favorites', []);

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [songToAdd, setSongToAdd] = useState<Song | null>(null);
  const [customPlaylists, setCustomPlaylists] = useLocalStorage<any[]>('custom_playlists', []);

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

  const [offlineUrl, setOfflineUrl] = useState<string>('');
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);

  // Auto-fetch stream URL for current song if missing
  useEffect(() => {
    let activeObjectUrl: string | null = null;
    let isCancelled = false;

    if (currentSong && currentSong.localPath) {
       setIsLoadingStream(false);
       if (Capacitor.isNativePlatform()) {
         setOfflineUrl(Capacitor.convertFileSrc(currentSong.localPath));
       } else {
         // On the web, we must read the file from IndexedDB (via Capacitor Filesystem),
         // convert the base64 to a Blob, and generate an Object URL.
         const loadWebOfflineAudio = async () => {
           try {
             const result = await Filesystem.readFile({
               path: currentSong.localPath!,
               directory: Directory.Data
             });

             if (isCancelled) return;

             // Extract base64 and create a blob
             const base64Data = result.data as string;

             // Infer mime type from extension
             const mimeType = currentSong.localPath!.endsWith('.m4a') ? 'audio/mp4' : 'audio/webm';

             // Fast native base64 conversion
             const res = await fetch(`data:${mimeType};base64,${base64Data}`);
             const blob = await res.blob();

             if (isCancelled) return;

             const url = URL.createObjectURL(blob);
             activeObjectUrl = url;
             setOfflineUrl(url);
           } catch (error) {
             Logger.error('Failed to load offline audio for web', error);
             if (!isCancelled) setOfflineUrl('');
           }
         };
         loadWebOfflineAudio();
       }

    } else {
      setOfflineUrl('');

      if (currentSong && !currentSong.streamUrl && currentSong.videoId) {
        setIsLoadingStream(true);
        const fetchStream = async () => {
          try {
            setFallbackUrls([]);
            const streamUrls = await musicService.getStreamUrl(currentSong.videoId);

            if (isCancelled) return;

            if (streamUrls && streamUrls.length > 0) {
              setFallbackUrls(streamUrls.slice(1));
              setCurrentSong((prev) => {
                if (prev && prev.videoId === currentSong.videoId) {
                  return { ...prev, streamUrl: streamUrls[0] };
                }
                return prev;
              });
            } else {
                Logger.error("Failed to find suitable stream URL for", currentSong.videoId);
                playNext();
            }
          } catch (err) {
            if (isCancelled) return;
            Logger.error("Failed to fetch youtube stream:", err);
            playNext();
          } finally {
              if (!isCancelled) setIsLoadingStream(false);
          }
        };
        fetchStream();
      } else if (currentSong?.streamUrl) {
          setIsLoadingStream(false);
      }
    }

    return () => {
      isCancelled = true;
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [currentSong]);

  // Sync Media Session Metadata
  useEffect(() => {
    if (currentSong) {
      // Extract high resolution image by rewriting standard YouTube thumbnail URLs
      // e.g. "w60-h60-l90-rj" -> "w500-h500-l90-rj"
      let highResArtUrl = currentSong.thumbnailUrl;
      if (highResArtUrl && !highResArtUrl.startsWith('data:')) {
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
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    // Instantly update UI with the new song data before fetching stream
    setIsExpanded(true);
    setCurrentSong(song);
    setIsPlaying(true);
    setIsLoadingStream(!song.streamUrl && !song.localPath);

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
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        safePlay();
      }
    }
  };

  const playNext = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.videoId === currentSong.videoId);

    if (currentIndex !== -1) {
        if (currentIndex < queue.length - 1) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
          setCurrentSong(queue[currentIndex + 1]);
          setIsPlaying(true);
          setIsLoadingStream(!queue[currentIndex + 1].streamUrl && !queue[currentIndex + 1].localPath);
        } else if (repeatMode === 'all') {
          // Loop back to the first song
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
          setCurrentSong(queue[0]);
          setIsPlaying(true);
          setIsLoadingStream(!queue[0].streamUrl && !queue[0].localPath);
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
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      setCurrentSong(queue[currentIndex - 1]);
      setIsPlaying(true);
      setIsLoadingStream(!queue[currentIndex - 1].streamUrl && !queue[currentIndex - 1].localPath);
    } else if (repeatMode === 'all') {
      // Go to the last song
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      setCurrentSong(queue[queue.length - 1]);
      setIsPlaying(true);
      setIsLoadingStream(!queue[queue.length - 1].streamUrl && !queue[queue.length - 1].localPath);
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

  const showPlaylistModal = (song: Song) => {
    setSongToAdd(song);
    setIsPlaylistModalOpen(true);
  };

  const addToPlaylist = (song: Song, playlistId?: string) => {
    if (!playlistId) return;

    setCustomPlaylists((prev: any[]) => prev.map(p => {
      if (p.id === playlistId) {
        // Check if track is already in playlist
        if (p.tracks && p.tracks.some((t: any) => t.videoId === song.videoId)) return p;

        return { ...p, tracks: [song, ...(p.tracks || [])] };
      }
      return p;
    }));
    setIsPlaylistModalOpen(false);
    setSongToAdd(null);
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
      isLoadingStream,
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
      addToPlaylist,
      showPlaylistModal,
      customPlaylists
    }}>
      {children}

      {/* Playlist Selector Modal */}
      {isPlaylistModalOpen && songToAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsPlaylistModalOpen(false)}>
          <div className="bg-[#1a1a1a] w-full max-w-[320px] rounded-3xl overflow-hidden shadow-2xl flex flex-col p-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4 text-center">Add to Playlist</h3>

            <div className="max-h-[300px] overflow-y-auto no-scrollbar flex flex-col space-y-2">
              {customPlaylists.length === 0 ? (
                <div className="text-center text-[#888] py-4 text-sm">No custom playlists yet. Create one in your Library.</div>
              ) : (
                customPlaylists.map((playlist: any) => (
                  <button
                    key={playlist.id}
                    onClick={() => addToPlaylist(songToAdd, playlist.id)}
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      <img src={playlist.tracks && playlist.tracks.length > 0 ? playlist.tracks[0].thumbnailUrl : playlist.img} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-1 truncate">
                      <span className="text-white font-bold text-sm truncate">{playlist.title}</span>
                      <span className="text-[#888] text-[12px]">{playlist.tracks ? playlist.tracks.length : 0} tracks</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button onClick={() => setIsPlaylistModalOpen(false)} className="mt-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}
      <audio
        ref={audioRef}
        src={offlineUrl || currentSong?.streamUrl || ''}
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
          if (fallbackUrls.length > 0) {
            Logger.log('Trying fallback URL...');
            const nextUrl = fallbackUrls[0];
            setFallbackUrls(prev => prev.slice(1));
            setCurrentSong(prev => prev ? { ...prev, streamUrl: nextUrl } : prev);
          } else {
            Logger.log('No fallback URLs left, skipping to next song.');
            playNext();
          }
        }}
      />
    </MusicContext.Provider>
  );
};
