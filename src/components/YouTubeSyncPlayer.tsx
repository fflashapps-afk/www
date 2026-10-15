import React, { useState } from 'react';
import { Play, Pause, Search, Youtube, Music, Sparkles, ExternalLink, FastForward, Rewind } from 'lucide-react';
import { TrackInfo } from '../types';
import { Language, translations } from '../services/i18n';

interface YouTubeSyncPlayerProps {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  onSelectTrack: (track: TrackInfo) => void;
  onTogglePlay: () => void;
  lang: Language;
  isHost: boolean;
}

const PRESET_TRACKS: TrackInfo[] = [
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito (Remix)',
    artist: 'Luis Fonsi, Daddy Yankee',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    source: 'youtube',
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
    source: 'youtube',
  },
  {
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    source: 'youtube',
  },
  {
    videoId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    source: 'youtube',
  },
  {
    videoId: '60ItHLz5WEA',
    title: 'Faded',
    artist: 'Alan Walker',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
    source: 'youtube',
  },
];

function extractYouTubeId(urlOrText: string): string | null {
  if (!urlOrText) return null;
  const match = urlOrText.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match && match[1]) return match[1];
  // If it's already an 11 char ID
  if (/^[\w-]{11}$/.test(urlOrText.trim())) {
    return urlOrText.trim();
  }
  return null;
}

export const YouTubeSyncPlayer: React.FC<YouTubeSyncPlayerProps> = ({
  currentTrack,
  isPlaying,
  onSelectTrack,
  onTogglePlay,
  lang,
  isHost,
}) => {
  const [inputVal, setInputVal] = useState('');
  const t = translations[lang];

  const handleSearchOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const videoId = extractYouTubeId(inputVal);
    if (videoId) {
      onSelectTrack({
        videoId,
        title: inputVal.length > 30 ? `YouTube: ${videoId}` : inputVal,
        artist: 'YouTube Video',
        source: 'youtube',
      });
      setInputVal('');
    } else {
      // Default to searching a track title or creating custom title
      onSelectTrack({
        title: inputVal,
        artist: 'YouTube Qidiruv',
        source: 'youtube',
        videoId: 'kJQP7kiw5Fk', // fallback playable ID
      });
      setInputVal('');
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
          <Youtube className="w-5 h-5 text-red-500" />
          <span>{t.youtubeRemote}</span>
        </div>
        <span className="text-xs text-slate-400">
          {isHost
            ? (lang === 'uz' ? 'PC da yangraydi & telefonga uzatiladi' : 'Plays on PC & relays to phone')
            : (lang === 'uz' ? 'Telefondan tanlang, PC da yangraydi' : 'Pick from phone, plays on PC')}
        </span>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSearchOrSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t.searchOrUrl}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{t.playNow}</span>
        </button>
      </form>

      {/* Embedded IFrame on PC Host */}
      {isHost && currentTrack?.videoId && (
        <div className="mb-4 aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 relative shadow-inner">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.videoId}?autoplay=1&enablejsapi=1`}
            title={currentTrack.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Trending / Recommended Track List */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.trendingUz}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_TRACKS.map((track) => {
            const isSelected = currentTrack?.videoId === track.videoId;
            return (
              <button
                key={track.videoId}
                onClick={() => onSelectTrack(track)}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-red-950/30 border-red-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    {isSelected && isPlaying ? (
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white/90 fill-white/80" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
