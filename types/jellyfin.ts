export interface MediaStream {
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

export interface MediaSource {
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

export interface PlaybackInfo {
  MediaSources: MediaSource[];
  PlaySessionId: string;
}