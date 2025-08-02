import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings } from 'lucide-react';
import Hls from 'hls.js';

// Icon components for easy replacement
const PlayIcon = () => <Play className="w-6 h-6" fill="white" />;
const PauseIcon = () => <Pause className="w-6 h-6" fill="white" />;
const VolumeIcon = () => <Volume2 className="w-5 h-5" />;
const MuteIcon = () => <VolumeX className="w-5 h-5" />;
const FullscreenIcon = () => <Maximize className="w-5 h-5" />;
const BackwardIcon = () => <SkipBack className="w-5 h-5" />;
const ForwardIcon = () => <SkipForward className="w-5 h-5" />;
const SettingsIcon = () => <Settings className="w-5 h-5" />;

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  maxDuration?: number; // Duration in seconds from Jellyfin RuntimeTicks
}

export const NetflixVideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  title = "Video Title",
  poster,
  maxDuration 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [isHlsSupported, setIsHlsSupported] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Initialize HLS
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Check if the source is an HLS stream (m3u8 file)
    const isHlsStream = src.includes('.m3u8') || src.includes('application/vnd.apple.mpegurl');
    
    if (isHlsStream) {
      if (Hls.isSupported()) {
        console.log('HLS is supported, initializing...');
        setIsHlsSupported(true);
        
        // Clean up existing HLS instance
        if (hlsInstance) {
          hlsInstance.destroy();
        }
        
        const hls = new Hls({
          debug: false,
          enableWorker: true,
        //   lowBufferWatchdogPeriod: 0.5,
          highBufferWatchdogPeriod: 3,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1,
          autoStartLoad: true,
          startPosition: -1,
          defaultAudioCodec: undefined,
        //   debug: false,
          capLevelOnFPSDrop: false,
          capLevelToPlayerSize: false,
          ignoreDevicePixelRatio: false,
        });
        
        // HLS event listeners
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully');
          setIsBuffering(false);
          setVideoError(null); // Clear any previous errors
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          // Only log fatal errors or important non-fatal errors
          if (data.fatal) {
            console.error('HLS Fatal Error:', {
              type: data.type,
              details: data.details,
              fatal: data.fatal
            });
            
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Attempting to recover from fatal network error...');
                setVideoError('Network connection issue. Attempting to reconnect...');
                setTimeout(() => {
                  hls.startLoad();
                  setVideoError(null);
                }, 1000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Attempting to recover from fatal media error...');
                setVideoError('Media playback issue. Attempting to recover...');
                setTimeout(() => {
                  hls.recoverMediaError();
                  setVideoError(null);
                }, 1000);
                break;
              default:
                console.error('Unrecoverable HLS error');
                setVideoError('Video playback failed. Please try refreshing the page.');
                hls.destroy();
                break;
            }
          } else {
            // Non-fatal errors - only log if they're not common fragment load errors
            if (data.details !== 'fragLoadError' && data.details !== 'fragLoadTimeOut') {
              console.warn('HLS Non-fatal Error:', {
                type: data.type,
                details: data.details
              });
            }
            // HLS.js will handle recovery automatically for non-fatal errors
          }
        });
        
        // Add loading and recovery event handlers
        hls.on(Hls.Events.FRAG_LOAD_EMERGENCY_ABORTED, () => {
          console.log('Fragment load aborted, HLS.js will retry automatically');
        });
        
        hls.on(Hls.Events.LEVEL_LOADED, () => {
          setIsBuffering(false);
        });
        
        hls.loadSource(src);
        hls.attachMedia(video);
        setHlsInstance(hls);
        
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        console.log('Using native HLS support');
        setIsHlsSupported(true);
        video.src = src;
      } else {
        console.error('HLS is not supported in this browser.');
        setIsHlsSupported(false);
      }
    } else {
      // Regular video file
      console.log('Loading regular video file');
      video.src = src;
      setIsHlsSupported(false);
    }
    
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [src]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPlaying && !isHovering) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, isHovering]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Update buffered time
      const buffered = videoRef.current.buffered;
      if (buffered.length > 0) {
        setBufferedTime(buffered.end(buffered.length - 1));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      // Use maxDuration from Jellyfin if available and video duration seems incorrect
      const finalDuration = maxDuration && (videoDuration === Infinity || videoDuration > maxDuration) 
        ? maxDuration 
        : videoDuration;
      setDuration(finalDuration);
      setIsBuffering(false);
    }
  };

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100;
  const bufferedPercentage = (bufferedTime / duration) * 100;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setIsHovering(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onLoadStart={() => setIsBuffering(true)}
        onError={(e) => {
          console.error('Video error:', e.currentTarget.error);
          const error = e.currentTarget.error;
          if (error) {
            setVideoError(`Video error: ${error.message || 'Unknown error'}`);
          }
          setIsBuffering(false);
        }}
      />

      {/* Error Overlay */}
      {(videoError || (!isHlsSupported && src.includes('.m3u8'))) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center max-w-md px-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-2xl font-bold mb-4">Playback Error</h2>
            <p className="text-gray-300 mb-6">
              {videoError || 'Your browser does not support HLS video streaming. Please try using a different browser like Chrome, Firefox, or Safari.'}
            </p>
            <div className="text-sm text-gray-400">
              <p>Supported browsers:</p>
              <p>• Chrome/Edge (with HLS.js)</p>
              <p>• Firefox (with HLS.js)</p>
              <p>• Safari (native HLS support)</p>
            </div>
          </div>
        </div>
      )}

      {/* Title Overlay */}
      <div className={`absolute top-4 left-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <h1 className="text-white text-2xl font-bold drop-shadow-lg">
          {title}
        </h1>
      </div>

      {/* Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        
        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isBuffering ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
              <div className="text-white text-sm font-medium">Buffering...</div>
            </div>
          ) : (
            <button
              onClick={togglePlay}
              className="bg-black/50 hover:bg-black/70 rounded-full p-4 transition-all duration-200 hover:scale-110"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              ref={progressRef}
              className="relative h-1 bg-gray-600 rounded-full cursor-pointer hover:h-2 transition-all duration-200 group"
              onClick={handleProgressClick}
            >
              {/* Buffered Progress */}
              <div
                className="absolute h-full bg-gray-400 rounded-full"
                style={{ width: `${bufferedPercentage}%` }}
              />
              
              {/* Current Progress */}
              <div
                className="absolute h-full bg-red-600 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skipTime(-10)}
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                <BackwardIcon />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skipTime(10)}
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                <ForwardIcon />
              </button>

              {/* Volume Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  {isMuted ? <MuteIcon /> : <VolumeIcon />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Settings (placeholder for future functionality) */}
              <button className="text-white hover:text-gray-300 transition-colors duration-200">
                <SettingsIcon />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors duration-200"
              >
                <FullscreenIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};