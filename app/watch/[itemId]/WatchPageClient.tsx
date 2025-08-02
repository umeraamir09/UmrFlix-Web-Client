// app/watch/[itemId]/WatchPageClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NetflixVideoPlayer } from '@/components/NetflixVideoPlayer';
// Server-side auth is handled by the parent server component

interface Creds {
    token: string;
    userId: string;
}

// Types based on the Jellyfin API response
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
}

interface MediaSource {
  Protocol: string;
  Id: string;
  Path: string;
  Container: string;
  Size: number;
  Name: string;
  RunTimeTicks: number;
  SupportsDirectPlay: boolean;
  SupportsDirectStream: boolean;
  SupportsTranscoding: boolean;
  MediaStreams: MediaStream[];
  Bitrate: number;
}

interface PlaybackInfo {
  MediaSources: MediaSource[];
  PlaySessionId: string;
}

interface ItemDetails {
  Id: string;
  Name: string;
  Overview?: string;
  RunTimeTicks: number;
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[];
  Type: string;
  ProductionYear?: number;
}

interface WatchPageClientProps {
  itemId: string;
  serverUrl: string;
}

const WatchPageClient: React.FC<WatchPageClientProps> = ({ itemId, serverUrl }) => {
  const router = useRouter();
  const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [maxDuration, setMaxDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Helper function to convert ticks to seconds
  const ticksToSeconds = (ticks: number): number => {
    return Math.floor(ticks / 10000000); // 1 tick = 100 nanoseconds
  };

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

//   // Get authentication token from localStorage (adjust based on your auth implementation)
//   const getAuthToken = (): string => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('jellyfin_access_token') || '';
//     }
//     return '';
//   };

//   // Get user ID (adjust based on your auth implementation)
//   const getUserId = (): string => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('jellyfin_user_id') || '';
//     }
//     return '';
//   };

  const [credentials, setCredentials] = useState<Creds | null>(null)

  useEffect(() => {
    const getAuth = async () => {
        // Get auth from cookies via API call instead of directly using server functions
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const auth = await response.json();
            setCredentials({
              token: auth.jellyfinToken as string,
              userId: auth.userId as string
            });
          } else {
            throw new Error('Not authenticated');
          }
        } catch (error) {
          console.error('Auth error:', error);
          setError('Authentication failed. Please log in.');
        }
    }

    getAuth()
  }, [])

  // Fetch continue watching position
  const fetchContinueWatchingPosition = async (): Promise<number> => {
    try {
      const response = await fetch('/api/media/getContinueWatching', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const currentItem = data.items?.find((item: any) => item.Id === itemId);
        if (currentItem?.ContinueFrom) {
          // Convert ticks to seconds
          return Math.floor(currentItem.ContinueFrom / 10000000);
        }
      }
    } catch (error) {
      console.error('Failed to fetch continue watching position:', error);
    }
    return 0;
  };

  // Fetch item details
  const fetchItemDetails = async (): Promise<ItemDetails | null> => {
    try {
      const token = credentials?.token;
      const userId = credentials?.userId;
      
      if (!token || !userId) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${serverUrl}/Users/${userId}/Items/${itemId}`,
        {
          headers: {
            'Authorization': `MediaBrowser Token="${token}"`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch item details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching item details:', error);
      return null;
    }
  };

  // Fetch playback info
  const fetchPlaybackInfo = async (): Promise<PlaybackInfo | null> => {
    try {
      const token = credentials?.token;
      const userId = credentials?.userId;

      if (!token || !userId) {
        throw new Error('Authentication required');
      }

      // Get device profile for optimal transcoding
      const deviceProfile = {
        MaxStreamingBitrate: 120000000,
        MaxStaticBitrate: 100000000,
        MusicStreamingTranscodingBitrate: 384000,
        DirectPlayProfiles: [
          {
            Container: "webm",
            Type: "Video",
            VideoCodec: "vp8,vp9,av1",
            AudioCodec: "vorbis,opus"
          },
          {
            Container: "mp4,m4v",
            Type: "Video",
            VideoCodec: "h264,h265,hevc,av1,vp8,vp9",
            AudioCodec: "aac,mp3,opus,flac,vorbis"
          }
        ],
        TranscodingProfiles: [
          {
            Container: "mp4",
            Type: "Video",
            VideoCodec: "h264",
            AudioCodec: "aac",
            Protocol: "http",
            EstimateContentLength: false,
            EnableMpegtsM2TsMode: false,
            TranscodeSeekInfo: "Auto",
            CopyTimestamps: false,
            Context: "Streaming",
            EnableSubtitlesInManifest: true,
            MaxAudioChannels: "2"
          }
        ],
        ContainerProfiles: [],
        CodecProfiles: [],
        SubtitleProfiles: [
          {
            Format: "vtt",
            Method: "External"
          },
          {
            Format: "ass",
            Method: "External"
          },
          {
            Format: "ssa",
            Method: "External"
          }
        ]
      };

      const response = await fetch(
        `${serverUrl}/Items/${itemId}/PlaybackInfo?UserId=${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `MediaBrowser Token="${token}"`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            DeviceProfile: deviceProfile,
            AutoOpenLiveStream: true,
            EnableDirectPlay: true,
            EnableDirectStream: true,
            EnableTranscoding: true,
            AllowVideoStreamCopy: true,
            AllowAudioStreamCopy: true
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch playback info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching playback info:', error);
      return null;
    }
  };

  // Generate stream URL based on playback capabilities
  const generateStreamUrl = (playbackInfo: PlaybackInfo): string => {
    const mediaSource = playbackInfo.MediaSources[0];
      const token = credentials?.token;
    
    if (!mediaSource) {
      throw new Error('No media source available');
    }

    // Set max duration from runtime ticks
    const durationInSeconds = ticksToSeconds(mediaSource.RunTimeTicks);
    setMaxDuration(durationInSeconds);

    // Priority 1: Direct Play (if supported and file is accessible)
    if (mediaSource.SupportsDirectPlay && mediaSource.Protocol === 'File') {
      return `${serverUrl}/Videos/${itemId}/stream?static=true&MediaSourceId=${mediaSource.Id}&api_key=${token}`;
    }
    
    // Priority 2: Direct Stream (if supported)
    if (mediaSource.SupportsDirectStream) {
      return `${serverUrl}/Videos/${itemId}/stream?MediaSourceId=${mediaSource.Id}&api_key=${token}`;
    }
    
    // Priority 3: Transcoded stream (optimized for web playback)
    if (mediaSource.SupportsTranscoding) {
      const videoStream = mediaSource.MediaStreams.find(s => s.Type === 'Video');
      const audioStream = mediaSource.MediaStreams.find(s => s.Type === 'Audio');
      
      const transcodingParams = new URLSearchParams({
        MediaSourceId: mediaSource.Id,
        VideoCodec: 'h264',
        AudioCodec: 'aac',
        VideoBitrate: '8000000', // 8 Mbps for good quality
        AudioBitrate: '128000',  // 128 kbps
        MaxWidth: '1920',
        MaxHeight: '1080',
        PlaySessionId: playbackInfo.PlaySessionId,
        api_key: token ?? ''
      } as Record<string, string>);

      // Add video stream index if available
      if (videoStream) {
        transcodingParams.append('VideoStreamIndex', videoStream.Index.toString());
      }

      // Add audio stream index if available
      if (audioStream) {
        transcodingParams.append('AudioStreamIndex', audioStream.Index.toString());
      }

      return `${serverUrl}/Videos/${itemId}/master.m3u8?${transcodingParams.toString()}`;
    }

    throw new Error('No supported playback method available');
  };

  // Generate image URLs
  const generateImageUrls = (itemDetails: ItemDetails) => {
      const token = credentials?.token;
    
    // Primary image (poster)
    if (itemDetails.ImageTags?.Primary) {
      setPosterUrl(`${serverUrl}/Items/${itemId}/Images/Primary?tag=${itemDetails.ImageTags.Primary}&api_key=${token}`);
    }
    // Fallback to backdrop if no primary image
    else if (itemDetails.BackdropImageTags && itemDetails.BackdropImageTags.length > 0) {
      setPosterUrl(`${serverUrl}/Items/${itemId}/Images/Backdrop/0?tag=${itemDetails.BackdropImageTags[0]}&api_key=${token}`);
    }
  };

  // Main data fetching effect
  useEffect(() => {
    const loadWatchData = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Check if we have auth tokens
      const token = credentials?.token;
      const userId = credentials?.userId;
        
        if (!token || !userId) {
          throw new Error('Please log in to continue');
        }

        // Fetch continue watching position first
        const continueFromSeconds = await fetchContinueWatchingPosition();
        setStartTime(continueFromSeconds);

        // Fetch both item details and playback info concurrently
        const [itemDetailsResponse, playbackInfoResponse] = await Promise.all([
          fetchItemDetails(),
          fetchPlaybackInfo()
        ]);

        if (!itemDetailsResponse) {
          throw new Error('Failed to load item details');
        }

        if (!playbackInfoResponse) {
          throw new Error('Failed to load playback information');
        }

        setItemDetails(itemDetailsResponse);
        setPlaybackInfo(playbackInfoResponse);

        // Generate stream URL
        const url = generateStreamUrl(playbackInfoResponse);
        setStreamUrl(url);

        // Generate image URLs
        generateImageUrls(itemDetailsResponse);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (itemId && typeof window !== 'undefined' && credentials) {
      loadWatchData();
    }
  }, [itemId, serverUrl, credentials]);

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center space-y-4">
        {/* Netflix-style loading spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        </div>
        <div className="text-white text-lg font-medium">Loading...</div>
        {maxDuration > 0 && (
          <div className="text-gray-400 text-sm">
            Duration: {formatDuration(maxDuration)}
          </div>
        )}
      </div>
    </div>
  );

  // Error component
  const ErrorDisplay = () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center space-y-4 text-center max-w-md">
        <div className="text-red-500 text-6xl">⚠️</div>
        <h2 className="text-white text-2xl font-bold">Playback Error</h2>
        <p className="text-gray-400 text-lg">{error}</p>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Retry
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (error) {
    return <ErrorDisplay />;
  }

  // Show video player when data is loaded
  if (streamUrl && itemDetails) {
    return (
      <div className="w-full h-screen">
        <NetflixVideoPlayer
          src={streamUrl}
          title={itemDetails.Name}
          poster={posterUrl}
          maxDuration={maxDuration} // Pass max duration to prevent weird behavior
          startTime={startTime} // Start from continue watching position
        />
      </div>
    );
  }

  return <LoadingSpinner />;
};

export default WatchPageClient;