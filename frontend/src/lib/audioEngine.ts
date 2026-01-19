// Web Audio API Engine for real Bass/Treble EQ
class AudioEngine {
    private audioContext: AudioContext | null = null;
    private audioElement: HTMLAudioElement | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private bassFilter: BiquadFilterNode | null = null;
    private trebleFilter: BiquadFilterNode | null = null;
    private gainNode: GainNode | null = null;
    private isInitialized = false;

    init() {
        if (this.isInitialized) return;
        
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        // Critical for iOS/Android background play
        (this.audioElement as any).playsInline = true;
        this.audioElement.preload = 'auto';
        
        // Create source from audio element
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        
        // Bass filter (low-shelf at 200Hz)
        this.bassFilter = this.audioContext.createBiquadFilter();
        this.bassFilter.type = 'lowshelf';
        this.bassFilter.frequency.value = 200;
        this.bassFilter.gain.value = 0;
        
        // Treble filter (high-shelf at 3000Hz)
        this.trebleFilter = this.audioContext.createBiquadFilter();
        this.trebleFilter.type = 'highshelf';
        this.trebleFilter.frequency.value = 3000;
        this.trebleFilter.gain.value = 0;
        
        // Gain/Loudness
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1;
        
        // Connect: source -> bass -> treble -> gain -> output
        this.sourceNode.connect(this.bassFilter);
        this.bassFilter.connect(this.trebleFilter);
        this.trebleFilter.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        this.isInitialized = true;
        console.log('🎧 Audio Engine initialized with EQ');
    }

    async loadTrack(song: { _id: string, title: string, artist: string, imageUrl: string, videoId: string }) {
        if (!this.audioElement || !this.audioContext) {
            this.init();
        }
        
        // Resume audio context
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }

        const videoId = song.videoId;
        // Construct stream URL carefully
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
        const streamUrl = `${baseUrl.replace(/\/$/, '')}/api/stream/${videoId}`;
        
        console.log(`📡 Loading stream: ${streamUrl}`);
        
        return new Promise<void>((resolve, reject) => {
            if (!this.audioElement) return reject(new Error('Audio element not initialized'));
            
            const handleCanPlay = () => {
                cleanup();
                resolve();
            };
            
            const handleError = () => {
                cleanup();
                console.error('❌ Audio Engine Error:', this.audioElement?.error);
                reject(new Error('Failed to load audio stream'));
            };
            
            const cleanup = () => {
                this.audioElement!.removeEventListener('canplay', handleCanPlay);
                this.audioElement!.removeEventListener('error', handleError);
            };
            
            this.audioElement.addEventListener('canplay', handleCanPlay);
            this.audioElement.addEventListener('error', handleError);
            
            this.audioElement.src = streamUrl;
            this.audioElement.load();
        });
    }

    setMediaSessionHandlers(handlers: { 
        play: () => void, 
        pause: () => void, 
        previoustrack: () => void, 
        nexttrack: () => void,
        seekto?: (details: MediaSessionActionDetails) => void 
    }) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', handlers.play);
            navigator.mediaSession.setActionHandler('pause', handlers.pause);
            navigator.mediaSession.setActionHandler('previoustrack', handlers.previoustrack);
            navigator.mediaSession.setActionHandler('nexttrack', handlers.nexttrack);
            if (handlers.seekto) {
                navigator.mediaSession.setActionHandler('seekto', handlers.seekto);
            }
        }
    }

    play() {
        this.audioElement?.play();
    }

    pause() {
        this.audioElement?.pause();
    }

    seek(time: number) {
        if (this.audioElement) {
            this.audioElement.currentTime = time;
        }
    }

    setVolume(value: number) {
        if (this.audioElement) {
            this.audioElement.volume = value / 100;
        }
    }

    // EQ Controls - Real audio processing!
    setBassBoost(value: number) {
        // Convert 0-100 to -15 to +15 dB
        const gain = ((value - 50) / 50) * 15;
        if (this.bassFilter) {
            this.bassFilter.gain.value = gain;
            console.log(`🔊 Bass: ${gain.toFixed(1)}dB`);
        }
    }

    setTrebleBoost(value: number) {
        // Convert 0-100 to -15 to +15 dB
        const gain = ((value - 50) / 50) * 15;
        if (this.trebleFilter) {
            this.trebleFilter.gain.value = gain;
            console.log(`🔔 Treble: ${gain.toFixed(1)}dB`);
        }
    }

    setLoudness(value: number) {
        // Convert 0-100 to 0.5 to 2.0 gain
        const gain = 0.5 + (value / 100) * 1.5;
        if (this.gainNode) {
            this.gainNode.gain.value = gain;
            console.log(`📢 Loudness: ${(gain * 100).toFixed(0)}%`);
        }
    }

    getCurrentTime() {
        return this.audioElement?.currentTime || 0;
    }

    getDuration() {
        return this.audioElement?.duration || 0;
    }

    isPlaying() {
        return this.audioElement && !this.audioElement.paused;
    }

    onTimeUpdate(callback: (time: number) => void) {
        if (this.audioElement) {
            this.audioElement.ontimeupdate = () => callback(this.audioElement!.currentTime);
        }
    }

    onEnded(callback: () => void) {
        if (this.audioElement) {
            this.audioElement.onended = callback;
        }
    }

    destroy() {
        this.audioElement?.pause();
        this.audioContext?.close();
        this.isInitialized = false;
    }
}

// Singleton instance
export const audioEngine = new AudioEngine();
