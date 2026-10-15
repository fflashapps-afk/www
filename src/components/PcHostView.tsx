import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  Smartphone,
  Copy,
  Check,
  Headphones,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Activity,
  Bluetooth,
  Music,
  ExternalLink,
  Mic,
  Upload,
  AlertTriangle,
  X
} from 'lucide-react';
import { RoomState, TrackInfo, ClientInfo } from '../types';
import { Language, translations } from '../services/i18n';
import { AudioVisualizer } from './AudioVisualizer';
import { YouTubeSyncPlayer } from './YouTubeSyncPlayer';
import { WebRTCAudioSender, isRunningInIframe } from '../services/webrtcAudio';

interface PcHostViewProps {
  roomId: string;
  roomState: RoomState;
  clients: ClientInfo[];
  isStreaming: boolean;
  onStartCapture: () => void;
  onStartMicCapture: () => void;
  onStartFileStream: (file: File) => void;
  onStartTestStream: () => void;
  onStopCapture: () => void;
  onUpdateVolume: (volume: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onSelectTrack: (track: TrackInfo) => void;
  onOpenBluetoothGuide: () => void;
  onConnectWebBluetooth: () => void;
  webRTCSender: WebRTCAudioSender | null;
  lang: Language;
  pingMs: number | null;
  captureError: string | null;
  onClearCaptureError: () => void;
}

export const PcHostView: React.FC<PcHostViewProps> = ({
  roomId,
  roomState,
  clients,
  isStreaming,
  onStartCapture,
  onStartMicCapture,
  onStartFileStream,
  onStartTestStream,
  onStopCapture,
  onUpdateVolume,
  onToggleMute,
  onTogglePlay,
  onSelectTrack,
  onOpenBluetoothGuide,
  onConnectWebBluetooth,
  webRTCSender,
  lang,
  pingMs,
  captureError,
  onClearCaptureError,
}) => {
  const [copied, setCopied] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[lang];

  useEffect(() => {
    setInIframe(isRunningInIframe());
  }, []);

  const phoneJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?role=phone&room=${roomId}`
    : `https://app.local?role=phone&room=${roomId}`;

  const standaloneUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phoneJoinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onStartFileStream(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Hidden File Input for PC Audio file streaming */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Standalone Tab Recommendation Banner (Shown if running in preview iframe) */}
      {inIframe && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">
                {lang === 'uz' ? 'Tizim va YouTube ovozini to\'liq uzatish' : 'Full YouTube & System Audio Stream'}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {t.iframeWarning}
              </p>
            </div>
          </div>

          <a
            href={standaloneUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-amber-500/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t.openInNewTab}</span>
          </a>
        </div>
      )}

      {/* Permission Policy or Audio Error Dialog Banner */}
      {captureError && (
        <div className="bg-rose-950/60 border border-rose-500/50 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {captureError === 'PERMISSION_POLICY_DISALLOWED'
                    ? t.policyErrorTitle
                    : captureError === 'NO_AUDIO_SHARED'
                    ? (lang === 'uz' ? 'Ovoz belgisi tanlanmadi' : 'No Audio Selected')
                    : (lang === 'uz' ? 'Ovoz uzatishda xatolik' : 'Audio Capture Error')}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {captureError === 'PERMISSION_POLICY_DISALLOWED'
                    ? t.policyErrorDesc
                    : captureError === 'NO_AUDIO_SHARED'
                    ? (lang === 'uz'
                        ? 'YouTube sahifasini tanlashda pastki qismdagi "Ovozni ulashish" (Share Audio) katakchasini belgilang.'
                        : 'Make sure to check "Share Audio" checkbox when selecting the tab or window.')
                    : (lang === 'uz'
                        ? 'Iltimos, boshqa usullardan foydalaning yoki ilovani alohida oynada oching.'
                        : 'Please try alternative stream methods below or open in a new tab.')}
                </p>
              </div>
            </div>

            <button
              onClick={onClearCaptureError}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-900/50">
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.openInNewTab}</span>
            </a>

