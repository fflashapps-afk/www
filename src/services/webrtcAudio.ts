/**
 * Low-latency WebRTC Audio Streamer & Receiver
 * Streams high-fidelity PC/YouTube audio to Phone over Wi-Fi
 */

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const isRunningInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export class WebRTCAudioSender {
  private peerConnection: RTCPeerConnection | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sendSignalCallback: (signal: any, targetRole: 'client' | 'host') => void;
  private activeSourceNode: AudioNode | null = null;

  constructor(sendSignal: (signal: any, targetRole: 'client' | 'host') => void) {
    this.sendSignalCallback = sendSignal;
  }

  public async startCaptureSystemAudio(): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('GET_DISPLAY_MEDIA_UNSUPPORTED');
      }

      // Prompt user to select YouTube tab or desktop screen with audio enabled
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // required by browsers for getDisplayMedia
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as any,
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        // Stop video tracks immediately
        displayStream.getTracks().forEach((t) => t.stop());
        throw new Error('NO_AUDIO_SHARED');
      }

      // Stop video track to save bandwidth and CPU
      displayStream.getVideoTracks().forEach((track) => track.stop());

      // Create pure audio stream
      this.audioStream = new MediaStream([audioTracks[0]]);
      this.setupAudioAnalysis(this.audioStream);

      // Handle stream end when user stops sharing
      audioTracks[0].onended = () => {
        this.stopStream();
      };

      return this.audioStream;
    } catch (err: any) {
      console.warn('System audio capture attempt result:', err);
      const msg = (err?.message || '').toLowerCase();
      if (
        err?.name === 'NotAllowedError' &&
        (msg.includes('permissions policy') || msg.includes('disallowed'))
      ) {
        const customErr = new Error('PERMISSION_POLICY_DISALLOWED');
        (customErr as any).originalMessage = err.message;
        throw customErr;
      }
      throw err;
    }
  }

  public async startCaptureMicrophoneOrStereoMix(): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('GET_USER_MEDIA_UNSUPPORTED');
      }

      const micStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('NO_AUDIO_SHARED');
      }

      this.audioStream = micStream;
      this.setupAudioAnalysis(this.audioStream);

      audioTracks[0].onended = () => {
        this.stopStream();
      };

      return this.audioStream;
    } catch (err: any) {
      console.error('Failed to capture microphone/stereo mix:', err);
      throw err;
    }
  }

  public async startAudioFileStream(file: File): Promise<MediaStream> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const destination = this.audioContext.createMediaStreamDestination();
    const bufferSource = this.audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.loop = true;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;

    bufferSource.connect(this.gainNode);
    this.gainNode.connect(destination);
    this.gainNode.connect(this.analyser);
    // Also play locally on PC speaker
    this.gainNode.connect(this.audioContext.destination);

    bufferSource.start(0);
    this.activeSourceNode = bufferSource;

    this.audioStream = destination.stream;
    return this.audioStream;
  }

  public startSynthesizerTestStream(): MediaStream {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const destination = this.audioContext.createMediaStreamDestination();

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime);

    // Subtle melody pattern
    let step = 0;
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C - E - G - C - G - E
    const interval = setInterval(() => {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        clearInterval(interval);
        return;
      }
      step = (step + 1) % notes.length;
      osc.frequency.setTargetAtTime(notes[step], this.audioContext.currentTime, 0.05);
    }, 400);

    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    osc.connect(gain);
    gain.connect(destination);
    osc.start();
    this.activeSourceNode = osc;

    this.audioStream = destination.stream;
    this.setupAudioAnalysis(this.audioStream);

    return this.audioStream;
  }

  private setupAudioAnalysis(stream: MediaStream) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    source.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as any);
    } else {
      array.fill(0);
    }
  }

  public async initiateCallToClient(): Promise<void> {
    if (!this.audioStream) return;

    this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

    this.audioStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.audioStream!);
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalCallback(
          { candidate: event.candidate },
          'client'
        );
      }
    };

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });

    await this.peerConnection.setLocalDescription(offer);
    this.sendSignalCallback({ sdp: offer }, 'client');
  }

  public async handleSignalFromClient(signal: any): Promise<void> {
    if (!this.peerConnection) return;

    if (signal.sdp) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    } else if (signal.candidate) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (e) {
        console.warn('Error adding ICE candidate on host', e);
      }
    }
  }

  public stopStream(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((t) => t.stop());
      this.audioStream = null;
    }
    if (this.activeSourceNode) {
      try {
        (this.activeSourceNode as any).stop?.();
      } catch {}
      this.activeSourceNode = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  public isStreaming(): boolean {
    return !!this.audioStream && this.audioStream.active;
  }
}

export class WebRTCAudioReceiver {
  private peerConnection: RTCPeerConnection | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sendSignalCallback: (signal: any, targetRole: 'client' | 'host') => void;
  private onTrackCallback?: (stream: MediaStream) => void;

  constructor(
    sendSignal: (signal: any, targetRole: 'client' | 'host') => void,
    onTrack?: (stream: MediaStream) => void
  ) {
    this.sendSignalCallback = sendSignal;
    this.onTrackCallback = onTrack;
  }

  public setAudioElement(el: HTMLAudioElement | null) {
    this.remoteAudioElement = el;
  }

  public setVolume(volume0to150: number, isMuted: boolean) {
    const rawVolume = isMuted ? 0 : volume0to150 / 100;

    if (this.remoteAudioElement) {
      this.remoteAudioElement.volume = Math.min(1.0, Math.max(0, rawVolume));
      this.remoteAudioElement.muted = isMuted;
    }

    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(rawVolume, this.audioContext?.currentTime || 0);
    }
  }

  public async handleSignalFromHost(signal: any): Promise<void> {
    if (signal.sdp) {
      if (!this.peerConnection || this.peerConnection.signalingState === 'closed') {
        this.createPeerConnection();
      }

      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(signal.sdp));

      if (signal.sdp.type === 'offer') {
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);
        this.sendSignalCallback({ sdp: answer }, 'host');
      }
    } else if (signal.candidate) {
      if (this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate on client', e);
        }
      }
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalCallback({ candidate: event.candidate }, 'host');
      }
    };

    this.peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (this.remoteAudioElement) {
        this.remoteAudioElement.srcObject = stream;
        this.remoteAudioElement.play().catch((err) => {
          console.warn('AutoPlay prevented, waiting for user tap:', err);
        });
      }

      this.setupReceiverAnalysis(stream);

      if (this.onTrackCallback) {
        this.onTrackCallback(stream);
      }
    };

    return this.peerConnection;
  }

  private setupReceiverAnalysis(stream: MediaStream) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.gainNode = this.audioContext.createGain();

      source.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      // Connect to speakers
      this.gainNode.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Audio analysis setup error on client', e);
    }
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as any);
    } else {
      array.fill(0);
    }
  }

  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (this.remoteAudioElement) {
      this.remoteAudioElement.play().catch(() => {});
    }
  }

  public close(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }
}
