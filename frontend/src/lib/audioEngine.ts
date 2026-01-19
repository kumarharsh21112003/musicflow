// Web Audio API Engine for real Bass/Treble EQ with Background Playback Support
class AudioEngine {
    private audioContext: AudioContext | null = null;
    private audioElement: HTMLAudioElement | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private bassFilter: BiquadFilterNode | null = null;
    private trebleFilter: BiquadFilterNode | null = null;
    private gainNode: GainNode | null = null;
    private stereoPanner: StereoPannerNode | null = null;
    private spatialConvolver: ConvolverNode | null = null;
    private spatialGain: GainNode | null = null;
    private dryGain: GainNode | null = null;
    private isSpatialEnabled = false;
    private isInitialized = false;
    private wakeLock: any = null;
    private wasPlayingBeforeHidden = false;
    private panOscillation: number | null = null;

    init() {
        if (this.isInitialized) return;
        
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Handle visibility change for background play
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Handle page focus for audio context resume
        window.addEventListener('focus', this.handleFocus.bind(this));
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        
        // CRITICAL for mobile background playback
        (this.audioElement as any).playsInline = true;
        this.audioElement.preload = 'auto';
        this.audioElement.setAttribute('webkit-playsinline', 'true');
        this.audioElement.setAttribute('playsinline', 'true');
        
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

        // Stereo Panner for 3D effect
        this.stereoPanner = this.audioContext.createStereoPanner();
        this.stereoPanner.pan.value = 0;

        // Spatial Audio - Dry path (original signal)
        this.dryGain = this.audioContext.createGain();
        this.dryGain.gain.value = 1;

        // Spatial Audio - Wet path (reverb/spatial effect)
        this.spatialGain = this.audioContext.createGain();
        this.spatialGain.gain.value = 0; // Off by default
        
        // Create reverb impulse for spatial effect
        this.spatialConvolver = this.audioContext.createConvolver();
        this.createSpatialImpulse();
        
        // Connect: source -> bass -> treble -> gain -> panner -> [dry + spatial] -> output
        this.sourceNode.connect(this.bassFilter);
        this.bassFilter.connect(this.trebleFilter);
        this.trebleFilter.connect(this.gainNode);
        this.gainNode.connect(this.stereoPanner);
        
        // Dry path (direct)
        this.stereoPanner.connect(this.dryGain);
        this.dryGain.connect(this.audioContext.destination);
        
        // Wet/Spatial path (through convolver)
        this.stereoPanner.connect(this.spatialConvolver);
        this.spatialConvolver.connect(this.spatialGain);
        this.spatialGain.connect(this.audioContext.destination);
        
        this.isInitialized = true;
        console.log('🎧 Audio Engine initialized with EQ, Spatial Audio & Background Support');
    }

