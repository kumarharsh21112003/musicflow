import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Share2, ListMusic, Volume2 } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Slider } from "@/components/ui/slider";
import { audioEngine } from "@/lib/audioEngine";
import { createPortal } from "react-dom";
import { useState, useMemo } from "react";

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
        volume, setVolume
    } = usePlayerStore();

    const [isLiked, setIsLiked] = useState(false);

    // Generate a complementary background color based on the song title
    const bgColor = useMemo(() => {
        if (!currentSong) return "#1e1e1e";
        const colors = [
            "#5038a0", "#1e3264", "#e8115b", "#bc5906", "#b49bc8", "#dc148c", "#148a08", "#8d67ab"
        ];
        const index = currentSong.title.length % colors.length;
        return colors[index];
    }, [currentSong?.videoId]);

    if (!isOpen || !currentSong) return null;

    const handleSeek = (value: number[]) => {
        const newTime = value[0];
        setCurrentTime(newTime);
        audioEngine.seek(newTime);
    };

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0]);
        audioEngine.setVolume(value[0]);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] bg-black flex flex-col text-white pb-safe overflow-hidden animate-in slide-in-from-bottom duration-500">
            {/* Adaptive Background - Large Gradient */}
            <div 
                className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
                style={{ 
                    background: `linear-gradient(to bottom, ${bgColor} 0%, #121212 80%)`,
                    opacity: 0.8
                }} 
            />
            
            {/* Header */}
            <div className="flex justify-between items-center px-8 pt-12 pb-6 relative z-10">
                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                >
                    <ChevronDown size={32} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-zinc-300 opacity-80 mb-0.5">Playing from Home</span>
                    <span className="text-xs font-bold truncate max-w-[180px]">{currentSong.artist}</span>
                </div>
                <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal size={28} />
                </button>
            </div>

            {/* Artwork Section */}
            <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
                <div className="w-full aspect-square relative shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden mb-12">
                    <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong.title} 
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Song Meta */}
                <div className="flex justify-between items-center gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black leading-tight tracking-tight truncate">{currentSong.title}</h2>
                        <p className="text-zinc-400 text-base font-bold truncate opacity-90">{currentSong.artist}</p>
                    </div>
                    <button 
                        onClick={() => setIsLiked(!isLiked)}
                        className={`transition-all duration-300 active:scale-125 ${isLiked ? 'text-emerald-500' : 'text-zinc-400'}`}
                    >
                        <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
                    </button>
                </div>
            </div>

            {/* Interaction Section (Progress + Main Controls) */}
            <div className="px-8 pb-4 relative z-10">
                {/* Progress Bar */}
                <div className="mb-8">
                    <Slider 
                        value={[currentTime]} 
                        max={duration || 100} 
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer" 
                    />
                    <div className="flex justify-between text-[11px] font-bold text-zinc-400 mt-2 tabular-nums">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between mb-8">
                    <button className="text-zinc-500 hover:text-white transition active:scale-90">
                        <Shuffle size={24} />
                    </button>
                    
                    <button 
                        onClick={playPrevious} 
                        className="text-white hover:scale-110 active:scale-95 transition"
                    >
                        <SkipBack size={36} fill="currentColor" />
                    </button>
                    
                    <button 
                        onClick={togglePlay} 
                        disabled={isPlaybackLoading}
                        className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition shadow-xl disabled:opacity-70"
                    >
                        {isPlaybackLoading ? (
                            <div className="size-8 border-[3px] border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={32} fill="currentColor" />
                        ) : (
                            <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                    </button>
                    
                    <button 
                        onClick={playNext} 
                        className="text-white hover:scale-110 active:scale-95 transition"
                    >
                        <SkipForward size={36} fill="currentColor" />
                    </button>

                    <button className="text-zinc-500 hover:text-white transition active:scale-90">
                        <Repeat size={24} />
                    </button>
                </div>

                {/* Volume Slider & Extras */}
                <div className="flex items-center justify-between pb-10">
                    <div className="flex items-center gap-3 flex-1 max-w-[140px]">
                        <Volume2 size={16} className="text-zinc-400" />
                        <Slider 
                            value={[volume]} 
                            max={100} 
                            step={1}
                            onValueChange={handleVolumeChange}
                            className="volume-slider"
                        />
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <button className="text-zinc-400 hover:text-white transition"><Share2 size={20} /></button>
                        <button className="text-zinc-400 hover:text-white transition"><ListMusic size={22} /></button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
