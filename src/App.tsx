/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PcHostView } from './components/PcHostView';
import { PhoneRemoteView } from './components/PhoneRemoteView';
import { BluetoothGuideModal } from './components/BluetoothGuideModal';
import { UserRole, RoomState, TrackInfo, ClientInfo } from './types';
import { Language, translations } from './services/i18n';
import { wakeLockService } from './services/wakeLock';
import { WebRTCAudioSender, WebRTCAudioReceiver } from './services/webrtcAudio';
import { p2pSyncManager } from './services/p2pSync';

export default function App() {
  // App State
  const [role, setRole] = useState<UserRole>('host');
  const [roomId, setRoomId] = useState<string>('5821');
  const [lang, setLang] = useState<Language>('uz');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [roomState, setRoomState] = useState<RoomState>({
    volume: 80,
    isMuted: false,
    isPlaying: false,
    currentTrack: {
      videoId: 'kJQP7kiw5Fk',
      title: 'YouTube Audio Oqimi (Kompyuter)',
      artist: 'PC YouTube & Tizim tovushi',
      source: 'youtube',
    },
    isStreamingAudio: false,
    wakeLockActive: true,
    eqPreset: 'balanced',
    lastUpdated: Date.now(),
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const webRTCSenderRef = useRef<WebRTCAudioSender | null>(null);
  const webRTCReceiverRef = useRef<WebRTCAudioReceiver | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Role & Room from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role');
      const urlRoom = urlParams.get('room');

      if (urlRole === 'phone' || urlRole === 'client') {
        setRole('client');
      } else if (urlRole === 'pc' || urlRole === 'host') {
        setRole('host');
      }

      if (urlRoom && urlRoom.trim()) {
        setRoomId(urlRoom.trim());
      } else {
        // Fetch new room code or generate 4-digit
        fetch('/api/room/new')
          .then((res) => res.json())
          .then((data) => {
            if (data.roomId) setRoomId(data.roomId);
          })
          .catch(() => {
            const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
            setRoomId(randomCode);
          });
      }
    }
  }, []);

  // Initialize Screen Wake Lock ("Ekran O'chmasin")
  useEffect(() => {
    wakeLockService.acquireWakeLock();
    const unsubscribe = wakeLockService.subscribe((active) => {
      setWakeLockActive(active);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Dual-mode message sender (WebSocket + PeerJS P2P for Vercel)
  const sendRealtimeMessage = useCallback((msg: any) => {
    // 1. Try WebSocket if active
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
    // 2. Also send via PeerJS P2P data connection (works on Vercel without WS server)
    p2pSyncManager.send(msg);
  }, []);

  // WebRTC Signal Helper
  const handleSendWebRTCSignal = useCallback(
    (signal: any, targetRole: 'client' | 'host') => {
      sendRealtimeMessage({
        type: 'webrtc_signal',
        signal,
        targetRole,
      });
    },
    [sendRealtimeMessage]
  );

  // Central Message Processor
  const handleIncomingMessage = useCallback(
    (msg: any) => {
      if (!msg || !msg.type) return;
      const { type } = msg;

      switch (type) {
        case 'joined': {
          if (msg.state) setRoomState(msg.state);
          break;
        }

        case 'room_info': {
          if (msg.clients) setClients(msg.clients);
          if (msg.state) {
            setRoomState(msg.state);
            setIsStreaming(!!msg.state.isStreamingAudio);
          }
          break;
        }

        case 'state_sync':
        case 'control_received': {
          if (msg.state) {
            setRoomState(msg.state);
            if (webRTCReceiverRef.current) {
              webRTCReceiverRef.current.setVolume(msg.state.volume, msg.state.isMuted);
            }
          }
          break;
        }

        case 'control_command': {
          // Received direct command from peer
          if (msg.action === 'set_volume') {
            const vol = msg.volume;
            setRoomState((prev) => ({ ...prev, volume: vol }));
            if (webRTCReceiverRef.current) {
              webRTCReceiverRef.current.setVolume(vol, roomState.isMuted);
            }
          } else if (msg.action === 'toggle_mute') {
            setRoomState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
          } else if (msg.action === 'play') {
            setRoomState((prev) => ({ ...prev, isPlaying: true }));
          } else if (msg.action === 'pause') {
            setRoomState((prev) => ({ ...prev, isPlaying: false }));
          }
          break;
        }

        case 'track_changed':
        case 'play_track': {
          if (msg.track) {
            setRoomState((prev) => ({
              ...prev,
              currentTrack: msg.track,
              isPlaying: true,
            }));
          }
          break;
        }

        case 'audio_status_updated':
        case 'audio_status': {
          setIsStreaming(!!msg.isStreaming);
          break;
        }

        case 'webrtc_signal': {
          if (role === 'host' && webRTCSenderRef.current) {
            webRTCSenderRef.current.handleSignalFromClient(msg.signal);
          } else if (role === 'client' && webRTCReceiverRef.current) {
            webRTCReceiverRef.current.handleSignalFromHost(msg.signal);
          }
          break;
        }

        case 'pong': {
          if (msg.timestamp) {
            const rtt = Date.now() - msg.timestamp;
            setPingMs(Math.round(rtt / 2));
          }
          break;
        }
      }
    },
    [role, roomState.isMuted]
  );

  // Initialize WebRTC instances
  useEffect(() => {
    if (role === 'host') {
      webRTCSenderRef.current = new WebRTCAudioSender(handleSendWebRTCSignal);
      if (webRTCReceiverRef.current) {
        webRTCReceiverRef.current.close();
        webRTCReceiverRef.current = null;
      }
    } else {
      webRTCReceiverRef.current = new WebRTCAudioReceiver(
        handleSendWebRTCSignal,
        () => {
          setIsStreaming(true);
        }
      );
      if (remoteAudioRef.current) {
        webRTCReceiverRef.current.setAudioElement(remoteAudioRef.current);
      }
      if (webRTCSenderRef.current) {
        webRTCSenderRef.current.stopStream();
        webRTCSenderRef.current = null;
      }
    }
  }, [role, handleSendWebRTCSignal]);

  // Initialize P2P Sync (PeerJS - fully serverless & Vercel compatible!)
  useEffect(() => {
    p2pSyncManager.init(role, roomId);

    const unsubMsg = p2pSyncManager.onMessage((msg) => {
      handleIncomingMessage(msg);
    });

    const unsubStream = p2pSyncManager.onStream((stream) => {
      setIsStreaming(true);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    });

    const unsubConn = p2pSyncManager.onConnectionChange((connected) => {
      if (connected) {
        setIsConnected(true);
      }
    });

    return () => {
      unsubMsg();
      unsubStream();
      unsubConn();
      p2pSyncManager.cleanup();
    };
  }, [role, roomId, handleIncomingMessage]);

  // Connect WebSocket if available (for local dev / Cloud Run)
  useEffect(() => {
    let pingInterval: any = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(
            JSON.stringify({
              type: 'join',
              role,
              roomId,
              deviceName:
                role === 'host'
                  ? 'Kompyuter (PC)'
                  : navigator.userAgent.includes('Android')
                  ? 'Android Telefon'
                  : navigator.userAgent.includes('iPhone')
                  ? 'iPhone'
                  : 'Telefon (Phone)',
            })
          );

          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'ping',
                  timestamp: Date.now(),
                })
              );
            }
          }, 5000);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleIncomingMessage(msg);
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          clearInterval(pingInterval);
          // On Vercel, WS will close normally; P2P keeps working!
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = () => {
          // Silent fallback to PeerJS P2P
        };
      } catch {
        // Fallback to PeerJS
      }
    };

    connectWebSocket();

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, role, handleIncomingMessage]);

  // Audio capture actions for PC Host
  const handleStartCapture = async () => {
    if (!webRTCSenderRef.current) return;
    setCaptureError(null);
    try {
      const stream = await webRTCSenderRef.current.startCaptureSystemAudio();
      setIsStreaming(true);

      // Relay to both WebSocket and Vercel P2P
      p2pSyncManager.setAudioStream(stream);

      sendRealtimeMessage({
        type: 'audio_status',
        isStreaming: true,
        trackTitle: 'PC YouTube Ovoz Oqimi',
      });

      await webRTCSenderRef.current.initiateCallToClient();
    } catch (err: any) {
      console.warn('Display capture failed:', err);
      if (err?.message === 'PERMISSION_POLICY_DISALLOWED') {
        setCaptureError('PERMISSION_POLICY_DISALLOWED');
      } else if (err?.message === 'NO_AUDIO_SHARED') {
        setCaptureError('NO_AUDIO_SHARED');
      } else if (err?.name !== 'AbortError') {
        setCaptureError('GENERIC_ERROR');
      }
    }
  };

  const handleStartMicCapture = async () => {
    if (!webRTCSenderRef.current) return;
    setCaptureError(null);
    try {
      const stream = await webRTCSenderRef.current.startCaptureMicrophoneOrStereoMix();
      setIsStreaming(true);

      p2pSyncManager.setAudioStream(stream);

      sendRealtimeMessage({
        type: 'audio_status',
        isStreaming: true,
        trackTitle: 'Stereo Mix / PC Ovoz Oqimi',
      });

      await webRTCSenderRef.current.initiateCallToClient();
    } catch (err) {
      console.warn('Mic capture failed:', err);
      setCaptureError('MIC_ERROR');
    }
  };

  const handleStartFileStream = async (file: File) => {
    if (!webRTCSenderRef.current) return;
    setCaptureError(null);
    try {
      const stream = await webRTCSenderRef.current.startAudioFileStream(file);
      setIsStreaming(true);

      p2pSyncManager.setAudioStream(stream);

      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const newTrack: TrackInfo = {
        title: fileName,
        artist: 'PC Audio Fayl',
        source: 'local',
      };

      setRoomState((prev) => ({
        ...prev,
        currentTrack: newTrack,
        isPlaying: true,
      }));

      sendRealtimeMessage({
        type: 'play_track',
        track: newTrack,
      });

      sendRealtimeMessage({
        type: 'audio_status',
        isStreaming: true,
        trackTitle: fileName,
      });

      await webRTCSenderRef.current.initiateCallToClient();
    } catch (err) {
      console.warn('File stream failed:', err);
    }
  };

  const handleStartTestStream = async () => {
    if (!webRTCSenderRef.current) return;
    setCaptureError(null);
    try {
      const stream = webRTCSenderRef.current.startSynthesizerTestStream();
      setIsStreaming(true);

      p2pSyncManager.setAudioStream(stream);

      sendRealtimeMessage({
        type: 'audio_status',
        isStreaming: true,
        trackTitle: 'Sinov musiqasi (Test Synth)',
      });

      await webRTCSenderRef.current.initiateCallToClient();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopCapture = () => {
    if (webRTCSenderRef.current) {
      webRTCSenderRef.current.stopStream();
    }
    p2pSyncManager.setAudioStream(null);
    setIsStreaming(false);
    sendRealtimeMessage({
      type: 'audio_status',
      isStreaming: false,
    });
  };

  // Remote Control actions
  const handleUpdateVolume = (volume: number) => {
    setRoomState((prev) => ({ ...prev, volume }));
    sendRealtimeMessage({
      type: 'control_command',
      action: 'set_volume',
      volume,
    });
    if (webRTCReceiverRef.current) {
      webRTCReceiverRef.current.setVolume(volume, roomState.isMuted);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !roomState.isMuted;
    setRoomState((prev) => ({ ...prev, isMuted: nextMuted }));
    sendRealtimeMessage({
      type: 'control_command',
      action: 'toggle_mute',
      isMuted: nextMuted,
    });
    if (webRTCReceiverRef.current) {
      webRTCReceiverRef.current.setVolume(roomState.volume, nextMuted);
    }
  };

  const handleTogglePlay = () => {
    const nextPlaying = !roomState.isPlaying;
    setRoomState((prev) => ({ ...prev, isPlaying: nextPlaying }));
    sendRealtimeMessage({
      type: 'control_command',
      action: nextPlaying ? 'play' : 'pause',
    });
  };

  const handlePlaybackCommand = (action: 'seek' | 'skip' | 'prev' | 'next', value?: any) => {
    sendRealtimeMessage({
      type: 'control_command',
      action,
      value,
    });
  };

  const handleSelectTrack = (track: TrackInfo) => {
    setRoomState((prev) => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
    }));
    sendRealtimeMessage({
      type: 'play_track',
      track,
    });
  };

  const handleToggleWakeLock = async () => {
    const active = await wakeLockService.toggle();
    setWakeLockActive(active);
  };

  // Web Bluetooth pairing trigger without window.alert
  const handleConnectWebBluetooth = async () => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service'],
        });
        if (device && device.name) {
          sendRealtimeMessage({
            type: 'bluetooth_status',
            deviceName: device.name,
            connected: true,
          });
          setToastMessage(
            lang === 'uz'
              ? `Bluetooth qurilma ulandi: ${device.name}`
              : `Bluetooth device connected: ${device.name}`
          );
        }
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          setIsGuideOpen(true);
        }
      }
    } else {
      setIsGuideOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar
        currentRole={role}
        onSwitchRole={setRole}
        roomId={roomId}
        isConnected={isConnected}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'uz' ? 'en' : 'uz'))}
        wakeLockActive={wakeLockActive}
        onOpenBluetoothGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {role === 'host' ? (
          <PcHostView
            roomId={roomId}
            roomState={roomState}
            clients={clients}
            isStreaming={isStreaming}
            onStartCapture={handleStartCapture}
            onStartMicCapture={handleStartMicCapture}
            onStartFileStream={handleStartFileStream}
            onStartTestStream={handleStartTestStream}
            onStopCapture={handleStopCapture}
            onUpdateVolume={handleUpdateVolume}
            onToggleMute={handleToggleMute}
            onTogglePlay={handleTogglePlay}
            onSelectTrack={handleSelectTrack}
            onOpenBluetoothGuide={() => setIsGuideOpen(true)}
            onConnectWebBluetooth={handleConnectWebBluetooth}
            webRTCSender={webRTCSenderRef.current}
            lang={lang}
            pingMs={pingMs}
            captureError={captureError}
            onClearCaptureError={() => setCaptureError(null)}
          />
        ) : (
          <PhoneRemoteView
            roomId={roomId}
            roomState={roomState}
            isStreaming={isStreaming}
            wakeLockActive={wakeLockActive}
            onToggleWakeLock={handleToggleWakeLock}
            onUpdateVolume={handleUpdateVolume}
            onToggleMute={handleToggleMute}
            onTogglePlay={handleTogglePlay}
            onPlaybackCommand={handlePlaybackCommand}
            onSelectTrack={handleSelectTrack}
            onOpenBluetoothGuide={() => setIsGuideOpen(true)}
            onConnectWebBluetooth={handleConnectWebBluetooth}
            webRTCReceiver={webRTCReceiverRef.current}
            remoteAudioRef={remoteAudioRef}
            lang={lang}
            isConnected={isConnected}
            pingMs={pingMs}
          />
        )}
      </main>

      {/* Bluetooth Setup Modal */}
      <BluetoothGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        lang={lang}
      />
    </div>
  );
}