    // Create spatial impulse response for 3D surround effect
    private createSpatialImpulse() {
        if (!this.audioContext || !this.spatialConvolver) return;
        
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2; // 2 second reverb
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Create a natural decay with some randomness for spatial feel
                const decay = Math.exp(-3 * i / length);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
            }
        }
        
        this.spatialConvolver.buffer = impulse;
    }

    // Request wake lock to prevent screen from sleeping during playback
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await (navigator as any).wakeLock.request('screen');
                console.log('🔒 Wake Lock acquired for background playback');
            }
        } catch (err) {
            console.log('Wake Lock not available:', err);
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    async loadTrack(song: { _id: string, title: string, artist: string, imageUrl: string, videoId: string }) {
        if (!this.audioElement || !this.audioContext) {
            this.init();
        }
        
        // Resume audio context (important for mobile)
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }

        const videoId = song.videoId;
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
        const streamUrl = `${baseUrl.replace(/\/$/, '')}/api/stream/${videoId}`;
        
        console.log(`📡 Loading stream: ${streamUrl}`);
        
        // Update Media Session metadata for lock screen controls
        this.updateMediaSession(song);
        
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

    // Update lock screen / notification controls
    updateMediaSession(song: { title: string, artist: string, imageUrl: string }) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                album: 'MusicFlow',
                artwork: [
                    { src: song.imageUrl, sizes: '96x96', type: 'image/jpeg' },
                    { src: song.imageUrl, sizes: '128x128', type: 'image/jpeg' },
                    { src: song.imageUrl, sizes: '192x192', type: 'image/jpeg' },
                    { src: song.imageUrl, sizes: '256x256', type: 'image/jpeg' },
                    { src: song.imageUrl, sizes: '512x512', type: 'image/jpeg' },
                ]
            });
        }
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

    async play() {
        try {
            // Resume context if suspended (mobile browsers pause it)
            if (this.audioContext?.state === 'suspended') {
                await this.audioContext.resume();
            }
            await this.audioElement?.play();
            await this.requestWakeLock();
            
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        } catch (err) {
            console.error('Play failed:', err);
        }
    }

    pause() {
        this.audioElement?.pause();
        this.releaseWakeLock();
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
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

    // EQ Controls
    setBassBoost(value: number) {
        const gain = ((value - 50) / 50) * 15;
        if (this.bassFilter) {
            this.bassFilter.gain.value = gain;
        }
    }

    setTrebleBoost(value: number) {
        const gain = ((value - 50) / 50) * 15;
        if (this.trebleFilter) {
            this.trebleFilter.gain.value = gain;
        }
    }

    setLoudness(value: number) {
        const gain = 0.5 + (value / 100) * 1.5;
        if (this.gainNode) {
            this.gainNode.gain.value = gain;
        }
    }

    // Spatial Audio 3D Effect
    setSpatialAudio(enabled: boolean) {
        this.isSpatialEnabled = enabled;
        
        if (enabled) {
            // Enable spatial reverb
            if (this.spatialGain) {
                this.spatialGain.gain.value = 0.3; // 30% wet signal
            }
            if (this.dryGain) {
                this.dryGain.gain.value = 0.7; // 70% dry signal
            }
            
            // Start subtle stereo panning oscillation for 3D feel
            this.startPanOscillation();
            console.log('🎧 Spatial Audio: ON');
        } else {
            // Disable spatial reverb
            if (this.spatialGain) {
                this.spatialGain.gain.value = 0;
            }
            if (this.dryGain) {
                this.dryGain.gain.value = 1;
            }
            
            // Stop panning oscillation
            this.stopPanOscillation();
            if (this.stereoPanner) {
                this.stereoPanner.pan.value = 0; // Center
            }
            console.log('🎧 Spatial Audio: OFF');
        }
    }

    private startPanOscillation() {
        if (this.panOscillation) return;
        
        let phase = 0;
        this.panOscillation = window.setInterval(() => {
            if (this.stereoPanner && this.isSpatialEnabled) {
                // Subtle left-right movement (±0.3) at ~0.5Hz
                phase += 0.05;
                this.stereoPanner.pan.value = Math.sin(phase) * 0.3;
            }
        }, 100);
    }

    private stopPanOscillation() {
        if (this.panOscillation) {
            clearInterval(this.panOscillation);
            this.panOscillation = null;
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

    onTimeUpdate(callback: (time: number, duration: number) => void) {
        if (this.audioElement) {
            const listener = () => {
                const cur = this.audioElement?.currentTime || 0;
                const dur = this.audioElement?.duration || 0;
                // Only call if duration is valid (not NaN)
                if (!isNaN(dur)) {
                    callback(cur, dur);
                }
            };
            this.audioElement.addEventListener('timeupdate', listener);
            this.audioElement.addEventListener('durationchange', listener);
            // Also listen to loadedmetadata for initial duration
            this.audioElement.addEventListener('loadedmetadata', listener);
            
            return () => {
                this.audioElement?.removeEventListener('timeupdate', listener);
                this.audioElement?.removeEventListener('durationchange', listener);
                this.audioElement?.removeEventListener('loadedmetadata', listener);
            };
        }
        return () => {};
    }

    onEnded(callback: () => void) {
        if (this.audioElement) {
            this.audioElement.onended = callback;
        }
    }

    // Handle visibility change for background play on mobile
    private handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - store current playing state
            this.wasPlayingBeforeHidden = this.isPlaying() || false;
        } else {
            // Page is visible again - resume audio context if needed
            if (this.audioContext?.state === 'suspended') {
                this.audioContext.resume();
            }
            // If was playing before, ensure playback continues
            if (this.wasPlayingBeforeHidden && this.audioElement?.paused) {
                this.audioElement.play().catch(() => {});
            }
        }
    }

    // Handle focus to resume audio context (important for iOS)
    private handleFocus() {
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    destroy() {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.removeEventListener('focus', this.handleFocus.bind(this));
        this.audioElement?.pause();
        this.releaseWakeLock();
        this.audioContext?.close();
        this.isInitialized = false;
    }
}

// Singleton instance
export const audioEngine = new AudioEngine();
