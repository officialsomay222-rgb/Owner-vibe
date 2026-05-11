import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Volume2, VolumeX, MoreVertical, Heart, Share2 } from 'lucide-react';
import { useMusic } from './MusicContext';

export const MusicPlayer = () => {
  const {
    currentSong, isExpanded, setIsExpanded, isPlaying,
    togglePlayPause, playNext, playPrevious, currentTime, duration, seekTo,
    isShuffle, repeatMode, toggleShuffle, toggleRepeat, audioRef
  } = useMusic();

  const [isDragging, setIsDragging] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (currentSong) {
      const favoritesStr = localStorage.getItem('favorites');
      if (favoritesStr) {
        const favorites = JSON.parse(favoritesStr);
        setIsFavorite(favorites.some((s: any) => s.videoId === currentSong.videoId));
      } else {
        setIsFavorite(false);
      }
    }
  }, [currentSong]);

  const toggleFavorite = () => {
    if (!currentSong) return;
    const favoritesStr = localStorage.getItem('favorites') || '[]';
    let favorites = JSON.parse(favoritesStr);

    if (isFavorite) {
      favorites = favorites.filter((s: any) => s.videoId !== currentSong.videoId);
    } else {
      favorites.push(currentSong);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (!currentSong) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Listening to ${currentSong.title}`,
          text: `Check out ${currentSong.title} by ${currentSong.artist} on Owner Vibe!`,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${currentSong.title} by ${currentSong.artist}`);
        alert('Song info copied to clipboard!');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
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
          className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center overflow-hidden will-change-transform"
          style={{ willChange: 'transform' }}
        >
          {/* Blurred Background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-150 transition-all duration-1000 will-change-transform"
            style={{ backgroundImage: `url(${currentSong.thumbnailUrl})`, willChange: 'transform, filter' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />

          {/* Header */}
          <div className="relative z-10 w-full flex items-center justify-between px-6 py-6 pt-12">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
            <span className="text-xs font-bold tracking-widest text-white/70 uppercase">Now Playing</span>
            <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex-1 w-full max-w-md flex flex-col px-8 pb-10 justify-between">

            {/* Artwork */}
            <motion.div
              className="w-full aspect-square rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-4 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img
                src={currentSong.thumbnailUrl}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            <div className="flex flex-col space-y-8 mt-10">
              {/* Info */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col overflow-hidden">
                  <motion.h2
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-2xl font-bold text-white truncate pr-4"
                  >
                    {currentSong.title}
                  </motion.h2>
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/60 text-lg truncate"
                  >
                    {currentSong.artist}
                  </motion.p>
                </div>
                <button
                  onClick={toggleFavorite}
                  className={`p-2 transition-colors ${isFavorite ? 'text-rose-500' : 'text-white/70 hover:text-rose-500'}`}
                >
                  <Heart className="w-7 h-7" fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Progress */}
              <div className="flex flex-col space-y-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onTouchStart={() => setIsDragging(true)}
                  onTouchEnd={() => setIsDragging(false)}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none outline-none accent-[#00d2ff]"
                />
                <div className="flex justify-between text-xs text-white/50 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 transition-colors ${isShuffle ? 'text-[#00d2ff]' : 'text-white/50 hover:text-white'}`}
                >
                  <Shuffle className="w-6 h-6" />
                </button>
                <button
                  onClick={playPrevious}
                  className="p-3 text-white hover:text-[#00d2ff] transition-colors active:scale-95"
                >
                  <SkipBack className="w-10 h-10 fill-current" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-20 h-20 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 fill-black" />
                  ) : (
                    <Play className="w-10 h-10 fill-black ml-2" />
                  )}
                </button>
                <button
                  onClick={playNext}
                  className="p-3 text-white hover:text-[#00d2ff] transition-colors active:scale-95"
                >
                  <SkipForward className="w-10 h-10 fill-current" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`p-2 transition-colors relative ${repeatMode !== 'none' ? 'text-[#00d2ff]' : 'text-white/50 hover:text-white'}`}
                >
                  <Repeat className="w-6 h-6" />
                  {repeatMode === 'one' && (
                      <span className="absolute text-[8px] font-bold -top-1 -right-1 bg-[#00d2ff] text-black rounded-full w-3 h-3 flex items-center justify-center">1</span>
                  )}
                </button>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-center items-center space-x-8 pt-4 pb-2 text-white/50">
                <button onClick={toggleMute} className="hover:text-white transition-colors">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button onClick={handleShare} className="hover:text-white transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
