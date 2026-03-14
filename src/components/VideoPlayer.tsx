import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Download, 
  RotateCcw, 
  Sparkles,
  Settings,
  MoreVertical,
  FastForward,
  Rewind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  showWatermark?: boolean;
  customWatermark?: string | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, showWatermark, customWatermark }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!src) return;

    const fetchVideo = async () => {
      setLoading(true);
      try {
        const isVeoUrl = src.includes('generativelanguage.googleapis.com') || src.includes('googlevideo.com');
        const isSimulation = src.includes('storage.googleapis.com');
        const apiKey = process.env.API_KEY;

        if (apiKey && isVeoUrl && !isSimulation) {
          const response = await fetch(src, {
            headers: {
              'x-goog-api-key': apiKey,
            },
          });
          
          if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        } else {
          setVideoUrl(src);
        }
      } catch (error) {
        console.error("Error fetching video:", error);
        setVideoUrl(src);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();

    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          skip(-5);
          break;
        case 'arrowright':
          skip(5);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const changeVolume = (delta: number) => {
    const newVolume = Math.min(1, Math.max(0, volume + delta));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleDownload = async () => {
    if (!videoUrl) return;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptvision_video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed", err);
      window.open(videoUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="aspect-video w-full glass-card flex flex-col items-center justify-center gap-4 animate-pulse rounded-2xl border border-white/10">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-neon-blue/20 border-t-neon-blue animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-blue w-4 h-4" />
        </div>
        <div className="text-neon-blue font-mono text-xs tracking-widest uppercase">Initializing Player...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group rounded-2xl overflow-hidden glass-card neon-glow border border-white/10 bg-black transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'aspect-video'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay
        loop
      />

      {/* Watermark */}
      {showWatermark && (
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 pointer-events-none select-none z-10">
          {customWatermark ? (
            <img src={customWatermark} alt="Watermark" className="h-4 object-contain" />
          ) : (
            <>
              <Sparkles size={14} className="text-neon-blue" />
              <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">PromptVision</span>
            </>
          )}
        </div>
      )}

      {/* Center Play Overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-neon-blue/20 backdrop-blur-xl border border-neon-blue/40 flex items-center justify-center text-neon-blue shadow-2xl shadow-neon-blue/20">
              <Play size={32} fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-12 transition-all duration-300"
      >
        {/* Progress Bar */}
        <div className="relative group/progress mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-neon-blue hover:h-2 transition-all"
          />
          <div 
            className="absolute left-0 top-0 h-1 bg-neon-blue rounded-full pointer-events-none group-hover/progress:h-2 transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-neon-blue transition-colors">
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-neon-blue transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-neon-blue transition-all"
              />
            </div>

            <div className="text-[10px] font-mono text-white/60 tracking-wider">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-neon-blue transition-colors"
              >
                <Settings size={20} />
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute bottom-full right-0 mb-4 w-32 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                  >
                    {[0.5, 1, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => {
                          if (videoRef.current) videoRef.current.playbackRate = rate;
                          setPlaybackRate(rate);
                          setShowSettings(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-[10px] font-bold transition-colors ${playbackRate === rate ? 'text-neon-blue bg-neon-blue/10' : 'text-white/60 hover:bg-white/5'}`}
                      >
                        {rate}x Speed
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={handleDownload} className="text-white hover:text-neon-blue transition-colors">
              <Download size={20} />
            </button>

            <button onClick={toggleFullscreen} className="text-white hover:text-neon-blue transition-colors">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
