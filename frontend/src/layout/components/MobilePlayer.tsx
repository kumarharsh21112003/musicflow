import { ChevronDown, Play, Pause, SkipBack, SkipForward, Heart, Share2, ListMusic, MoreHorizontal, AirplayIcon, Shuffle, Repeat } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Slider } from "@/components/ui/slider";
import { audioEngine } from "@/lib/audioEngine";
import { createPortal } from "react-dom";
import { useState, useMemo, useEffect } from "react";

interface MobilePlayerProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const MobilePlayer = ({ isOpen, onClose }: MobilePlayerProps) => {
    const { 
        currentSong, isPlaying, togglePlay, playNext, playPrevious, 
        currentTime, duration, setCurrentTime, isPlaybackLoading,
        volume, setVolume, isShuffled, toggleShuffle, repeatMode, toggleRepeat
    } = usePlayerStore();

    const [isLiked, setIsLiked] = useState(false);

    // Generate adaptive gradient colors based on song
    const gradientColors = useMemo(() => {
        if (!currentSong) return { primary: "#1a1a1a", secondary: "#000" };
        const colors = [
            { primary: "#8B5CF6", secondary: "#1a1a2e" }, // Purple
            { primary: "#EC4899", secondary: "#1a1a2e" }, // Pink
            { primary: "#F59E0B", secondary: "#1a1a1a" }, // Orange
            { primary: "#10B981", secondary: "#0a1a1a" }, // Green
            { primary: "#3B82F6", secondary: "#0a1020" }, // Blue
            { primary: "#EF4444", secondary: "#1a0a0a" }, // Red
            { primary: "#6366F1", secondary: "#0f0f20" }, // Indigo
            { primary: "#14B8A6", secondary: "#0a1a18" }, // Teal
        ];
        const index = (currentSong.title.length + currentSong.artist.length) % colors.length;
        return colors[index];
    }, [currentSong?.videoId]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !currentSong) return null;

    const handleSeek = (value: number[]) => {
        const newTime = value[0];
        setCurrentTime(newTime);
        audioEngine.seek(newTime);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return createPortal(
        <div 
            className="fixed inset-0 z-[100000] flex flex-col text-white overflow-hidden"
            style={{ 
                background: `linear-gradient(180deg, ${gradientColors.primary}40 0%, ${gradientColors.secondary} 40%, #000 100%)`,
            }}
        >
            {/* Blur overlay */}
            <div 
                className="absolute inset-0 backdrop-blur-3xl"
                style={{ background: 'rgba(0,0,0,0.3)' }}
            />

            {/* Header - Apple Music Style */}
            <header className="relative z-10 flex items-center justify-between px-6 pt-14 pb-4">
                <button 
                    onClick={onClose}
                    className="p-2 -ml-2 active:scale-90 transition-transform"
                    aria-label="Close"
                >
                    <ChevronDown size={28} strokeWidth={2.5} />
                </button>
                
                <div className="flex flex-col items-center flex-1 mx-4">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-white/60">
                        PLAYING FROM
                    </span>
                    <span className="text-sm font-semibold truncate max-w-[200px]">
                        {currentSong.artist}
                    </span>
                </div>
                
                <button className="p-2 -mr-2 active:scale-90 transition-transform">
                    <MoreHorizontal size={24} />
                </button>
            </header>

            {/* Artwork - Large & Centered */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-4">
                <div 
                    className="w-full max-w-[340px] aspect-square rounded-lg overflow-hidden shadow-2xl"
                    style={{ boxShadow: `0 30px 60px -12px ${gradientColors.primary}60` }}
                >
                    <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                </div>
            </div>

            {/* Song Info & Controls */}
            <div className="relative z-10 px-8 pb-10">
                {/* Title & Like */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0 pr-4">
                        <h1 className="text-[22px] font-bold leading-tight truncate">
                            {currentSong.title}
                        </h1>
                        <p className="text-base text-white/60 font-medium truncate mt-0.5">
                            {currentSong.artist}
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsLiked(!isLiked)}
                        className="p-2 -mr-2 active:scale-90 transition-all"
                    >
                        <Heart 
                            size={24} 
                            className={isLiked ? "text-red-500" : "text-white/60"}
                            fill={isLiked ? "currentColor" : "none"}
                        />
                    </button>
                </div>

                {/* Progress Bar - Apple Style */}
                <div className="mb-4">
                    <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => handleSeek([parseFloat(e.target.value)])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[11px] text-white/50 font-medium tabular-nums">
                            {formatTime(currentTime)}
                        </span>
                        <span className="text-[11px] text-white/50 font-medium tabular-nums">
                            -{formatTime(Math.max(0, duration - currentTime))}
                        </span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={toggleShuffle}
                        className={`p-3 active:scale-90 transition-all ${isShuffled ? 'text-emerald-400' : 'text-white/50'}`}
                    >
                        <Shuffle size={22} />
                    </button>
                    
                    <button 
                        onClick={playPrevious}
                        className="p-3 active:scale-90 transition-transform"
                    >
                        <SkipBack size={32} fill="white" />
                    </button>
                    
                    <button 
                        onClick={togglePlay}
                        disabled={isPlaybackLoading}
                        className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-xl disabled:opacity-50"
                    >
                        {isPlaybackLoading ? (
                            <div className="w-8 h-8 border-3 border-zinc-300 border-t-emerald-500 rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={34} fill="black" stroke="black" />
                        ) : (
                            <Play size={34} fill="black" stroke="black" className="ml-1" />
                        )}
                    </button>
                    
                    <button 
                        onClick={playNext}
                        className="p-3 active:scale-90 transition-transform"
                    >
                        <SkipForward size={32} fill="white" />
                    </button>

                    <button 
                        onClick={toggleRepeat}
                        className={`p-3 active:scale-90 transition-all relative ${repeatMode !== 'off' ? 'text-emerald-400' : 'text-white/50'}`}
                    >
                        <Repeat size={22} />
                        {repeatMode === 'one' && (
                            <span className="absolute top-1 right-1 text-[8px] font-bold">1</span>
                        )}
                    </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-3 mb-6">
                    <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                    </svg>
                    <Slider 
                        value={[volume]} 
                        max={100} 
                        step={1}
                        onValueChange={(v) => {
                            setVolume(v[0]);
                            audioEngine.setVolume(v[0]);
                        }}
                        className="flex-1"
                    />
                    <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between">
                    <button className="p-3 text-white/50 active:scale-90 transition-transform">
                        <Share2 size={22} />
                    </button>
                    <button className="p-3 text-white/50 active:scale-90 transition-transform">
                        <AirplayIcon size={22} />
                    </button>
                    <button className="p-3 text-white/50 active:scale-90 transition-transform">
                        <ListMusic size={22} />
                    </button>
                </div>
            </div>

            {/* Home Indicator (iOS) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
        </div>,
        document.body
    );
};
