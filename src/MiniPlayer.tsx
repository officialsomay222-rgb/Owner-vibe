import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward } from 'lucide-react';
import { useMusic } from './MusicContext';
import { useAudioTime } from './hooks/useAudioTime';

const MiniProgressBar = ({ duration, audioRef }: { duration: number, audioRef: React.RefObject<HTMLAudioElement | null> }) => {
  const currentTime = useAudioTime(audioRef);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-0 h-[2px] bg-white/20 w-full">
      <div
        className="h-full bg-white/80 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const MiniPlayer = () => {
  const { currentSong, isExpanded, setIsExpanded, isPlaying, isLoadingStream, togglePlayPause, playNext, duration, audioRef } = useMusic();

  if (!currentSong || isExpanded) return null;
  const mediumResThumb = currentSong?.thumbnailUrl?.replace(/=w\d+-h\d+/, '=w120-h120') || currentSong?.thumbnailUrl;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] inset-x-2 z-40 max-w-md mx-auto"
      >
        <div
          onClick={() => setIsExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Expand player, currently playing ${currentSong.title} by ${currentSong.artist}`}
          className="relative overflow-hidden bg-[#1a1a1a]/90 backdrop-blur-xl transform-gpu will-change-transform border border-white/5 rounded-xl p-2 flex items-center justify-between cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          {/* Progress Bar Line */}
          <MiniProgressBar duration={duration} audioRef={audioRef} />

          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
              <img
                src={mediumResThumb}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white text-[15px] font-bold truncate">
                {currentSong.title}
              </span>
              <span className="text-white/60 text-[13px] truncate">
                {currentSong.artist}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 pr-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoadingStream) {
                   togglePlayPause();
                }
              }}
              disabled={isLoadingStream}
              aria-label={isLoadingStream ? 'Loading audio' : isPlaying ? 'Pause' : 'Play'}
              className={`p-2 transition-colors ${isLoadingStream ? 'text-white/50 cursor-not-allowed' : 'text-white hover:text-white/80'}`}
            >
              {isLoadingStream ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playNext();
              }}
              aria-label="Next track"
              className="p-2 text-white hover:text-white/80 transition-colors"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
