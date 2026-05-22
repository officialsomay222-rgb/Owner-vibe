import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Volume2, VolumeX, MoreVertical, Heart, Share2, Info, ListPlus, Timer, Wand2, Smartphone, PlayCircle, PlusCircle, Download, SmartphoneNfc, CheckCircle2 } from 'lucide-react';
import { useMusic } from './MusicContext';
import { useColor } from 'color-thief-react';
import { Capacitor } from '@capacitor/core';
import { useAudioTime } from './hooks/useAudioTime';
import { Logger } from './utils/logger';
import { useLocalStorage } from './hooks/useLocalStorage';

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ProgressBar = ({ duration, dominantColor, seekTo, audioRef }: { duration: number, dominantColor: string, seekTo: (time: number) => void, audioRef: React.RefObject<HTMLAudioElement | null> }) => {
  const currentTime = useAudioTime(audioRef);
  const [isDragging, setIsDragging] = useState(false);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

  return (
    <div className="mb-10 w-full group">
      <div
        className="relative w-full h-[6px] bg-white/20 rounded-full flex items-center transition-all duration-300 ease-out group-hover:h-2"
      >
        <div
            className={`absolute h-full rounded-full ${isDragging ? '' : 'transition-all duration-200 ease-linear'}`}
            style={{
                width: `${(currentTime / duration) * 100 || 0}%`,
                backgroundColor: dominantColor,
                boxShadow: `0 0 12px ${dominantColor}B3` // Subtle glow
            }}
        />

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime || 0}
          onChange={handleSeek}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div
            className={`absolute h-4 w-4 rounded-full shadow-md z-0 transition-transform duration-200 ease-out flex items-center justify-center ${isDragging ? 'scale-125' : 'scale-0 group-hover:scale-100'}`}
            style={{
                left: `calc(${(currentTime / duration) * 100 || 0}% - 8px)`,
                backgroundColor: '#fff',
                boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 12px ${dominantColor}`
            }}
        >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dominantColor }} />
        </div>
      </div>

      <div className="flex justify-between text-xs font-semibold text-white/60 tracking-wider mt-3 px-1">
        <span className="font-mono">{formatTime(currentTime)}</span>
        <span className="font-mono">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export const MusicPlayer = () => {
  const {
    currentSong, isExpanded, setIsExpanded, isPlaying, isLoadingStream,
    togglePlayPause, playNext, playPrevious, duration, seekTo,
    isShuffle, repeatMode, toggleShuffle, toggleRepeat, audioRef,
    favorites, toggleFavorite, addToQueue, addToPlaylist, showPlaylistModal
  } = useMusic();

  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLofiMode, setIsLofiMode] = useState(false);
  const [isGestureMode, setIsGestureMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [offlineVault, setOfflineVault] = useLocalStorage<any[]>('offline_vault', []);

  const isFavorite = currentSong ? favorites.some(s => s.videoId === currentSong.videoId) : false;
  const isDownloaded = currentSong ? offlineVault.some(t => t.songId === currentSong.videoId) : false;

  const handleToggleFavorite = () => {
    if (currentSong) {
      toggleFavorite(currentSong);
    }
  };

  const handleAddQueue = () => {
    if (currentSong) {
      addToQueue(currentSong);
      setShowMenu(false); // Close menu on success
    }
  };

  const handleSleepTimer = () => {
    // Setting up sleep timer needs its own UI/modal, which we can expand on later if requested
    Logger.log("Sleep Timer clicked");
  };

  const handlePlayNext = () => {
    playNext();
    setShowMenu(false);
  };

  const handleAddToPlaylist = () => {
    if (currentSong) {
      showPlaylistModal(currentSong);
      setShowMenu(false);
    }
  };

  const handleDownload = async () => {
    if (!currentSong || isDownloaded || isDownloading) return;
    try {
      setIsDownloading(true);
      const { downloadTrackToVault } = await import('./services/DownloadService');

      const metadata = {
        title: currentSong.title,
        artist: currentSong.artist || 'Unknown Artist',
        coverArt: currentSong.thumbnailUrl || ''
      };

      // Retrieve preferred download quality from localStorage
      const savedQuality = window.localStorage.getItem('owners_vibe_audio_quality');
      let audioQualitySetting: 'Low' | 'Normal' | 'High' = 'Normal';
      if (savedQuality) {
        try {
          const parsed = JSON.parse(savedQuality);
          if (parsed === 'low') audioQualitySetting = 'Low';
          if (parsed === 'high') audioQualitySetting = 'High';
        } catch (e) {
          // Fallback to normal if not valid JSON
        }
      }

      // Force refresh the localStorage state in this component to re-render the checkmark
      const track = await downloadTrackToVault(currentSong.videoId, metadata, audioQualitySetting);

      // Update local storage hook state manually to trigger UI update
      setOfflineVault(prev => {
        const filtered = prev.filter(t => t.songId !== track.songId);
        return [...filtered, track];
      });

      setIsDownloading(false);
      // Let it stay open so user sees it change to checked, or close it if preferred.
    } catch (err: any) {
      Logger.error("Failed to download track:", err);
      setIsDownloading(false);
      alert(err.message || "Failed to download track. The requested quality might not be available.");
    }
  };

  // We use a CORS proxy to allow color-thief to read the image on web without tainting the canvas
  // On native platforms, we can fetch directly.
  const proxyUrl = currentSong?.thumbnailUrl
      ? (Capacitor.isNativePlatform()
          ? currentSong.thumbnailUrl
          : `https://api.allorigins.win/raw?url=${encodeURIComponent(currentSong.thumbnailUrl)}`)
      : '';
  const { data: color, loading } = useColor(proxyUrl, 'hex', { crossOrigin: 'anonymous' });
  const highResThumb = currentSong?.thumbnailUrl?.replace(/=w\d+-h\d+/, '=w1080-h1080') || currentSong?.thumbnailUrl;

  // Use the extracted color or fallback
  const dominantColor = color && !loading ? color : '#3b82f6'; // default blue

  const handleShare = async () => {
    if (!currentSong) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Listening to ${currentSong.title}`,
          text: `Check out ${currentSong.title} by ${currentSong.artist} on Owner Vibe!`,
        });
      } else {
        await navigator.clipboard.writeText(`${currentSong.title} by ${currentSong.artist}`);
        alert('Song info copied to clipboard!');
      }
    } catch (err) {
      Logger.log('Error sharing:', err);
    }
  };

  const toggleMute = () => {
      if (audioRef.current) {
          audioRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
      }
  };

  if (!currentSong) return null;

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="fixed inset-0 z-[100] text-white flex flex-col items-center overflow-hidden will-change-transform"
          style={{
            willChange: 'transform',
            background: `linear-gradient(180deg, ${dominantColor} 0%, #000000 100%)`,
          }}
        >
          {/* Dynamic Blur Background */}
          <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
            <img
                src={highResThumb}
                alt="blur-bg"
                className="w-full h-full object-cover blur-2xl opacity-50 scale-125 transform-gpu will-change-transform"
                style={{ willChange: 'transform', transform: 'translateZ(0)' }}
            />
          </div>

          {/* Smooth Premium Overlay for the gradient */}
          <div
            className="absolute inset-0 pointer-events-none transition-colors duration-1000"
            style={{
              background: `radial-gradient(circle at 50% -20%, ${dominantColor}40 0%, transparent 60%), linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 50%, #000000 100%)`
            }}
          />

          {/* Removed the heavy blur image completely for a much cleaner Spotify/Apple Music gradient look */}

          {/* Header */}
          <div className="relative w-full flex items-center justify-between px-6 pt-safe pb-4 mt-4 landscape:mb-0 landscape:pb-0 z-10">
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse player"
              title="Collapse player"
              className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
            <span className="text-sm font-medium tracking-widest text-white/80">NOW PLAYING</span>
            <button
              onClick={() => setShowMenu(true)}
              aria-label="More options"
              title="More options"
              className="p-2 -mr-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content */}
          <div className="relative flex-1 w-full max-w-md landscape:max-w-4xl flex flex-col landscape:flex-row landscape:items-center px-8 landscape:px-12 pb-10 landscape:pb-4 mt-6 landscape:mt-2">
            {/* Left Side: Album Art (Landscape) / Top: Album Art (Portrait) */}
            <div className="w-full landscape:w-1/2 landscape:pr-8 flex items-center justify-center">
                <motion.div
                  className="w-full max-w-[320px] landscape:max-w-[400px] aspect-square rounded-[32px] overflow-hidden shadow-2xl mb-10 landscape:mb-0"
                  style={{
                    boxShadow: `0 20px 50px -10px ${dominantColor}88` // Dynamic glow
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={highResThumb}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous" // needed for color extraction if done directly, but we use proxy above. still good practice
                  />
                </motion.div>
            </div>

            {/* Right Side: Info & Controls (Landscape) / Bottom: Info & Controls (Portrait) */}
            <div className="w-full landscape:w-1/2 flex flex-col justify-center">
                {/* Song Info */}
                <div className="flex items-center justify-between mb-8 landscape:mb-4">
                  <div className="flex-1 overflow-hidden">
                    <h2 className="text-3xl landscape:text-2xl font-bold truncate mb-1 text-white">{currentSong.title}</h2>
                    <p className="text-xl landscape:text-lg text-white/70 truncate">{currentSong.artist}</p>
                  </div>
                  <button
                    onClick={handleToggleFavorite}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    className="p-3 ml-4 rounded-full hover:bg-white/10 transition-colors active:scale-90"
                  >
                    <Heart
                      className={`w-7 h-7 landscape:w-6 landscape:h-6 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                  </button>
                </div>

                {/* Premium Seek Bar */}
                <ProgressBar duration={duration} dominantColor={dominantColor} seekTo={seekTo} audioRef={audioRef} />

                {/* Controls */}
                <div className="flex items-center justify-between mb-8 landscape:mb-4 px-2 landscape:px-0">
                  <button
                    onClick={toggleShuffle}
                    aria-label="Toggle shuffle"
                    title="Toggle shuffle"
                    className={`p-3 landscape:p-2 rounded-full transition-all active:scale-90 ${isShuffle ? `text-[${dominantColor}]` : 'text-white/50 hover:text-white/80'}`}
                    style={{ color: isShuffle ? dominantColor : undefined }}
                  >
                    <Shuffle className="w-6 h-6 landscape:w-5 landscape:h-5" />
                  </button>

                  <button
                    onClick={playPrevious}
                    aria-label="Previous track"
                    title="Previous track"
                    className="p-3 landscape:p-2 rounded-full hover:bg-white/10 transition-all active:scale-90 text-white"
                  >
                    <SkipBack className="w-10 h-10 landscape:w-8 landscape:h-8 fill-current" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    disabled={isLoadingStream}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    title={isPlaying ? 'Pause' : 'Play'}
                    className={`p-5 landscape:p-4 rounded-full flex items-center justify-center transition-all shadow-xl ${isLoadingStream ? 'opacity-80' : 'active:scale-90'}`}
                    style={{ backgroundColor: dominantColor, color: '#fff' }}
                  >
                    {isLoadingStream ? (
                       <div className="w-10 h-10 landscape:w-8 landscape:h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-10 h-10 landscape:w-8 landscape:h-8 fill-current" />
                    ) : (
                      <Play className="w-10 h-10 landscape:w-8 landscape:h-8 fill-current translate-x-1" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    aria-label="Next track"
                    title="Next track"
                    className="p-3 landscape:p-2 rounded-full hover:bg-white/10 transition-all active:scale-90 text-white"
                  >
                    <SkipForward className="w-10 h-10 landscape:w-8 landscape:h-8 fill-current" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    aria-label="Toggle repeat"
                    title="Toggle repeat"
                    className={`p-3 landscape:p-2 rounded-full transition-all active:scale-90 ${repeatMode !== 'none' ? `text-[${dominantColor}]` : 'text-white/50 hover:text-white/80'}`}
                    style={{ color: repeatMode !== 'none' ? dominantColor : undefined }}
                  >
                    <Repeat className="w-6 h-6 landscape:w-5 landscape:h-5" />
                  </button>
                </div>

                {/* Volume & Extras */}
                <div className="flex items-center justify-between px-6 landscape:px-2 text-white/50">
                    <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute' : 'Mute'} className="hover:text-white transition-colors active:scale-90 p-2">
                        {isMuted ? <VolumeX className="w-5 h-5 landscape:w-4 landscape:h-4" /> : <Volume2 className="w-5 h-5 landscape:w-4 landscape:h-4" />}
                    </button>
                    <button onClick={handleShare} aria-label="Share" title="Share" className="hover:text-white transition-colors active:scale-90 p-2">
                        <Share2 className="w-5 h-5 landscape:w-4 landscape:h-4" />
                    </button>
                </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3-Dot Menu Bottom Sheet Modal */}
      {showMenu && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-end justify-center transform-gpu will-change-transform"
            onClick={() => setShowMenu(false)}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full bg-[#121212] rounded-t-[32px] pb-safe max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-[#121212] z-10 pt-4 pb-2 px-6">
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

                  <div className="flex items-center pb-6 border-b border-white/10">
                      <img src={currentSong.thumbnailUrl} alt="Thumbnail" className="w-16 h-16 rounded-md object-cover mr-4 shadow-lg" />
                      <div className="flex-1 overflow-hidden">
                          <h3 className="text-white/90 font-semibold text-[17px] truncate">{currentSong.title}</h3>
                          <p className="text-white/50 text-[14px] truncate mt-0.5">{currentSong.artist}</p>
                      </div>
                  </div>
                </div>

                <div className="px-4 pb-6 flex flex-col gap-1 mt-2">
                    {/* Add to queue */}
                    <button onClick={handleAddQueue} className="w-full flex items-center px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 group">
                        <ListPlus className="w-[22px] h-[22px] mr-5 text-white/90 group-active:scale-95 transition-transform" />
                        <span className="text-[16px] font-medium tracking-wide">Add to queue</span>
                    </button>

                    {/* Share */}
                    <button onClick={handleShare} className="w-full flex items-center px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 group">
                        <Share2 className="w-[22px] h-[22px] mr-5 text-white/90 group-active:scale-95 transition-transform" />
                        <span className="text-[16px] font-medium tracking-wide">Share</span>
                    </button>

                    {/* Sleep Timer */}
                    <button onClick={handleSleepTimer} className="w-full flex items-center px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 group">
                        <Timer className="w-[22px] h-[22px] mr-5 text-white/90 group-active:scale-95 transition-transform" />
                        <span className="text-[16px] font-medium tracking-wide">Sleep Timer</span>
                    </button>

                    {/* Lofi Mode Toggle */}
                    <div className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 cursor-pointer" onClick={() => setIsLofiMode(!isLofiMode)}>
                        <div className="flex items-center">
                          <Wand2 className="w-[22px] h-[22px] mr-5 text-white/90" />
                          <span className="text-[16px] font-medium tracking-wide">Lofi Mode</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isLofiMode ? 'bg-white/20' : 'bg-white/10'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isLofiMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Gesture Mode Toggle */}
                    <div className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 cursor-pointer" onClick={() => setIsGestureMode(!isGestureMode)}>
                        <div className="flex items-center">
                          <Smartphone className="w-[22px] h-[22px] mr-5 text-white/90" />
                          <span className="text-[16px] font-medium tracking-wide">Gesture Mode</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isGestureMode ? 'bg-white/20' : 'bg-white/10'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isGestureMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Play next */}
                    <button onClick={handlePlayNext} className="w-full flex items-center px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 group">
                        <PlayCircle className="w-[22px] h-[22px] mr-5 text-white/90 group-active:scale-95 transition-transform" />
                        <span className="text-[16px] font-medium tracking-wide">Play next</span>
                    </button>

                    {/* Add to playlist */}
                    <button onClick={handleAddToPlaylist} className="w-full flex items-center px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 group">
                        <PlusCircle className="w-[22px] h-[22px] mr-5 text-white/90 group-active:scale-95 transition-transform" />
                        <span className="text-[16px] font-medium tracking-wide">Add to playlist</span>
                    </button>

                    {/* Remove/Add to favorites */}
                    <button onClick={handleToggleFavorite} className="w-full flex items-center px-4 py-3.5 hover:bg-white/5 rounded-2xl transition-colors text-white/90 group">
                        <Heart className={`w-[22px] h-[22px] mr-5 transition-transform group-active:scale-95 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white/90'}`} />
                        <span className="text-[16px] font-medium tracking-wide">{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                    </button>

                    {/* Download */}
                    <button onClick={handleDownload} disabled={isDownloaded || isDownloading} className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-colors group ${isDownloaded ? 'opacity-100' : 'hover:bg-white/5 text-white/90'} ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isDownloaded ? (
                            <CheckCircle2 className="w-[22px] h-[22px] mr-5 text-emerald-400 group-active:scale-95 transition-transform" />
                        ) : isDownloading ? (
                            <div className="w-[22px] h-[22px] mr-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Download className="w-[22px] h-[22px] mr-5 text-white/90 group-active:scale-95 transition-transform" />
                        )}
                        <span className={`text-[16px] font-medium tracking-wide ${isDownloaded ? 'text-emerald-400' : ''}`}>
                            {isDownloaded ? 'Downloaded' : isDownloading ? 'Downloading...' : 'Download'}
                        </span>
                    </button>

                    {/* Info Icon (Bottom Left) */}
                    <div className="flex px-4 pt-4 pb-2">
                        <button aria-label="Device options" title="Device options" className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70">
                            <SmartphoneNfc className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
