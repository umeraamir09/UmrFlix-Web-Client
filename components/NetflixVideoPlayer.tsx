import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings } from 'lucide-react';
import Hls from 'hls.js';
import { SubtitleAudioMenu } from './SubtitleAudioMenu';

// Icon components for easy replacement
const PlayIcon = () => <Play className="w-6 h-6" fill="white" />;
const PauseIcon = () => <Pause className="w-6 h-6" fill="white" />;
const VolumeIcon = () => <Volume2 className="w-5 h-5" />;
const MuteIcon = () => <VolumeX className="w-5 h-5" />;
const FullscreenIcon = () => <Maximize className="w-5 h-5" />;
const BackwardIcon = () => <SkipBack className="w-5 h-5" />;
const ForwardIcon = () => <SkipForward className="w-5 h-5" />;
const SettingsIcon = () => <Settings className="w-5 h-5" />;

interface MediaStream {
  Codec: string;
  Language?: string;
  Type: 'Video' | 'Audio' | 'Subtitle';
  Index: number;
  Height?: number;
  Width?: number;
  BitRate?: number;
  IsDefault: boolean;
  DisplayTitle: string;
  DeliveryUrl?: string;
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  maxDuration?: number; // Duration in seconds from Jellyfin RuntimeTicks
  startTime?: number; // Starting position in seconds
  itemId?: string; // For thumbnail generation
  serverUrl?: string; // Server URL for thumbnail requests
  apiKey?: string; // API key for thumbnail requests
  mediaStreams?: MediaStream[]; // Available audio and subtitle streams
  onSubtitleChange?: (stream: MediaStream | null) => void;
  onAudioChange?: (stream: MediaStream) => void;
}

