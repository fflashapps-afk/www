import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TrackInfo {
  id?: string;
  videoId?: string;
  title: string;
  artist: string;
  duration?: number;
  currentTime?: number;
  thumbnail?: string;
  source?: 'youtube' | 'local' | 'stream' | 'test';
}

interface RoomState {
  volume: number; // 0 - 150
  isMuted: boolean;
  isPlaying: boolean;
  currentTrack: TrackInfo | null;
  isStreamingAudio: boolean;
  wakeLockActive: boolean;
  eqPreset: string;
  lastUpdated: number;
}

interface ClientMeta {
  ws: WebSocket;
  role: 'host' | 'client';
  roomId: string;
  id: string;
  deviceName?: string;
}

interface Room {
  id: string;
  host: ClientMeta | null;
  clients: Map<string, ClientMeta>;
  state: RoomState;
  createdAt: number;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      host: null,
      clients: new Map(),
      state: {
        volume: 80,
        isMuted: false,
        isPlaying: false,
        currentTrack: {
          title: "Kompyuter Ovoz Oqimi (PC Audio Stream)",
          artist: "YouTube & Tizim tovushi",
          source: "stream",
        },
        isStreamingAudio: false,
        wakeLockActive: true,
        eqPreset: 'balanced',
        lastUpdated: Date.now(),
      },
      createdAt: Date.now(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json());