            <button
              onClick={() => {
                onClearCaptureError();
                onStartMicCapture();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.micStream}</span>
            </button>

            <button
              onClick={() => {
                onClearCaptureError();
                fileInputRef.current?.click();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.uploadAudio}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Quick Status & Bluetooth */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/30 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shrink-0">
            <Radio className={`w-6 h-6 ${isStreaming ? 'animate-pulse text-cyan-300' : ''}`} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {t.pcMode}
              {isStreaming ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {t.streamingActive}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  {t.disconnected}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {t.audioNotice}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onOpenBluetoothGuide}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Bluetooth className="w-4 h-4 text-cyan-400" />
            <span>{t.bluetoothGuideBtn}</span>
          </button>

          <button
            onClick={onConnectWebBluetooth}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Headphones className="w-4 h-4" />
            <span>{t.bluetoothConnect}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Audio Streaming Control & QR Code Pairing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stream Trigger & Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Audio Transmitter Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                {lang === 'uz' ? 'PC Audio Uzatish (Transmitter)' : 'PC Audio Transmitter'}
              </span>

              {pingMs !== null && (
                <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{pingMs} ms</span>
                </span>
              )}
            </div>

            {/* Visualizer Canvas */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="truncate max-w-[240px]">
                  {roomState.currentTrack?.title || 'Audio Stream'}
                </span>
                <span className="text-cyan-400 font-mono text-[11px]">
                  {isStreaming ? (lang === 'uz' ? 'JONLI UZATILMOQDA' : 'LIVE RELAY') : (lang === 'uz' ? 'KUTISH' : 'IDLE')}
                </span>
              </div>
              <AudioVisualizer
                isPlaying={roomState.isPlaying}
                isStreaming={isStreaming}
                getFrequencyData={webRTCSender ? (arr) => webRTCSender.getFrequencyData(arr) : undefined}
                accentColor="cyan"
                height={72}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isStreaming ? (
                <div className="space-y-2">
                  <button
                    onClick={onStartCapture}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan-500/25"
                  >
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span>{t.streamAudio}</span>
                  </button>

                  {/* Alternative Streaming Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={onStartMicCapture}
                      className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                      title={t.micDesc}
                    >
                      <Mic className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lang === 'uz' ? 'Stereo Mix / Mic' : 'Stereo Mix / Mic'}</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'uz' ? 'Audio fayl' : 'Audio File'}</span>
                    </button>

                    <button
                      onClick={onStartTestStream}
                      className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.testTone}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onStopCapture}
                  className="w-full py-3.5 px-6 rounded-xl bg-rose-600/90 hover:bg-rose-500 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>{t.stopStream}</span>
                </button>
              )}

              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{t.streamHelp}</span>
              </div>
            </div>

            {/* Volume & Remote Monitor */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleMute}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    roomState.isMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {roomState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div>
                  <div className="text-xs text-slate-400">{t.masterVolume}</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{roomState.isMuted ? 'Muted' : `${roomState.volume}%`}</span>
                    {roomState.volume > 100 && (
                      <span className="text-[10px] text-amber-400 font-normal">(Boost)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress slider */}
              <input
                type="range"
                min="0"
                max="150"
                value={roomState.isMuted ? 0 : roomState.volume}
                onChange={(e) => onUpdateVolume(parseInt(e.target.value, 10))}
                className="w-36 sm:w-48 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* YouTube Synced Player */}
          <YouTubeSyncPlayer
            currentTrack={roomState.currentTrack}
            isPlaying={roomState.isPlaying}
            onSelectTrack={onSelectTrack}
            onTogglePlay={onTogglePlay}
            lang={lang}
            isHost={true}
          />
        </div>

        {/* Right Column: QR Code & Connected Phones (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* QR Code & PIN Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col items-center text-center">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              <Wifi className="w-4 h-4" />
              <span>{t.roomCode}</span>
            </div>

            {/* Big PIN Code */}
            <div className="my-3 px-6 py-2 bg-gradient-to-r from-slate-950 to-slate-900 border-2 border-cyan-500/40 rounded-2xl">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-widest text-cyan-300 font-mono">
                {roomId}
              </span>
            </div>

            {/* QR Code Frame */}
            <div className="p-4 bg-white rounded-2xl shadow-lg my-2 border border-slate-200">
              <QRCodeSVG
                value={phoneJoinUrl}
                size={168}
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-slate-300 mt-2 font-medium">
              {t.scanQr}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              {t.wifiTip}
            </p>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>
                {copied
                  ? (lang === 'uz' ? 'Nusxalandi!' : 'Copied!')
                  : (lang === 'uz' ? 'Telefon havolasini nusxalash' : 'Copy phone link')}
              </span>
            </button>
          </div>

          {/* Connected Phones List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>{t.connectedClients}</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                {clients.length}
              </span>
            </div>

            {clients.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                {t.noClients}
              </div>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {client.name || 'Telefon'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ID: {client.id} • {t.connected}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-cyan-400 font-mono bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-800/40">
                      {lang === 'uz' ? 'Pult faol' : 'Remote sync'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