export const NetflixVideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  title = "Video Title",
  poster,
  maxDuration,
  startTime = 0,
  itemId,
  serverUrl,
  apiKey,
  mediaStreams = [],
  onSubtitleChange,
  onAudioChange
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
  const [isDragging, setIsDragging] = useState(false);
  
  // Trickplay states
  const [isProgressHovering, setIsProgressHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Subtitle and audio states
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number | undefined>(undefined);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number | undefined>(undefined);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState<HTMLTrackElement | null>(null);

  // Debug: Log media streams
  useEffect(() => {
    console.log('NetflixVideoPlayer: Media streams received:', mediaStreams);
    console.log('NetflixVideoPlayer: Server URL:', serverUrl);
    console.log('NetflixVideoPlayer: Item ID:', itemId);
    console.log('NetflixVideoPlayer: API Key:', apiKey ? 'Present' : 'Missing');
    
    if (mediaStreams && mediaStreams.length > 0) {
      const subtitleStreams = mediaStreams.filter(stream => stream.Type === 'Subtitle');
      console.log('NetflixVideoPlayer: Subtitle streams found:', subtitleStreams);
    }
  }, [mediaStreams, serverUrl, itemId, apiKey]);

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
          highBufferWatchdogPeriod: 3,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1,
          autoStartLoad: true,
          startPosition: 0, // Default to start from the beginning
          defaultAudioCodec: undefined,
          capLevelOnFPSDrop: false,
          capLevelToPlayerSize: false,
          ignoreDevicePixelRatio: false,
        });
        
        // HLS event listeners
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully');
          setIsBuffering(false);
          setVideoError(null); // Clear any previous errors

          // Start from the specified start time
          if (videoRef.current && startTime > 0) {
            videoRef.current.currentTime = startTime;
            console.log(`Starting playback from ${startTime} seconds`);
          }
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
        
        // Set start time for Safari native HLS
        if (startTime > 0) {
          video.addEventListener('loadedmetadata', () => {
            video.currentTime = startTime;
            console.log(`Starting Safari HLS playback from ${startTime} seconds`);
          }, { once: true });
        }
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

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (mouseX / rect.width) * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add drag functionality using useEffect
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

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
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Trickplay functions
  const generateThumbnailUrl = (timeInSeconds: number): string => {
    if (!serverUrl || !itemId || !apiKey) {
      return '';
    }
    
    // Convert seconds to ticks (Jellyfin uses ticks: 1 second = 10,000,000 ticks)
    const ticks = Math.floor(timeInSeconds * 10000000);
    
    // Generate thumbnail URL for Jellyfin
    return `${serverUrl}/Items/${itemId}/Images/Primary?maxHeight=200&maxWidth=300&tag=thumbnail&positionTicks=${ticks}&api_key=${apiKey}`;
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = mouseX / rect.width;
    const time = percentage * duration;
    
    setHoverTime(time);
    setHoverPosition(mouseX);
    setIsProgressHovering(true);
    
    // Load preview image with debouncing
    const thumbnailUrl = generateThumbnailUrl(time);
    if (thumbnailUrl && thumbnailUrl !== previewImage) {
      setIsLoadingPreview(true);
      
      // Create a new image to preload
      const img = new Image();
      img.onload = () => {
        setPreviewImage(thumbnailUrl);
        setIsLoadingPreview(false);
      };
      img.onerror = () => {
        setIsLoadingPreview(false);
        // Fallback: try to generate a canvas thumbnail from the video
        generateCanvasThumbnail(time);
      };
      img.src = thumbnailUrl;
    }
  };

  const generateCanvasThumbnail = (timeInSeconds: number) => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 200;
    
    // Store current time
    const originalTime = video.currentTime;
    
    // Temporarily seek to the hover time
    const seekAndCapture = () => {
      video.currentTime = timeInSeconds;
      
      const captureFrame = () => {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPreviewImage(dataUrl);
          
          // Restore original time
          video.currentTime = originalTime;
        } catch (error) {
          console.warn('Failed to generate canvas thumbnail:', error);
          // Restore original time even on error
          video.currentTime = originalTime;
        }
      };
      
      // Wait for seek to complete
      video.addEventListener('seeked', captureFrame, { once: true });
    };
    
    // Only generate canvas thumbnail if video is loaded and not currently seeking
    if (video.readyState >= 2 && !isDragging) {
      seekAndCapture();
    }
  };

  const handleProgressLeave = () => {
    setIsProgressHovering(false);
    setPreviewImage(null);
  };

  // Subtitle handling functions
  const generateSubtitleUrl = (subtitleStream: MediaStream): string => {
    if (!serverUrl || !itemId || !apiKey) return '';
    
    // Generate proxy URL for subtitles to avoid CORS issues
    const proxyUrl = `/api/subtitles/Videos/${itemId}/Subtitles/${subtitleStream.Index}/0/Stream.vtt?serverUrl=${encodeURIComponent(serverUrl)}&apiKey=${apiKey}`;
    
    console.log('Generated proxy subtitle URL:', proxyUrl);
    console.log('Subtitle stream info:', subtitleStream);
    
    return proxyUrl;
  };

  const applySubtitleUrl = async (url: string, subtitleStream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = subtitleStream.DisplayTitle || subtitleStream.Language || 'Unknown';
      track.srclang = subtitleStream.Language || 'en';
      track.src = url;
      track.default = true;

      video.appendChild(track);

      track.addEventListener('load', () => {
        console.log('Subtitle track loaded successfully:', subtitleStream.DisplayTitle, 'using URL:', url);
        // Force enable subtitles immediately
        const textTrack = track.track || video.textTracks[video.textTracks.length - 1];
        if (textTrack) {
          textTrack.mode = 'showing';
          console.log('Subtitle track mode set to showing:', textTrack.mode);
          console.log('Subtitle cues loaded:', textTrack.cues ? textTrack.cues.length : 'No cues');
        }
      });

      track.addEventListener('error', (e) => {
        console.error('Failed to load subtitle track:', e);
        track.remove();
      });

      // Also try to enable immediately in case the track loads synchronously
      setTimeout(() => {
        const textTrack = track.track || video.textTracks[video.textTracks.length - 1];
        if (textTrack) {
          textTrack.mode = 'showing';
          console.log('Delayed subtitle enable - mode:', textTrack.mode);
          console.log('Text tracks count:', video.textTracks.length);
          for (let i = 0; i < video.textTracks.length; i++) {
            console.log(`Track ${i}:`, video.textTracks[i].label, 'mode:', video.textTracks[i].mode);
          }
        }
      }, 100);

      setCurrentSubtitleTrack(track);
      setSelectedSubtitleIndex(subtitleStream.Index);
    } catch (error) {
      console.error('Error applying subtitles:', error);
    }
  };

  const loadSubtitle = async (subtitleStream: MediaStream | null) => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Remove existing subtitle tracks
    const existingTracks = video.querySelectorAll('track[kind="subtitles"]');
    existingTracks.forEach(track => track.remove());
    setCurrentSubtitleTrack(null);
    
    if (!subtitleStream) {
      setSelectedSubtitleIndex(undefined);
      console.log('Subtitles turned off');
      return;
    }
    
    // Validate required parameters
    if (!serverUrl || !itemId || !apiKey) {
      console.error('Missing required parameters for subtitle loading:', {
        serverUrl: serverUrl ? 'Present' : 'Missing',
        itemId: itemId ? 'Present' : 'Missing',
        apiKey: apiKey ? 'Present' : 'Missing'
      });
      return;
    }
    
    // Validate subtitle stream data
    if (!subtitleStream.Index && subtitleStream.Index !== 0) {
      console.error('Subtitle stream missing Index:', subtitleStream);
      return;
    }
    
    // Use the delivery URL if available, but proxy it to avoid CORS issues
    if (subtitleStream.DeliveryUrl) {
      // Create proxy URL for the delivery URL
      const proxyUrl = `/api/subtitles${subtitleStream.DeliveryUrl}?serverUrl=${encodeURIComponent(serverUrl)}&apiKey=${apiKey}`;
      console.log('Using proxy for delivery URL:', proxyUrl);
      console.log('Original delivery URL:', subtitleStream.DeliveryUrl);
      
      applySubtitleUrl(proxyUrl, subtitleStream);
      return;
    }
    
    function tryOtherUrlFormats() {
      // Try multiple URL formats using correct Jellyfin API format
      // Format: /Videos/{itemId}/{itemIdWithoutDashes}/Subtitles/{routeIndex}/{routeStartPositionTicks}/Stream.{routeFormat}
      const itemIdWithoutDashes = itemId?.replace(/-/g, '');
      const urlFormats = [
        `${serverUrl}/Videos/${itemId}/${itemIdWithoutDashes}/Subtitles/${subtitleStream?.Index}/0/Stream.vtt`,
        `${serverUrl}/Videos/${itemId}/${itemIdWithoutDashes}/Subtitles/${subtitleStream?.Index}/0/Stream.srt`,
        `${serverUrl}/Videos/${itemId}/Subtitles/${subtitleStream?.Index}/0/Stream.vtt`,
        `${serverUrl}/Videos/${itemId}/Subtitles/${subtitleStream?.Index}/0/Stream.srt`,
        `${serverUrl}/Items/${itemId}/Subtitles/${subtitleStream?.Index}/0/Stream.vtt`,
        `${serverUrl}/Items/${itemId}/Subtitles/${subtitleStream?.Index}/0/Stream.srt`
      ];
      
      const tryLoadSubtitle = async (urlIndex: number): Promise<void> => {
        if (urlIndex >= urlFormats.length) {
          console.error('All subtitle URL formats failed for stream:', subtitleStream);
          return;
        }
        
        const url = urlFormats[urlIndex];
        console.log(`Trying subtitle URL ${urlIndex + 1}/${urlFormats.length}:`, url);
        
        try {
          // Test if the URL is accessible
          const response = await fetch(url, { method: 'HEAD' });
          if (!response.ok) {
            console.warn(`Subtitle URL ${urlIndex + 1} failed with status:`, response.status);
            return tryLoadSubtitle(urlIndex + 1);
          }
          
          // Create new track element
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = subtitleStream?.DisplayTitle || subtitleStream?.Language || 'Unknown';
          track.srclang = subtitleStream?.Language || 'en';
          track.src = url;
          track.default = true;
          
          // Add track to video
          video.appendChild(track);
          
          // Wait for track to load
          track.addEventListener('load', () => {
            console.log('Subtitle track loaded successfully:', subtitleStream?.DisplayTitle, 'using URL:', url);
            if (video.textTracks.length > 0) {
              const textTrack = video.textTracks[video.textTracks.length - 1]; // Get the last added track
              textTrack.mode = 'showing';
              console.log('Subtitle track enabled');
            }
          });
          
          track.addEventListener('error', (e) => {
            console.error(`Subtitle URL ${urlIndex + 1} failed to load:`, e);
            track.remove(); // Remove the failed track
            tryLoadSubtitle(urlIndex + 1); // Try next URL
          });
          
          setCurrentSubtitleTrack(track);
          setSelectedSubtitleIndex(subtitleStream?.Index);
          
        } catch (error) {
          console.error(`Error testing subtitle URL ${urlIndex + 1}:`, error);
          return tryLoadSubtitle(urlIndex + 1);
        }
      };
      
      tryLoadSubtitle(0);
    }
  };

  const handleSubtitleChange = (stream: MediaStream | null) => {
    loadSubtitle(stream);
    if (onSubtitleChange) {
      onSubtitleChange(stream);
    }
  };

  const handleAudioChange = (stream: MediaStream) => {
    setSelectedAudioIndex(stream.Index);
    console.log('Audio track changed to:', stream.DisplayTitle);
    
    // For HLS streams, we need to change the audio track
    if (hlsInstance && hlsInstance.audioTracks) {
      const hlsAudioTrack = hlsInstance.audioTracks.find(track => 
        track.name === stream.DisplayTitle || track.lang === stream.Language
      );
      if (hlsAudioTrack) {
        hlsInstance.audioTrack = hlsAudioTrack.id;
        console.log('HLS audio track changed to:', hlsAudioTrack);
      }
    }
    
    if (onAudioChange) {
      onAudioChange(stream);
    }
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
              className="relative h-1 bg-gray-600 rounded-full cursor-pointer hover:h-2 transition-all duration-200 group" onMouseMove={handleProgressHover} onMouseLeave={handleProgressLeave}
              onMouseDown={handleProgressMouseDown}
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
            {/* Subtitle and Audio Menu */}
            <SubtitleAudioMenu 
              mediaStreams={mediaStreams}
              serverUrl={serverUrl || ''}
              itemId={itemId || ''}
              apiKey={apiKey || ''}
              onSubtitleChange={handleSubtitleChange}
              onAudioChange={handleAudioChange}
              selectedSubtitleIndex={selectedSubtitleIndex}
              selectedAudioIndex={selectedAudioIndex}
            />

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
        
        /* Custom subtitle styling */
        video::cue {
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 20px;
          font-family: Arial, sans-serif;
          font-weight: normal;
          text-align: center;
          line-height: 1.4;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        video::-webkit-media-text-track-display {
          color: white;
          background-color: rgba(0, 0, 0, 0.8);
          font-size: 20px;
          font-family: Arial, sans-serif;
          font-weight: normal;
          text-align: center;
          padding: 2px 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};