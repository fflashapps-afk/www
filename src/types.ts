export type UserRole = 'host' | 'client';

export interface TrackInfo {
  id?: string;
  videoId?: string;
  title: string;
  artist: string;
  duration?: number;
  currentTime?: number;
  thumbnail?: string;
  source?: 'youtube' | 'local' | 'stream' | 'test';
}

export interface RoomState {
  volume: number; // 0 - 150
  isMuted: boolean;
  isPlaying: boolean;
  currentTrack: TrackInfo | null;
  isStreamingAudio: boolean;
  wakeLockActive: boolean;
  eqPreset: string;
  lastUpdated: number;
}

export interface ClientInfo {
  id: string;
  name?: string;
  role?: string;
  connectedAt?: number;
}

export interface RoomInfoMessage {
  type: 'room_info';
  roomId: string;
  hasHost: boolean;
  clientsCount: number;
  clients: ClientInfo[];
  hostName: string | null;
  state: RoomState;
}

export type EqPresetId = 'balanced' | 'bass_boost' | 'vocal' | 'treble' | 'loudness';

export interface EqPreset {
  id: EqPresetId;
  nameUz: string;
  nameEn: string;
  bass: number; // dB
  mid: number;
  treble: number;
}
