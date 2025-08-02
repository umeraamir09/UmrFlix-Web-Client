import React, { useState, useRef, useEffect } from 'react';
import { Subtitles, Audio } from './icons';

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

interface SubtitleAudioMenuProps {
  mediaStreams: MediaStream[];
  serverUrl: string;
  itemId: string;
  apiKey: string;
  onSubtitleChange: (stream: MediaStream | null) => void;
  onAudioChange: (stream: MediaStream) => void;
  selectedSubtitleIndex?: number;
  selectedAudioIndex?: number;
}

export const SubtitleAudioMenu: React.FC<SubtitleAudioMenuProps> = ({
  mediaStreams,
  serverUrl,
  itemId,
  apiKey,
  onSubtitleChange,
  onAudioChange,
  selectedSubtitleIndex,
  selectedAudioIndex
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitles'>('subtitles');
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter streams by type
  const audioStreams = mediaStreams.filter(stream => stream.Type === 'Audio');
  const subtitleStreams = mediaStreams.filter(stream => stream.Type === 'Subtitle');

  // Only show the button if there are audio or subtitle streams
  const hasStreams = audioStreams.length > 0 || subtitleStreams.length > 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle subtitle selection
  const handleSubtitleSelect = (stream: MediaStream | null) => {
    onSubtitleChange(stream);
    setIsOpen(false);
  };

  // Handle audio selection
  const handleAudioSelect = (stream: MediaStream) => {
    onAudioChange(stream);
    setIsOpen(false);
  };

  // Format language display
  const formatLanguage = (stream: MediaStream): string => {
    if (stream.DisplayTitle) {
      return stream.DisplayTitle;
    }
    
    let display = stream.Language || 'Unknown';
    
    // Add codec info for audio streams
    if (stream.Type === 'Audio' && stream.Codec) {
      display += ` (${stream.Codec.toUpperCase()})`;
    }
    
    return display;
  };

  if (!hasStreams) {
    console.log('SubtitleAudioMenu: No streams available, not rendering menu');
    return null;
  }

  // console.log('SubtitleAudioMenu: Rendering menu with streams:', { audioStreams: audioStreams.length, subtitleStreams: subtitleStreams.length });

  return (
    <div className="relative" ref={menuRef}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:text-gray-300 transition-colors duration-200 flex items-center space-x-1"
        title="Audio & Subtitles"
      >
        <div className="flex items-center">
          <Audio className="w-4 h-4" />
          <Subtitles className="w-4 h-4 ml-1" />
        </div>
      </button>

      {/* Menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-gray-700 min-w-[300px] max-h-[400px] overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'audio'
                  ? 'text-white bg-gray-800 border-b-2 border-red-600'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Audio ({audioStreams.length})
            </button>
            <button
              onClick={() => setActiveTab('subtitles')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'subtitles'
                  ? 'text-white bg-gray-800 border-b-2 border-red-600'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Subtitles ({subtitleStreams.length})
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[300px] overflow-y-auto">
            {activeTab === 'audio' && (
              <div className="py-2">
                {audioStreams.length === 0 ? (
                  <div className="px-4 py-3 text-gray-400 text-sm">
                    No audio tracks available
                  </div>
                ) : (
                  audioStreams.map((stream) => (
                    <button
                      key={stream.Index}
                      onClick={() => handleAudioSelect(stream)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors duration-200 flex items-center justify-between ${
                        selectedAudioIndex === stream.Index
                          ? 'text-white bg-gray-800'
                          : 'text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {formatLanguage(stream)}
                        </span>
                        {stream.IsDefault && (
                          <span className="text-xs text-gray-500">Default</span>
                        )}
                      </div>
                      {selectedAudioIndex === stream.Index && (
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'subtitles' && (
              <div className="py-2">
                {/* Off option for subtitles */}
                <button
                  onClick={() => handleSubtitleSelect(null)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors duration-200 flex items-center justify-between ${
                    selectedSubtitleIndex === undefined || selectedSubtitleIndex === -1
                      ? 'text-white bg-gray-800'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">Off</span>
                  {(selectedSubtitleIndex === undefined || selectedSubtitleIndex === -1) && (
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  )}
                </button>

                {subtitleStreams.length === 0 ? (
                  <div className="px-4 py-3 text-gray-400 text-sm">
                    No subtitle tracks available
                  </div>
                ) : (
                  subtitleStreams.map((stream) => (
                    <button
                      key={stream.Index}
                      onClick={() => handleSubtitleSelect(stream)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors duration-200 flex items-center justify-between ${
                        selectedSubtitleIndex === stream.Index
                          ? 'text-white bg-gray-800'
                          : 'text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {formatLanguage(stream)}
                        </span>
                        {stream.IsDefault && (
                          <span className="text-xs text-gray-500">Default</span>
                        )}
                      </div>
                      {selectedSubtitleIndex === stream.Index && (
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
