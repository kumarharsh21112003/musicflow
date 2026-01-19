import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX, Video, VideoOff, Maximize2, Minimize2, X, Headphones, Sparkles, Shuffle, Repeat, Waves } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { audioEngine } from "@/lib/audioEngine";
import { MobilePlayer } from "./MobilePlayer";

declare global {
	interface Window {
		YT: any;
		onYouTubeIframeAPIReady: () => void;
	}
}

const formatTime = (seconds: number) => {
	if (!seconds || isNaN(seconds)) return "0:00";
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
	const { 
		currentSong, 
		isPlaying,
		setIsPlaying,
		playNext, 
		playPrevious,
		queue,
		setCurrentSong,
		audioSettings,
		updateAudioSettings,
		currentTime,
		duration,
		setCurrentTime,
		setDuration,
		volume,
		setVolume,
		isPlaybackLoading,
		setIsPlaybackLoading
	} = usePlayerStore();

	const [isMuted, setIsMuted] = useState(false);
	const [showVideo, setShowVideo] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [showAudioMenu, setShowAudioMenu] = useState(false);
	const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
	
	const playerRef = useRef<any>(null);
	const lastVideoId = useRef<string>("");

	// Initialize YouTube ONLY for video synchronization
	useEffect(() => {
		const initYT = () => {
			if (window.YT && window.YT.Player) {
				createPlayer();
			} else {
				window.onYouTubeIframeAPIReady = createPlayer;
			}
		};

		const createPlayer = () => {
			if (playerRef.current) return;
			playerRef.current = new window.YT.Player('yt-player-element', {
				height: '100%', width: '100%',
				playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, playsinline: 1 },
				events: {
					onReady: () => setIsReady(true),
					onStateChange: (e: any) => {
						// Sync video state if needed, but audio is handled by audioEngine
						if (e.data === window.YT.PlayerState.ENDED) playNext();
					}
				}
			});
		};

		initYT();
	}, []);

	// Sync Audio Engine with Store State
	useEffect(() => {
		if (!currentSong) return;
		
		const loadAndPlay = async () => {
			if (lastVideoId.current === currentSong.videoId) return;
			
			setIsPlaybackLoading(true);
			try {
				const videoId = currentSong.videoId!;
				lastVideoId.current = videoId;
				
				// Sync YouTube Video if visible
				if (isReady && playerRef.current) {
					playerRef.current.loadVideoById(videoId);
					playerRef.current.mute(); // Always mute video, audioEngine provides sound
				}

				// Global Audio Engine load
				await audioEngine.loadTrack({
					...currentSong,
					videoId: videoId
				} as any);
				setDuration(audioEngine.getDuration());
				
				if (isPlaying) {
					audioEngine.play();
					if (isReady) playerRef.current?.playVideo();
				}
				setIsPlaybackLoading(false);
			} catch (error) {
				console.error("AudioEngine failed, falling back to YouTube:", error);
				
				// Fallback Strategy: Use YouTube IFrame audio if direct stream fails
				if (isReady && playerRef.current) {
					playerRef.current.unMute();
					playerRef.current.setVolume(volume);
					if (isPlaying) playerRef.current.playVideo();
					toast.success("Using fallback player...");
				} else {
					toast.error("Failed to load song. Trying next...");
					playNext();
				}
				setIsPlaybackLoading(false);
			}
		};

		loadAndPlay();
	}, [currentSong?.videoId, isReady, setIsPlaybackLoading]);

	// Update Store Time from Audio Engine
	useEffect(() => {
		const handleTimeUpdate = (time: number) => {
			setCurrentTime(time);
			// Optional: Periodically sync video if it drifts
			if (showVideo && isReady && playerRef.current) {
				const ytTime = playerRef.current.getCurrentTime();
				if (Math.abs(ytTime - time) > 2) playerRef.current.seekTo(time, true);
			}
		};

		audioEngine.onTimeUpdate(handleTimeUpdate);
		audioEngine.onEnded(() => playNext());

		return () => {
			// Cleanup handlers if needed (engine is singleton)
		};
	}, [showVideo, isReady, playNext]);

	// Sync Play/Pause status
	useEffect(() => {
		if (isPlaying) {
			audioEngine.play();
			if (isReady) playerRef.current?.playVideo();
		} else {
			audioEngine.pause();
			if (isReady) playerRef.current?.pauseVideo();
		}
	}, [isPlaying, isReady]);

	// Sync Audio Settings
	useEffect(() => {
		audioEngine.setBassBoost(audioSettings.bassBoost);
		audioEngine.setTrebleBoost(audioSettings.trebleBoost);
		audioEngine.setLoudness(audioSettings.loudness);
		audioEngine.setVolume(volume);
	}, [audioSettings.bassBoost, audioSettings.trebleBoost, audioSettings.loudness, volume]);

	// Audio components
	useEffect(() => {
		if (playerRef.current && audioSettings) {
			// Apply loudness as volume boost for YouTube player
			const boostMultiplier = audioSettings.loudness / 70;
			const adjustedVolume = Math.min(100, volume * boostMultiplier);
			playerRef.current.setVolume?.(adjustedVolume);
		}
		
		// Apply REAL EQ to Web Audio Engine
		audioEngine.setBassBoost(audioSettings.bassBoost);
		audioEngine.setTrebleBoost(audioSettings.trebleBoost);
		audioEngine.setLoudness(audioSettings.loudness);
		
	}, [audioSettings.bassBoost, audioSettings.trebleBoost, audioSettings.loudness, volume]);

	// Media Session API (Background Play Controls)
	useEffect(() => {
		if (!currentSong) return;

		if ('mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: currentSong.title,
				artist: currentSong.artist,
				album: 'MusicFlow',
				artwork: [
					{ src: currentSong.imageUrl, sizes: '96x96', type: 'image/jpeg' },
					{ src: currentSong.imageUrl, sizes: '128x128', type: 'image/jpeg' },
					{ src: currentSong.imageUrl, sizes: '192x192', type: 'image/jpeg' },
					{ src: currentSong.imageUrl, sizes: '256x256', type: 'image/jpeg' },
					{ src: currentSong.imageUrl, sizes: '384x384', type: 'image/jpeg' },
					{ src: currentSong.imageUrl, sizes: '512x512', type: 'image/jpeg' },
				]
			});

			navigator.mediaSession.setActionHandler('play', () => {
				setIsPlaying(true);
				audioEngine.play();
				if (isReady) playerRef.current?.playVideo();
			});
			navigator.mediaSession.setActionHandler('pause', () => {
				setIsPlaying(false);
				audioEngine.pause();
				if (isReady) playerRef.current?.pauseVideo();
			});
			navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
			navigator.mediaSession.setActionHandler('nexttrack', playNext);
			
			navigator.mediaSession.setActionHandler('seekto', (details) => {
				if (details.seekTime !== undefined) {
					audioEngine.seek(details.seekTime);
					if (isReady) playerRef.current?.seekTo(details.seekTime, true);
					setCurrentTime(details.seekTime);
				}
			});
		}
	}, [currentSong, playNext, playPrevious, setIsPlaying, isReady]);

	// Update playback state for Media Session
	useEffect(() => {
		if ('mediaSession' in navigator) {
			navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
		}
	}, [isPlaying]);

	const handlePlayPause = () => {
		if (!currentSong && queue.length > 0) {
			setCurrentSong(queue[0]);
			return;
		}
		setIsPlaying(!isPlaying);
	};

	const handleSeek = (value: number[]) => {
		const newTime = value[0];
		setCurrentTime(newTime);
		audioEngine.seek(newTime);
		if (isReady && playerRef.current?.seekTo) {
			playerRef.current.seekTo(newTime, true);
		}
	};

	const handleVolumeChange = (value: number[]) => {
		setVolume(value[0]);
		setIsMuted(value[0] === 0);
		audioEngine.setVolume(value[0]);
		if (isReady) playerRef.current?.setVolume?.(value[0]);
	};

	const handleMute = () => {
		if (playerRef.current) {
			isMuted ? playerRef.current.unMute() : playerRef.current.mute();
			if (isMuted) playerRef.current.setVolume(volume);
		}
		setIsMuted(!isMuted);
	};

	const getVolumeIcon = () => {
		if (isMuted || volume === 0) return <VolumeX className='h-4 w-4' />;
		if (volume < 50) return <Volume1 className='h-4 w-4' />;
		return <Volume2 className='h-4 w-4' />;
	};

	// Drag handlers
	const handleDragStart = (e: React.MouseEvent) => {
		if (isFullscreen) return;
		setIsDragging(true);
		dragStartRef.current = {
			x: e.clientX,
			y: e.clientY,
			posX: videoPosition.x,
			posY: videoPosition.y
		};
		
		const handleMouseMove = (e: MouseEvent) => {
			const dx = e.clientX - dragStartRef.current.x;
			const dy = e.clientY - dragStartRef.current.y;
			setVideoPosition({
				x: dragStartRef.current.posX + dx,
				y: dragStartRef.current.posY + dy
			});
		};
		
		const handleMouseUp = () => {
			setIsDragging(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
		
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	const [showMobilePlayer, setShowMobilePlayer] = useState(false);

	return (
		<>
			<MobilePlayer isOpen={showMobilePlayer} onClose={() => setShowMobilePlayer(false)} />

			{/* Video Container - GLOBAL (Required for audio even on mobile) */}
			<div 
				style={{
					position: 'fixed',
					...(showVideo 
						? (isFullscreen 
							? { inset: 0, zIndex: 9999 }
							: { 
								bottom: 112 - videoPosition.y, 
								right: 16 - videoPosition.x, 
								width: 384, 
								height: 216, 
								zIndex: 9999, 
								borderRadius: 12,
								cursor: isDragging ? 'grabbing' : 'default'
							})
						: { top: -9999, left: -9999, width: 1, height: 1, opacity: 0 }
					),
					backgroundColor: 'black',
					overflow: 'hidden',
					boxShadow: showVideo && !isFullscreen ? '0 10px 40px rgba(0,0,0,0.5)' : 'none',
					border: showVideo && !isFullscreen ? '1px solid #333' : 'none'
				}}
			>
				{/* DRAG HANDLE - Top bar is draggable */}
				<div 
					style={{ 
						display: showVideo ? 'flex' : 'none',
						position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
						justifyContent: 'space-between', alignItems: 'center', padding: 12,
						background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)',
						cursor: isFullscreen ? 'default' : 'grab'
					}}
					onMouseDown={handleDragStart}
				>
					<span style={{ fontSize: 14, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8, pointerEvents: 'none' }}>
						{currentSong?.title}
					</span>
					<div style={{ display: 'flex', gap: 8 }}>
						<button 
							onClick={() => setIsFullscreen(!isFullscreen)}
							onMouseDown={(e) => e.stopPropagation()}
							style={{ padding: 8, borderRadius: 9999, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer' }}
						>
							{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
						</button>
						<button 
							onClick={() => { setShowVideo(false); setIsFullscreen(false); setVideoPosition({ x: 0, y: 0 }); }}
							onMouseDown={(e) => e.stopPropagation()}
							style={{ padding: 8, borderRadius: 9999, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer' }}
						>
							<X size={16} />
						</button>
					</div>
				</div>
				
				<div id="yt-player-element" style={{ width: '100%', height: '100%' }} />
				
				{/* FULL OVERLAY - Blocks ALL clicks on video */}
				<div 
					style={{
						position: 'absolute',
						top: 0, left: 0, right: 0, bottom: 0,
						zIndex: 14,
						cursor: 'default'
					}} 
					onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
				/>
				
				{/* Simple subtle gradients */}
				<div style={{
					position: 'absolute', top: 0, left: 0, right: 0, height: 40,
					background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
					zIndex: 15, pointerEvents: 'none'
				}} />
				<div style={{
					position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
					background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
					zIndex: 15, pointerEvents: 'none'
				}} />
			</div>

			{/* MOBILE FLOATING PLAYER (Spotify Style) */}
			<div 
				className={`md:hidden fixed bottom-[80px] left-2 right-2 bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-lg flex flex-col z-[100] border border-white/5 transition-all duration-300 ease-out ${!currentSong ? 'translate-y-[200%]' : 'translate-y-0 active:scale-95'}`}
				onClick={() => setShowMobilePlayer(true)}
			>
				<div className="flex items-center gap-3 p-2 h-[56px]">
					<img 
						src={currentSong?.imageUrl} 
						alt="Album Art" 
						className="w-10 h-10 rounded-md bg-zinc-800 object-cover flex-shrink-0 shadow-md" 
						onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
					/>
					<div className="flex-1 min-w-0 flex flex-col justify-center">
						<div className="font-bold text-[13px] text-white truncate leading-tight">
							{currentSong?.title || "Choose a song"}
						</div>
						<div className="text-[11px] text-zinc-400 font-medium truncate leading-tight opacity-80">
							{currentSong?.artist}
						</div>
					</div>
					
					{/* Mobile Controls */}
					<div className="flex items-center gap-5 px-2">
                        <button className="text-zinc-400 hidden sm:block">
                            <Headphones size={20} />
                        </button>
						<button 
							onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} 
							className="text-white hover:scale-105 active:scale-90 transition-transform disabled:opacity-50"
							disabled={isPlaybackLoading}
						>
							{isPlaybackLoading ? (
								<div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : isPlaying ? (
								<Pause size={28} fill="currentColor" />
							) : (
								<Play size={28} fill="currentColor" />
							)}
						</button>
					</div>
				</div>
				{/* Razor-thin Progress Bar at the bottom */}
				<div className="absolute bottom-0 left-[8px] right-[8px] h-[2px] bg-white/10 rounded-full overflow-hidden">
					<div 
						className="h-full bg-white rounded-full transition-all duration-300 linear" 
						style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
					/>
				</div>
			</div>

			{/* DESKTOP FOOTER PLAYER */}
			<footer className='hidden md:flex h-24 bg-zinc-900 border-t border-zinc-800 px-4 flex-col justify-center relative z-50'>
				
				<div className='flex justify-between items-center h-full max-w-[1800px] mx-auto w-full'>
					{/* Song info */}
					<div className='hidden sm:flex items-center gap-4 min-w-[200px] w-[30%]'>
						{currentSong ? (
							<>
								<img
									src={`https://i.ytimg.com/vi/${currentSong.videoId}/mqdefault.jpg`}
									alt={currentSong.title}
									className='w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80 transition'
									onClick={() => setShowVideo(!showVideo)}
								/>
								<div className='flex-1 min-w-0'>
									<div className='font-medium truncate text-sm'>{currentSong.title}</div>
									<div className='text-xs text-zinc-400 truncate'>{currentSong.artist}</div>
								</div>
							</>
						) : (
							<div className='text-zinc-500 text-sm'>Select a song</div>
						)}
					</div>

					{/* Controls */}
					<div className='flex flex-col items-center gap-1 flex-1 max-w-[600px]'>
						<div className='flex items-center gap-4'>
							<Button size='icon' variant='ghost' className='hidden sm:inline-flex text-zinc-400 hover:text-white h-8 w-8'>
								<Shuffle className='h-4 w-4' />
							</Button>
							<Button size='icon' variant='ghost' className='text-zinc-400 hover:text-white h-8 w-8' onClick={playPrevious}>
								<SkipBack className='h-4 w-4' />
							</Button>
							<Button size='icon' className='bg-white hover:bg-white/90 text-black rounded-full h-9 w-9' onClick={handlePlayPause}>
								{isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5 ml-0.5' />}
							</Button>
							<Button size='icon' variant='ghost' className='text-zinc-400 hover:text-white h-8 w-8' onClick={playNext}>
								<SkipForward className='h-4 w-4' />
							</Button>
							<Button size='icon' variant='ghost' className='hidden sm:inline-flex text-zinc-400 hover:text-white h-8 w-8'>
								<Repeat className='h-4 w-4' />
							</Button>
							{/* Mix Mode Button with Dropdown */}
							<div className='relative hidden sm:block'>
								<Button 
									size='icon' 
									variant='ghost' 
									className={`h-8 w-8 ${(audioSettings.mixMode || 'off') !== 'off' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
									onClick={() => {
										// Cycle through modes
										const modes: ('off' | 'fade' | 'rise' | 'blend' | 'party')[] = ['off', 'fade', 'rise', 'blend', 'party'];
										const currentIdx = modes.indexOf(audioSettings.mixMode || 'off');
										const nextMode = modes[(currentIdx + 1) % modes.length];
										updateAudioSettings({ mixMode: nextMode, crossfadeEnabled: nextMode !== 'off' });
										const modeNames: Record<string, string> = {
											off: 'Mix OFF',
											fade: '🎵 Fade Mode',
											rise: '🚀 Rise Mode', 
											blend: '🌊 Blend Mode',
											party: '🎉 Party Mode'
										};
										toast.success(modeNames[nextMode], { duration: 1500 });
									}}
									title='Mix Mode - Click to cycle'
								>
									<Waves className='h-4 w-4' />
								</Button>
								{(audioSettings.mixMode || 'off') !== 'off' && (
									<span className='absolute -top-1 -right-1 text-[9px] bg-emerald-500 text-black px-1 rounded font-bold uppercase'>
										{(audioSettings.mixMode || 'off').slice(0, 1)}
									</span>
								)}
							</div>
						</div>

						<div className='flex items-center gap-2 w-full'>
							<span className='text-xs text-zinc-400 w-10 text-right font-mono'>{formatTime(currentTime)}</span>
							<Slider value={[currentTime]} max={duration || 100} step={1} className='flex-1' onValueChange={handleSeek} />
							<span className='text-xs text-zinc-400 w-10 font-mono'>{formatTime(duration)}</span>
						</div>
					</div>
					
					{/* Volume & Audio Quality */}
					<div className='hidden sm:flex items-center gap-3 min-w-[200px] w-[30%] justify-end'>
						{/* Audio Quality Badge */}
						<div className='flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded text-emerald-400 text-xs font-bold'>
							<Sparkles className='h-3 w-3' />
							<span>{audioSettings.qualityMode === 'ultra' ? 'ULTRA' : 'HQ'}</span>
						</div>
						
						{/* Audio Enhancement Button */}
						<div className='relative'>
							<Button 
								size='icon' variant='ghost' 
								className={`h-8 w-8 ${showAudioMenu ? 'text-emerald-400' : 'text-zinc-400 hover:text-emerald-400'}`}
								onClick={() => setShowAudioMenu(!showAudioMenu)}
								title='Audio Enhancement'
							>
								<Headphones className='h-4 w-4' />
							</Button>

							{/* Audio Settings Dropdown */}
							{showAudioMenu && (
								<>
									<div className='fixed inset-0 z-40' onClick={() => setShowAudioMenu(false)} />
									<div className='absolute bottom-12 right-0 bg-zinc-800 rounded-lg shadow-xl z-50 p-4 w-[280px] border border-zinc-700'>
										<div className='flex items-center justify-between mb-4'>
											<h3 className='font-bold text-sm'>Audio Enhancement</h3>
											<div className='flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded text-emerald-400 text-xs'>
												<Sparkles className='h-3 w-3' />
												PREMIUM
											</div>
										</div>

										{/* Quality Mode */}
										<div className='mb-4'>
											<label className='text-xs text-zinc-400 mb-2 block'>Quality Mode</label>
											<div className='flex gap-2'>
												{(['auto', 'high', 'ultra'] as const).map((mode) => (
													<button
														key={mode}
														onClick={() => {
															updateAudioSettings({ qualityMode: mode });
															toast.success(`Quality: ${mode.toUpperCase()}`, { icon: '✨', duration: 1500 });
														}}
														className={`flex-1 py-2 rounded text-xs font-medium transition-all
															${audioSettings.qualityMode === mode 
																? 'bg-emerald-500 text-black' 
																: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
													>
														{mode.toUpperCase()}
													</button>
												))}
											</div>
										</div>

										{/* Bass Boost */}
										<div className='mb-3'>
											<div className='flex justify-between text-xs mb-1'>
												<span className='text-zinc-400'>Bass Boost</span>
												<span className='text-emerald-400'>{audioSettings.bassBoost}%</span>
											</div>
											<Slider 
												value={[audioSettings.bassBoost]} 
												max={100} 
												onValueChange={(v) => updateAudioSettings({ bassBoost: v[0] })}
												className='w-full'
											/>
										</div>

										{/* Treble */}
										<div className='mb-3'>
											<div className='flex justify-between text-xs mb-1'>
												<span className='text-zinc-400'>Treble</span>
												<span className='text-emerald-400'>{audioSettings.trebleBoost}%</span>
											</div>
											<Slider 
												value={[audioSettings.trebleBoost]} 
												max={100} 
												onValueChange={(v) => updateAudioSettings({ trebleBoost: v[0] })}
												className='w-full'
											/>
										</div>

										{/* Loudness */}
										<div className='mb-4'>
											<div className='flex justify-between text-xs mb-1'>
												<span className='text-zinc-400'>Loudness</span>
												<span className='text-emerald-400'>{audioSettings.loudness}%</span>
											</div>
											<Slider 
												value={[audioSettings.loudness]} 
												max={100} 
												onValueChange={(v) => updateAudioSettings({ loudness: v[0] })}
												className='w-full'
											/>
										</div>

										{/* Spatial Audio Toggle */}
										<div className='flex items-center justify-between p-2 bg-zinc-700/50 rounded'>
											<div>
												<p className='text-sm font-medium'>Spatial Audio</p>
												<p className='text-xs text-zinc-400'>3D surround effect</p>
											</div>
											<button
												onClick={() => updateAudioSettings({ spatialAudio: !audioSettings.spatialAudio })}
												className={`w-10 h-6 rounded-full relative transition-colors
													${audioSettings.spatialAudio ? 'bg-emerald-500' : 'bg-zinc-600'}`}
											>
												<div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all
													${audioSettings.spatialAudio ? 'right-1' : 'left-1'}`} />
											</button>
										</div>
									</div>
								</>
							)}
						</div>
						
						<Button 
							size='icon' variant='ghost' 
							className={`h-8 w-8 ${showVideo ? 'text-emerald-500' : 'text-zinc-400'}`} 
							onClick={() => setShowVideo(!showVideo)}
						>
							{showVideo ? <Video className='h-4 w-4' /> : <VideoOff className='h-4 w-4' />}
						</Button>
						<Button size='icon' variant='ghost' className='h-8 w-8 text-zinc-400' onClick={handleMute}>
							{getVolumeIcon()}
						</Button>
						<Slider value={[isMuted ? 0 : volume]} max={100} step={1} className='w-24' onValueChange={handleVolumeChange} />
					</div>
				</div>
			</footer>
		</>
	);
};
