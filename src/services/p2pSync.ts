/**
 * P2P WebRTC Synchronization Service (Vercel & Serverless Ready)
 * Provides direct peer-to-peer data channel and audio streaming
 * without requiring a persistent stateful WebSocket server.
 */

import { Peer, DataConnection, MediaConnection } from 'peerjs';

export interface P2PMessage {
  type: string;
  senderId?: string;
  timestamp?: number;
  [key: string]: any;
}

export type MessageHandler = (msg: P2PMessage) => void;
export type StreamHandler = (stream: MediaStream) => void;

export class P2PSyncManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private mediaCalls: Map<string, MediaConnection> = new Map();
  private role: 'host' | 'client' = 'host';
  private roomId: string = '';
  private isConnected: boolean = false;
  private onMessageCallbacks: Set<MessageHandler> = new Set();
  private onStreamCallbacks: Set<StreamHandler> = new Set();
  private onConnectionStatusCallbacks: Set<(connected: boolean) => void> = new Set();
  private currentAudioStream: MediaStream | null = null;

  constructor() {}

  public init(role: 'host' | 'client', roomId: string) {
    this.role = role;
    this.roomId = roomId;
    this.cleanup();

    const peerId =
      role === 'host'
        ? `soundsync-host-${roomId}`
        : `soundsync-client-${roomId}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      this.peer.on('open', (id) => {
        console.log(`[P2P] Peer initialized with ID: ${id}`);
        if (role === 'client') {
          this.connectToHost();
        } else {
          this.setIsConnected(true);
        }
      });

      this.peer.on('connection', (conn) => {
        this.handleIncomingDataConnection(conn);
      });

      this.peer.on('call', (call) => {
        console.log('[P2P] Incoming media call received');
        call.answer(); // Answer with no stream, to receive host's audio
        call.on('stream', (remoteStream) => {
          console.log('[P2P] Remote audio stream received via PeerJS call');
          this.onStreamCallbacks.forEach((cb) => cb(remoteStream));
        });
      });

      this.peer.on('error', (err) => {
        console.warn('[P2P] PeerJS event notice:', err.type, err.message);
        if (err.type === 'peer-unavailable' && role === 'client') {
          // Retry connecting in 3s
          setTimeout(() => this.connectToHost(), 3000);
        }
      });
    } catch (err) {
      console.warn('[P2P] Initialization warning:', err);
    }
  }

  private connectToHost() {
    if (!this.peer || this.peer.destroyed) return;
    const hostPeerId = `soundsync-host-${this.roomId}`;

    try {
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
      });

      conn.on('open', () => {
        console.log('[P2P] Connected to host data channel');
        this.connections.set(hostPeerId, conn);
        this.setIsConnected(true);

        // Send Join announcement
        conn.send({
          type: 'join',
          role: 'client',
          roomId: this.roomId,
          timestamp: Date.now(),
        });
      });

      conn.on('data', (data: any) => {
        this.handleMessage(data);
      });

      conn.on('close', () => {
        console.log('[P2P] Connection to host closed');
        this.connections.delete(hostPeerId);
        this.setIsConnected(false);
        // Attempt reconnect
        setTimeout(() => this.connectToHost(), 3000);
      });

      conn.on('error', (err) => {
        console.warn('[P2P] Host connection error:', err);
      });
    } catch (err) {
      console.warn('[P2P] Error connecting to host:', err);
    }
  }

  private handleIncomingDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log(`[P2P] New client connected: ${conn.peer}`);
      this.connections.set(conn.peer, conn);
      this.setIsConnected(true);

      // If host has an active audio stream, call the new client immediately
      if (this.role === 'host' && this.currentAudioStream) {
        this.callClientWithAudio(conn.peer, this.currentAudioStream);
      }
    });

    conn.on('data', (data: any) => {
      this.handleMessage(data);
      // Relay to other clients if host
      if (this.role === 'host') {
        for (const [peerId, clientConn] of this.connections.entries()) {
          if (peerId !== conn.peer && clientConn.open) {
            clientConn.send(data);
          }
        }
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.connections.size === 0 && this.role === 'client') {
        this.setIsConnected(false);
      }
    });
  }

  public setAudioStream(stream: MediaStream | null) {
    this.currentAudioStream = stream;
    if (this.role === 'host' && stream && this.peer) {
      // Call all connected clients with this audio stream
      for (const peerId of this.connections.keys()) {
        this.callClientWithAudio(peerId, stream);
      }
    }
  }

  private callClientWithAudio(clientPeerId: string, stream: MediaStream) {
    if (!this.peer || this.peer.destroyed) return;
    try {
      const call = this.peer.call(clientPeerId, stream);
      this.mediaCalls.set(clientPeerId, call);
      call.on('close', () => {
        this.mediaCalls.delete(clientPeerId);
      });
    } catch (err) {
      console.warn('[P2P] Error calling client with audio:', err);
    }
  }

  public send(msg: P2PMessage) {
    const payload = {
      ...msg,
      timestamp: msg.timestamp || Date.now(),
    };

    for (const conn of this.connections.values()) {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch (e) {
          console.warn('[P2P] Send error:', e);
        }
      }
    }
  }

  public onMessage(callback: MessageHandler): () => void {
    this.onMessageCallbacks.add(callback);
    return () => this.onMessageCallbacks.delete(callback);
  }

  public onStream(callback: StreamHandler): () => void {
    this.onStreamCallbacks.add(callback);
    return () => this.onStreamCallbacks.delete(callback);
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.onConnectionStatusCallbacks.add(callback);
    callback(this.isConnected);
    return () => this.onConnectionStatusCallbacks.delete(callback);
  }

  private handleMessage(data: any) {
    if (!data) return;
    this.onMessageCallbacks.forEach((cb) => cb(data));
  }

  private setIsConnected(status: boolean) {
    this.isConnected = status;
    this.onConnectionStatusCallbacks.forEach((cb) => cb(status));
  }

  public cleanup() {
    for (const conn of this.connections.values()) {
      try {
        conn.close();
      } catch {}
    }
    this.connections.clear();

    for (const call of this.mediaCalls.values()) {
      try {
        call.close();
      } catch {}
    }
    this.mediaCalls.clear();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    this.setIsConnected(false);
  }
}

export const p2pSyncManager = new P2PSyncManager();
