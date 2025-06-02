

// Fix: Import LiveMusicGenerationConfig instead of MusicGenerationConfig
import { GoogleGenAI, type LiveMusicSession, type LiveMusicServerMessage, type WeightedPrompt, type LiveMusicGenerationConfig, Scale, MusicGenerationMode } from '@google/genai';
import { decode, decodeAudioData } from './utils';

const MODEL_NAME = 'lyria-realtime-exp'; 

export type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';

export interface LiveMusicServiceCallbacks {
  onPlaybackStateChange: (newState: PlaybackState) => void;
  onFilteredPrompt: (filteredPrompt: { text: string; filteredReason: string }) => void;
  onSetupComplete: () => void;
  onError: (error: string) => void;
  onClose: (message: string) => void;
  onOutputNodeChanged: (newNode: AudioNode) => void;
}

// Re-export MusicGenerationConfig and enums if they are to be used externally by consuming UI
export { Scale, MusicGenerationMode };
// Fix: Export LiveMusicGenerationConfig
export type { LiveMusicGenerationConfig };


const DEFAULT_MUSIC_GENERATION_CONFIG: LiveMusicGenerationConfig = {
  guidance: 4.0,
  bpm: 120,
  density: 0.5,
  brightness: 0.5,
  scale: Scale.C_MAJOR_A_MINOR,
  muteBass: false,
  muteDrums: false,
  onlyBassAndDrums: false,
  musicGenerationMode: MusicGenerationMode.QUALITY,
};

// let liveMusicService: LiveMusicService;

// const test = () => {
//     console.log("test");

//     (async () => {
//         const promptsToSend = [{text: "ambient", weight: 1, promptId: "test", cc: 0, color: "red"}]
//         await liveMusicService.setWeightedPrompts(promptsToSend);
//         console.log("liveMusicService connect 2", liveMusicService);
//         await liveMusicService.connect();
        
//         if (liveMusicService.isConnected()) {
//             const promptsToSend = [{text: "ambient", weight: 1, promptId: "test", cc: 0, color: "red"}]
//           await liveMusicService.setWeightedPrompts(promptsToSend);

//         } else {
//           // this.playbackState = 'stopped'; // Reflect failed initial connection
//           console.error("error", "failed to connect to live music service");
//         }
//     })();
// }

export class LiveMusicService {
  private ai: GoogleGenAI;
  private session: LiveMusicSession | null = null;
  private audioContext: AudioContext;
  private outputNode: GainNode;
  private nextStartTime = 0;
  private readonly bufferTime = 2; // Audio buffer in seconds for network latency
  private connectionError = false;
  private currentPlaybackState: PlaybackState = 'stopped';
  private musicConfig: LiveMusicGenerationConfig;

  private callbacks: LiveMusicServiceCallbacks;

  constructor(
    apiKey: string, 
    audioCtx: AudioContext, 
    callbacks: LiveMusicServiceCallbacks,
    initialConfig?: Partial<LiveMusicGenerationConfig>
  ) {
    if (!apiKey) {
        throw new Error("API_KEY is required to initialize LiveMusicService.");
    }
    // Fix: Initialize GoogleGenAI with named apiKey parameter
    this.ai = new GoogleGenAI({ apiKey });
    this.audioContext = audioCtx;
    this.callbacks = callbacks;
    this.outputNode = this.audioContext.createGain();
    this.musicConfig = { ...DEFAULT_MUSIC_GENERATION_CONFIG, ...initialConfig };
  }

  private setPlaybackState(newState: PlaybackState) {
    if (this.currentPlaybackState !== newState) {
      this.currentPlaybackState = newState;
      this.callbacks.onPlaybackStateChange(newState);
    }
  }

  public getOutputNode(): AudioNode {
    return this.outputNode;
  }

  public getCurrentAudioContextTime(): number {
    return this.audioContext.currentTime;
  }

  public getCurrentMusicGenerationConfig(): Readonly<LiveMusicGenerationConfig> {
    return this.musicConfig;
  }

