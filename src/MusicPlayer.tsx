import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Volume2, VolumeX, MoreVertical, Heart, Share2, Download, Info } from 'lucide-react';
import { useMusic } from './MusicContext';
import { useColor } from 'color-thief-react';
import { Capacitor } from '@capacitor/core';
import { useAudioTime } from './hooks/useAudioTime';
import { Logger } from './utils/logger';

export const MusicPlayer = () => {
  const {
    currentSong, isExpanded, setIsExpanded, isPlaying,
    togglePlayPause, playNext, playPrevious, duration, seekTo,
    isShuffle, repeatMode, toggleShuffle, toggleRepeat, audioRef,
    favorites, toggleFavorite
  } = useMusic();

  const currentTime = useAudioTime(audioRef);
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isFavorite = currentSong ? favorites.some(s => s.videoId === currentSong.videoId) : false;

  const handleToggleFavorite = () => {
    if (currentSong) {
      toggleFavorite(currentSong);
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

  const handleDownload = () => {
    if (!currentSong || !audioRef.current?.src) {
        alert("Cannot download this song right now.");
        return;
    }
    const a = document.createElement('a');
    a.href = audioRef.current.src;
    a.download = `${currentSong.title}.m4a`;
    a.click();
    setShowMenu(false);
  };

  const toggleMute = () => {
      if (audioRef.current) {
          audioRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
      }
  };

  if (!currentSong) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

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
                className="w-full h-full object-cover blur-2xl opacity-50 scale-125"
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
          <div className="relative w-full flex items-center justify-between px-6 pt-safe pb-4 mt-4">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
            <span className="text-sm font-medium tracking-widest text-white/80">NOW PLAYING</span>
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 -mr-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content */}
          <div className="relative flex-1 w-full max-w-md flex flex-col px-8 pb-10 mt-6">
            {/* Album Art */}
            <motion.div
              className="w-full aspect-square rounded-[32px] overflow-hidden shadow-2xl mb-10"
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

            {/* Song Info */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex-1 overflow-hidden">
                <h2 className="text-3xl font-bold truncate mb-1 text-white">{currentSong.title}</h2>
                <p className="text-xl text-white/70 truncate">{currentSong.artist}</p>
              </div>
              <button
                onClick={handleToggleFavorite}
                className="p-3 ml-4 rounded-full hover:bg-white/10 transition-colors active:scale-90"
              >
                <Heart
                  className={`w-7 h-7 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
                />
              </button>
            </div>

            {/* Premium Seek Bar */}
            <div className="mb-10 w-full group">
              <div
                className="relative w-full h-[6px] bg-white/20 rounded-full flex items-center transition-all duration-300 ease-out group-hover:h-2"
              >
                {/* Buffered track (optional if added later, skipping for now to focus on premium styling) */}

                {/* Active Progress */}
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

                {/* Thumb */}
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

            {/* Controls */}
            <div className="flex items-center justify-between mb-8 px-2">
              <button
                onClick={toggleShuffle}
                className={`p-3 rounded-full transition-all active:scale-90 ${isShuffle ? `text-[${dominantColor}]` : 'text-white/50 hover:text-white/80'}`}
                style={{ color: isShuffle ? dominantColor : undefined }}
              >
                <Shuffle className="w-6 h-6" />
              </button>

              <button
                onClick={playPrevious}
                className="p-3 rounded-full hover:bg-white/10 transition-all active:scale-90 text-white"
              >
                <SkipBack className="w-10 h-10 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-5 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl"
                style={{ backgroundColor: dominantColor, color: '#fff' }}
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10 fill-current" />
                ) : (
                  <Play className="w-10 h-10 fill-current translate-x-1" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-3 rounded-full hover:bg-white/10 transition-all active:scale-90 text-white"
              >
                <SkipForward className="w-10 h-10 fill-current" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-3 rounded-full transition-all active:scale-90 ${repeatMode !== 'none' ? `text-[${dominantColor}]` : 'text-white/50 hover:text-white/80'}`}
                style={{ color: repeatMode !== 'none' ? dominantColor : undefined }}
              >
                <Repeat className="w-6 h-6" />
              </button>
            </div>

            {/* Volume & Extras */}
            <div className="flex items-center justify-between px-6 text-white/50">
                <button onClick={toggleMute} className="hover:text-white transition-colors active:scale-90 p-2">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button onClick={handleShare} className="hover:text-white transition-colors active:scale-90 p-2">
                    <Share2 className="w-5 h-5" />
                </button>
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
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowMenu(false)}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full bg-[#1c1c1c] rounded-t-[32px] pb-safe"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4" />
                <div className="p-6 pt-2">
                    <div className="flex items-center mb-6 pb-6 border-b border-white/10">
                        <img src={currentSong.thumbnailUrl} alt="Thumbnail" className="w-16 h-16 rounded-xl object-cover mr-4" />
                        <div>
                            <h3 className="text-white font-bold text-lg truncate w-60">{currentSong.title}</h3>
                            <p className="text-white/50 text-sm">{currentSong.artist}</p>
                        </div>
                    </div>

                    <button onClick={handleToggleFavorite} className="w-full flex items-center px-4 py-4 hover:bg-white/5 rounded-2xl transition-colors text-white">
                        <Heart className={`w-6 h-6 mr-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white/80'}`} />
                        <span className="text-lg font-medium">{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    </button>

                    <button onClick={handleDownload} className="w-full flex items-center px-4 py-4 hover:bg-white/5 rounded-2xl transition-colors text-white mt-2">
                        <Download className="w-6 h-6 mr-4 text-white/80" />
                        <span className="text-lg font-medium">Download Song</span>
                    </button>

                    <button onClick={handleShare} className="w-full flex items-center px-4 py-4 hover:bg-white/5 rounded-2xl transition-colors text-white mt-2">
                        <Share2 className="w-6 h-6 mr-4 text-white/80" />
                        <span className="text-lg font-medium">Share</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