  // API Endpoints
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      time: new Date().toISOString(),
    });
  });

  app.get('/api/room/new', (_req, res) => {
    // Generate simple 4-digit code
    let code: string;
    let attempts = 0;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (rooms.has(code) && attempts < 50);

    const room = getOrCreateRoom(code);
    res.json({ roomId: room.id });
  });

  // Client connection metadata tracking
  const clientMap = new Map<WebSocket, ClientMeta>();

  wss.on('connection', (ws: WebSocket) => {
    let currentMeta: ClientMeta | null = null;

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        const { type } = message;

        if (type === 'join') {
          const { role, roomId, deviceName } = message;
          const cleanRoomId = (roomId || 'default').toString().trim();
          const clientId = Math.random().toString(36).substring(2, 9);
          const room = getOrCreateRoom(cleanRoomId);

          currentMeta = {
            ws,
            role: role === 'host' ? 'host' : 'client',
            roomId: cleanRoomId,
            id: clientId,
            deviceName: deviceName || (role === 'host' ? 'Kompyuter (PC)' : 'Telefon (Phone)'),
          };

          clientMap.set(ws, currentMeta);

          if (currentMeta.role === 'host') {
            room.host = currentMeta;
          } else {
            room.clients.set(clientId, currentMeta);
          }

          // Reply with join confirmed + current state
          ws.send(JSON.stringify({
            type: 'joined',
            role: currentMeta.role,
            roomId: cleanRoomId,
            clientId,
            state: room.state,
            connectedCount: (room.host ? 1 : 0) + room.clients.size,
            hasHost: !!room.host,
            hasClients: room.clients.size > 0,
          }));

          // Notify room of connection count update
          broadcastRoomInfo(room);
          return;
        }

        if (!currentMeta) {
          return;
        }

        const room = rooms.get(currentMeta.roomId);
        if (!room) return;

        // Message Handling & Relay
        switch (type) {
          case 'state_update': {
            // Update partial or full state
            room.state = {
              ...room.state,
              ...message.state,
              lastUpdated: Date.now(),
            };
            broadcastToRoom(room, {
              type: 'state_sync',
              state: room.state,
              senderId: currentMeta.id,
            });
            break;
          }

          case 'control_command': {
            // Commands from Phone to PC (Volume, Play/Pause, Seek, Mute, Next)
            if (message.action === 'set_volume') {
              room.state.volume = Math.max(0, Math.min(150, message.volume));
            } else if (message.action === 'toggle_mute') {
              room.state.isMuted = message.isMuted ?? !room.state.isMuted;
            } else if (message.action === 'play') {
              room.state.isPlaying = true;
            } else if (message.action === 'pause') {
              room.state.isPlaying = false;
            } else if (message.action === 'set_eq') {
              room.state.eqPreset = message.preset || 'balanced';
            }

            room.state.lastUpdated = Date.now();

            // Broadcast command to all participants (especially Host)
            broadcastToRoom(room, {
              type: 'control_received',
              action: message.action,
              value: message.value,
              state: room.state,
              senderId: currentMeta.id,
            });
            break;
          }

          case 'play_track': {
            room.state.currentTrack = message.track;
            room.state.isPlaying = true;
            room.state.lastUpdated = Date.now();

            broadcastToRoom(room, {
              type: 'track_changed',
              track: message.track,
              state: room.state,
            });
            break;
          }

          case 'webrtc_signal': {
            // Relay WebRTC audio offer/answer/candidate between PC and Phone
            const targetRole = message.targetRole;
            const targetClientId = message.targetClientId;

            if (targetRole === 'host' && room.host) {
              if (room.host.ws.readyState === WebSocket.OPEN) {
                room.host.ws.send(JSON.stringify({
                  type: 'webrtc_signal',
                  signal: message.signal,
                  fromClientId: currentMeta.id,
                  fromRole: currentMeta.role,
                }));
              }
            } else if (targetRole === 'client') {
              if (targetClientId && room.clients.has(targetClientId)) {
                const targetClient = room.clients.get(targetClientId);
                if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
                  targetClient.ws.send(JSON.stringify({
                    type: 'webrtc_signal',
                    signal: message.signal,
                    fromRole: currentMeta.role,
                  }));
                }
              } else {
                // Broadcast to all clients
                for (const client of room.clients.values()) {
                  if (client.ws.readyState === WebSocket.OPEN && client.id !== currentMeta.id) {
                    client.ws.send(JSON.stringify({
                      type: 'webrtc_signal',
                      signal: message.signal,
                      fromRole: currentMeta.role,
                    }));
                  }
                }
              }
            }
            break;
          }

          case 'audio_status': {
            room.state.isStreamingAudio = !!message.isStreaming;
            broadcastToRoom(room, {
              type: 'audio_status_updated',
              isStreaming: room.state.isStreamingAudio,
              trackTitle: message.trackTitle,
            });
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: message.timestamp,
              serverTime: Date.now(),
            }));
            break;
          }

          case 'bluetooth_status': {
            broadcastToRoom(room, {
              type: 'bluetooth_status_update',
              senderId: currentMeta.id,
              deviceName: message.deviceName,
              connected: message.connected,
            });
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentMeta) {
        const room = rooms.get(currentMeta.roomId);
        if (room) {
          if (currentMeta.role === 'host' && room.host?.id === currentMeta.id) {
            room.host = null;
          } else {
            room.clients.delete(currentMeta.id);
          }

          broadcastRoomInfo(room);

          if (!room.host && room.clients.size === 0) {
            // Clean up empty rooms after 5 minutes
            setTimeout(() => {
              const activeRoom = rooms.get(currentMeta!.roomId);
              if (activeRoom && !activeRoom.host && activeRoom.clients.size === 0) {
                rooms.delete(currentMeta!.roomId);
              }
            }, 5 * 60 * 1000);
          }
        }
        clientMap.delete(ws);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
    });
  });

  function broadcastToRoom(room: Room, payload: any) {
    const data = JSON.stringify(payload);
    if (room.host && room.host.ws.readyState === WebSocket.OPEN) {
      room.host.ws.send(data);
    }
    for (const client of room.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  function broadcastRoomInfo(room: Room) {
    broadcastToRoom(room, {
      type: 'room_info',
      roomId: room.id,
      hasHost: !!room.host,
      clientsCount: room.clients.size,
      clients: Array.from(room.clients.values()).map(c => ({
        id: c.id,
        name: c.deviceName,
      })),
      hostName: room.host?.deviceName || null,
      state: room.state,
    });
  }

  // Mount Vite or static dist
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`SoundSync Hub Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