  async connect() {
    if (this.session && !this.connectionError) {
      console.warn('Already connected or connecting.');
      return;
    }
    this.setPlaybackState('loading');
    this.connectionError = false;
    try {
      this.session = await this.ai.live.music.connect({
        model: MODEL_NAME,
        callbacks: {
          onmessage: async (e: LiveMusicServerMessage) => this.handleServerMessage(e),
          onerror: (e: ErrorEvent) => this.handleError(e),
          onclose: (e: CloseEvent) => this.handleClose(e),
        },
      });
      // The redundant this.session.setMusicGenerationConfig(this.musicConfig) call is removed.
      // It's now part of the connect request's 'config' property.

      // onSetupComplete will be called from handleServerMessage
    } catch (error: any) {
      console.error('Failed to connect to LiveMusicSession:', error);
      this.connectionError = true;
      this.setPlaybackState('stopped');
      this.callbacks.onError(`Connection failed: ${error.message || 'Unknown error'}`);
    }
  }

  private async handleServerMessage(e: LiveMusicServerMessage) {
    console.error("LiveMusicService -- handleServerMessage", e);
    if (e.setupComplete) {
      console.error("setupComplete", e);
      this.connectionError = false;
      this.callbacks.onSetupComplete();
    }
    if (e.filteredPrompt) {
      const { text, filteredReason } = e.filteredPrompt;
      if (typeof text === 'string' && typeof filteredReason === 'string') {
        this.callbacks.onFilteredPrompt({ text, filteredReason });
      } else {
        console.warn('Received filtered prompt with missing text or reason:', e.filteredPrompt);
      }
    }
    if (e.serverContent?.audioChunks !== undefined) {
      if (this.currentPlaybackState === 'paused' || this.currentPlaybackState === 'stopped') return;

      const audioBuffer = await decodeAudioData(
        decode(e.serverContent?.audioChunks[0].data),
        this.audioContext,
        48000, 
        2,     
      );

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);

      if (this.nextStartTime === 0) {
        this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
        setTimeout(() => {
            if (this.currentPlaybackState === 'loading' && 
                this.audioContext.currentTime >= this.nextStartTime - this.bufferTime * 0.8) {
                 this.setPlaybackState('playing');
            }
        }, this.bufferTime * 1000);
      }

      if (this.nextStartTime < this.audioContext.currentTime) {
        console.warn('Audio buffer underrun, re-buffering.');
        this.setPlaybackState('loading');
        this.nextStartTime = this.audioContext.currentTime + this.bufferTime;
        this.callbacks.onError('Audio buffer underrun, re-buffering.');
      }
      
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    }
  }

  private handleError(e: ErrorEvent) {
    console.error('LiveMusicSession handleError:', e);
    this.connectionError = true;
    this.stopInternally(false); 
    this.callbacks.onError(`Session error: ${e.message || 'Unknown error'}`);
  }

  private handleClose(e: CloseEvent) {
    console.warn('LiveMusicSession closed:', e);
    this.connectionError = true;
    this.stopInternally(false); 
    this.callbacks.onClose(`Session closed. Code: ${e.code}, Reason: ${e.reason || 'No reason specified'}`);
  }

  async setWeightedPrompts(prompts: WeightedPrompt[]) {
    if (!this.session || this.connectionError) {
      this.callbacks.onError('Session not available or connection error. Cannot set prompts.');
      if (prompts.length > 0) this.pause(); 
      return;
    }
    try {
      await this.session.setWeightedPrompts({ weightedPrompts: prompts });
    } catch (error: any) {
      console.error('Error setting weighted prompts:', error);
      this.callbacks.onError(`Failed to set prompts: ${error.message}`);
      this.pause(); 
    }
  }

  async setMusicGenerationConfig(updates: Partial<LiveMusicGenerationConfig>): Promise<void> {
    const oldBpm = this.musicConfig.bpm;
    const oldScale = this.musicConfig.scale;
  
    // Update the stored desired config
    this.musicConfig = { ...this.musicConfig, ...updates };
  
    if (this.session && !this.connectionError) {
      try {
        // Fix: Wrap musicConfig in an object with musicGenerationConfig property
        await this.session.setMusicGenerationConfig({ musicGenerationConfig: this.musicConfig });
        console.log('Music generation config sent to active session.');

        const bpmChanged = updates.bpm !== undefined && updates.bpm !== oldBpm;
        const scaleChanged = updates.scale !== undefined && updates.scale !== oldScale;

        if (bpmChanged || scaleChanged) {
          let changedParamsMessage = [];
          if (bpmChanged) changedParamsMessage.push("BPM");
          if (scaleChanged) changedParamsMessage.push("Scale");
          console.warn(`${changedParamsMessage.join(' and ')} changed. While the new config has been sent, these parameters may require a session reconnect (e.g., stop and play) to fully take effect with the Lyria model.`);
        }
      } catch (error: any) {
        console.error('Error setting music generation config on active session:', error);
        this.callbacks.onError(`Failed to update music config on session: ${error.message}`);
      }
    } else {
      // If no active session, the config is updated locally and will be used on the next connection.
      console.log('Music config updated locally. Settings will be applied on the next connection.');
    }
  }

  play() {
    if (!this.session || this.connectionError) {
      this.callbacks.onError('Cannot play, session not initialized or connection error.');
      return;
    }

    this.audioContext.resume().then(() => {
        if(this.session && !this.connectionError) { 
            this.session.play();
            this.setPlaybackState('loading'); 
            this.outputNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.outputNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1); 
        } else {
             this.callbacks.onError('Cannot play, session became unavailable before play command.');
        }
    }).catch(err => {
        console.error("AudioContext resume failed:", err);
        this.callbacks.onError("Could not resume audio context to play.");
    });
  }
  
  private resetOutputNode() {
    if (this.outputNode) {
        try {
            this.outputNode.disconnect();
        } catch(e) { console.warn("Error disconnecting old output node:", e); }
    }
    this.outputNode = this.audioContext.createGain();
    this.callbacks.onOutputNodeChanged(this.outputNode);
  }

  pause() {
    if (this.session) {
      this.session.pause();
    }
    this.setPlaybackState('paused');
    if (this.outputNode) {
        this.outputNode.gain.setValueAtTime(this.outputNode.gain.value, this.audioContext.currentTime);
        this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    }
    this.nextStartTime = 0; 
    this.resetOutputNode(); 
  }

  private stopInternally(shouldStopSession: boolean) {
    if (shouldStopSession && this.session) {
        try {
            this.session.stop();
        } catch (e) {
            console.warn("Error stopping session:", e);
        }
    }
    this.setPlaybackState('stopped');
     if (this.outputNode) {
        this.outputNode.gain.setValueAtTime(this.outputNode.gain.value, this.audioContext.currentTime);
        this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    }
    this.nextStartTime = 0;
    this.resetOutputNode();
  }

  stop() {
    this.stopInternally(true);
  }

  public isConnected(): boolean {
    return !!this.session && !this.connectionError;
  }

  public hasConnectionError(): boolean {
    return this.connectionError;
  }

  public getPlaybackState(): PlaybackState {
    return this.currentPlaybackState;
  }

  public async reconnect() {
    console.log("Attempting to reconnect LiveMusicService...");
    if (this.session) {
        try {
            await this.session.stop();
        } catch(e) { console.warn("Error stopping existing session during reconnect:", e); }
        this.session = null;
    }
    this.connectionError = false;
    this.nextStartTime = 0;
    this.setPlaybackState('stopped');
    this.resetOutputNode(); 
    await this.connect(); 
  }

  dispose() {
    if (this.session) {
      try {
        this.session.stop();
      } catch (e) { console.warn("Error stopping session during dispose:", e); }
      this.session = null;
    }
    if (this.outputNode) {
      this.outputNode.disconnect();
    }
    console.log('LiveMusicService disposed');
  }
}