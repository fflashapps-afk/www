import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  FastForward,
  Rewind,
  SunMedium,
  Sun,
  Bluetooth,
  Headphones,
  Radio,
  Wifi,
  Sparkles,
  Sliders,
  Check,
  RefreshCw,
  Search,
  Youtube,
  AlertCircle
} from 'lucide-react';
import { RoomState, TrackInfo } from '../types';
import { Language, translations } from '../services/i18n';
import { AudioVisualizer } from './AudioVisualizer';
import { YouTubeSyncPlayer } from './YouTubeSyncPlayer';
import { WebRTCAudioReceiver } from '../services/webrtcAudio';

interface PhoneRemoteViewProps {
  roomId: string;
  roomState: RoomState;
  isStreaming: boolean;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  onUpdateVolume: (volume: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onPlaybackCommand: (action: 'seek' | 'skip' | 'prev' | 'next', value?: any) => void;
  onSelectTrack: (track: TrackInfo) => void;
  onOpenBluetoothGuide: () => void;
  onConnectWebBluetooth: () => void;
  webRTCReceiver: WebRTCAudioReceiver | null;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  lang: Language;
  isConnected: boolean;
  pingMs: number | null;
}

export const PhoneRemoteView: React.FC<PhoneRemoteViewProps> = ({
  roomId,
  roomState,
  isStreaming,
  wakeLockActive,
  onToggleWakeLock,
  onUpdateVolume,
  onToggleMute,
  onTogglePlay,
  onPlaybackCommand,
  onSelectTrack,
  onOpenBluetoothGuide,
  onConnectWebBluetooth,
  webRTCReceiver,
  remoteAudioRef,
  lang,
  isConnected,
  pingMs,
}) => {
  const [localVolume, setLocalVolume] = useState(roomState.volume);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    setLocalVolume(roomState.volume);
  }, [roomState.volume]);

  const handleVolumeChange = (newVol: number) => {
    setLocalVolume(newVol);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onUpdateVolume(newVol);
  };

  const handleStartAudioManually = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(() => {});
    }
    if (webRTCReceiver) {
      webRTCReceiver.resumeAudioContext();
    }
    setNeedsUserInteraction(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-8 animate-fade-in">
      {/* Hidden Audio Tag for WebRTC stream */}
      <audio
        ref={remoteAudioRef as any}
        autoPlay
        playsInline
        onPlay={() => setNeedsUserInteraction(false)}
      />

      {/* Screen Keep Awake Card ("Ekran O'chmasin") */}
      <div
        onClick={onToggleWakeLock}
        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
          wakeLockActive
            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              wakeLockActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <SunMedium className={`w-6 h-6 ${wakeLockActive ? 'animate-spin-slow' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{t.screenAwake}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  wakeLockActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {wakeLockActive ? t.awakeActive : t.awakeInactive}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {t.awakeDesc}
            </p>
          </div>
        </div>

        {/* Toggle Switch UI */}
        <div
          className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
            wakeLockActive ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
        </div>
      </div>

      {/* Bluetooth Earphones Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <Bluetooth className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {lang === 'uz' ? 'Bluetooth Quloqchin / Dinamik' : 'Bluetooth Earphones'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {lang === 'uz' ? 'PC YouTube ovozi quloqchinda yangraydi' : 'PC YouTube audio outputs here'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onConnectWebBluetooth}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Ulash' : 'Pair'}</span>
          </button>
          <button
            onClick={onOpenBluetoothGuide}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            title="Qo'llanma"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audio Stream Player / Unmute Warning */}
      {isStreaming && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {t.streamingActive}
              </span>
            </div>
            {pingMs !== null && (
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/40">
                {pingMs} ms
              </span>
            )}
          </div>

          <AudioVisualizer
            isPlaying={roomState.isPlaying}
            isStreaming={isStreaming}
            getFrequencyData={webRTCReceiver ? (arr) => webRTCReceiver.getFrequencyData(arr) : undefined}
            accentColor="emerald"
            height={56}
          />

          <button
            onClick={handleStartAudioManually}
            className="mt-3 w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>
              {lang === 'uz' ? 'Ovozni eshitishni tasdiqlash (Unmute)' : 'Confirm Audio Playback'}
            </span>
          </button>
        </div>
      )}

      {/* Volume Control Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>{t.volumeControl}</span>
          </span>

          <span
            className={`text-2xl font-black font-mono transition-colors ${
              roomState.isMuted
                ? 'text-rose-400'
                : localVolume > 100
                ? 'text-amber-400'
                : 'text-cyan-400'
            }`}
          >
            {roomState.isMuted ? 'MUTED' : `${localVolume}%`}
          </span>
        </div>

        {/* Master Slider */}
        <div className="relative my-6 px-1">
          <input
            type="range"
            min="0"
            max="150"
            value={roomState.isMuted ? 0 : localVolume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
            <span className="text-amber-400 font-bold">150% Boost</span>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: '0%', val: 0 },
            { label: '50%', val: 50 },
            { label: '100%', val: 100 },
            { label: '150%⚡', val: 150 },
          ].map((preset) => (
            <button
              key={preset.val}
              onClick={() => handleVolumeChange(preset.val)}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                localVolume === preset.val && !roomState.isMuted
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Playback Transport Buttons */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`p-3.5 rounded-2xl border transition-all ${
              roomState.isMuted
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {roomState.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Skip Back 10s */}
          <button
            onClick={() => onPlaybackCommand('skip', -10)}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          >
            <Rewind className="w-5 h-5" />
          </button>

          {/* Big Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 flex items-center justify-center transition-all shadow-xl shadow-cyan-500/25"
          >
            {roomState.isPlaying ? (
              <Pause className="w-7 h-7 fill-slate-950 text-slate-950" />
            ) : (
              <Play className="w-7 h-7 fill-slate-950 text-slate-950 ml-1" />
            )}
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => onPlaybackCommand('skip', 10)}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          >
            <FastForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* YouTube Song Remote for Phone */}
      <YouTubeSyncPlayer
        currentTrack={roomState.currentTrack}
        isPlaying={roomState.isPlaying}
        onSelectTrack={onSelectTrack}
        onTogglePlay={onTogglePlay}
        lang={lang}
        isHost={false}
      />
    </div>
  );
};
