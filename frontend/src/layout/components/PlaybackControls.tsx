import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX, Video, VideoOff, Shuffle, Repeat, Maximize2, Minimize2, X, Headphones, Sparkles, Waves } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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
		setVolume
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
	const progressRef = useRef<any>(null);
	const lastVideoId = useRef<string>("");

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
				height: '100%',
				width: '100%',
				playerVars: {
					autoplay: 0,
					controls: 0,
					modestbranding: 1,
					rel: 0,
					showinfo: 0,
					iv_load_policy: 3,
					disablekb: 1,
					fs: 0,
					playsinline: 1,
					origin: window.location.origin,
				},
				events: {
					onReady: (e: any) => {
						setIsReady(true);
						e.target.setVolume(volume);
					},
					onStateChange: (e: any) => {
						if (e.data === window.YT.PlayerState.PLAYING) {
							setIsPlaying(true);
							setDuration(playerRef.current.getDuration());
							startProgressTracker();
						} else if (e.data === window.YT.PlayerState.PAUSED) {
							setIsPlaying(false);
							stopProgressTracker();
						} else if (e.data === window.YT.PlayerState.ENDED) {
							stopProgressTracker();
							playNext();
						}
					},
					onError: () => playNext()
				}
			});
		};

		initYT();
		return () => stopProgressTracker();
	}, []);

	useEffect(() => {
		if (!currentSong?.videoId || !isReady || !playerRef.current) return;
		if (lastVideoId.current === currentSong.videoId) return;
		
		lastVideoId.current = currentSong.videoId;
		setCurrentTime(0);
		playerRef.current.loadVideoById(currentSong.videoId);
	}, [currentSong?.videoId, isReady]);

	const startProgressTracker = useCallback(() => {
		stopProgressTracker();
		let crossfadeTriggered = false;
		
		progressRef.current = setInterval(() => {
			if (playerRef.current?.getCurrentTime) {
				const time = playerRef.current.getCurrentTime();
				const dur = playerRef.current.getDuration() || 0;
				setCurrentTime(time);
				setDuration(dur);
				
				// Mix Mode transitions (with fallback for old persisted state)
				const mixMode = audioSettings.mixMode || 'off';
				const isMixEnabled = mixMode !== 'off' || audioSettings.crossfadeEnabled;
				
				if (isMixEnabled && dur > 0 && !crossfadeTriggered) {
					const timeLeft = dur - time;
					
					// Mix mode configurations
					const mixConfigs = {
						off: { fadeDuration: 8, switchAt: 4, fadeIn: [0.4, 0.7, 1] },
						fade: { fadeDuration: 10, switchAt: 5, fadeIn: [0.3, 0.6, 1] }, // Smooth linear fade
						rise: { fadeDuration: 6, switchAt: 3, fadeIn: [0.5, 0.8, 1] }, // Quick rise
						blend: { fadeDuration: 12, switchAt: 6, fadeIn: [0.2, 0.5, 0.8, 1] }, // Long blend
						party: { fadeDuration: 4, switchAt: 2, fadeIn: [0.6, 0.9, 1] }, // Quick party transition
					};
					
					const config = mixConfigs[mixMode] || mixConfigs.off;
					const fadeDuration = audioSettings.crossfadeDuration || config.fadeDuration;
					
					// Start fading when timeLeft <= fadeDuration
					if (timeLeft <= fadeDuration && timeLeft > 0) {
						let fadePercent = timeLeft / fadeDuration;
						
						// Apply different fade curves based on mode
						if (mixMode === 'rise') {
							fadePercent = Math.pow(fadePercent, 0.5); // Faster initial fade
						} else if (mixMode === 'blend') {
							fadePercent = Math.pow(fadePercent, 1.5); // Slower initial fade
						} else if (mixMode === 'party') {
							fadePercent = fadePercent < 0.5 ? 0 : fadePercent * 2 - 1; // Abrupt
						}
						
						const fadeVolume = Math.floor(volume * fadePercent);
						playerRef.current.setVolume?.(fadeVolume);
						
						// Switch to next song
						if (timeLeft <= config.switchAt) {
							crossfadeTriggered = true;
							playNext();
							// Fade in next song based on config
							const fadeIn = config.fadeIn;
							setTimeout(() => {
								playerRef.current?.setVolume?.(Math.floor(volume * fadeIn[0]));
								fadeIn.slice(1).forEach((val, i) => {
									setTimeout(() => playerRef.current?.setVolume?.(Math.floor(volume * val)), (i + 1) * 300);
								});
							}, 200);
						}
					}
				}
			}
		}, 200);
	}, [audioSettings.crossfadeEnabled, audioSettings.crossfadeDuration, audioSettings.mixMode, volume, playNext]);

	const stopProgressTracker = useCallback(() => {
		if (progressRef.current) {
			clearInterval(progressRef.current);
			progressRef.current = null;
		}
	}, []);

	// Apply audio settings to player AND Web Audio API Engine
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
				if (playerRef.current) {
					playerRef.current.playVideo();
					setIsPlaying(true);
				}
			});
			navigator.mediaSession.setActionHandler('pause', () => {
				if (playerRef.current) {
					playerRef.current.pauseVideo();
					setIsPlaying(false);
				}
			});
			navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
			navigator.mediaSession.setActionHandler('nexttrack', playNext);
			
			navigator.mediaSession.setActionHandler('seekto', (details) => {
				if (playerRef.current && details.seekTime) {
					playerRef.current.seekTo(details.seekTime, true);
					setCurrentTime(details.seekTime);
				}
			});
		}
	}, [currentSong, playNext, playPrevious, setIsPlaying]);

	// Update playback state for Media Session
	useEffect(() => {
		if ('mediaSession' in navigator) {
			navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
		}
	}, [isPlaying]);

	// Unused but keeping for potential future use
	const _handleAudioSettingChange = (setting: string, value: any) => {
		updateAudioSettings({ [setting]: value });
		toast.success(`${setting.replace(/([A-Z])/g, ' $1').trim()} updated!`, {
			icon: '🎧',
			duration: 1500,
		});
	};

	const handlePlayPause = () => {
		if (!currentSong && queue.length > 0) {
			setCurrentSong(queue[0]);
			return;
		}
		if (playerRef.current) {
			isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
		}
	};

	const handleSeek = (value: number[]) => {
		if (playerRef.current?.seekTo) {
			playerRef.current.seekTo(value[0], true);
			setCurrentTime(value[0]);
		}
	};

	const handleVolumeChange = (value: number[]) => {
		setVolume(value[0]);
		setIsMuted(value[0] === 0);
		playerRef.current?.setVolume?.(value[0]);
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
				className={`md:hidden fixed bottom-[70px] left-2 right-2 bg-[#262626] rounded-md p-2 flex flex-col z-[45] shadow-xl border-b border-zinc-800 transition-transform duration-300 ${!currentSong ? 'translate-y-[200%]' : 'translate-y-0'}`}
				onClick={() => setShowMobilePlayer(true)}
			>
				<div className="flex items-center gap-3">
					<img 
						src={currentSong?.imageUrl || `https://i.ytimg.com/vi/${currentSong?.videoId}/mqdefault.jpg`} 
						alt="Album Art" 
						className="w-10 h-10 rounded bg-zinc-800 object-cover flex-shrink-0" 
						onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
					/>
					<div className="flex-1 min-w-0 flex flex-col justify-center mr-2">
						<div className="font-semibold text-xs text-white truncate leading-tight mb-0.5">
							{currentSong?.title || "Choose a song"}
						</div>
						<div className="text-[10px] text-zinc-400 truncate leading-tight">
							{currentSong?.artist} • MusicFlow
						</div>
					</div>
					
					{/* Mobile Controls */}
					<div className="flex items-center gap-3 mr-1">
						<button 
							onClick={(e) => { e.stopPropagation(); handlePlayPause(); }} 
							className="text-white focus:outline-none"
						>
							{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
						</button>
					</div>
				</div>
				{/* Thin Progress Bar */}
				<div className="absolute bottom-0 left-2 right-2 h-[2px] bg-zinc-600 rounded-full overflow-hidden">
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
