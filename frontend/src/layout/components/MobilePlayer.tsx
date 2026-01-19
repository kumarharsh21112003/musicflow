import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Share2, ListMusic } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Slider } from "@/components/ui/slider";
import { audioEngine } from "@/lib/audioEngine";

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
    const { currentSong, isPlaying, togglePlay, playNext, playPrevious, currentTime, duration, setCurrentTime } = usePlayerStore();

    if (!isOpen || !currentSong) return null;

    const handleSeek = (value: number[]) => {
        const newTime = value[0];
        setCurrentTime(newTime);
        audioEngine.seek(newTime);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col text-white pb-safe overflow-hidden animate-in slide-in-from-bottom duration-500">
            {/* Dynamic Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 via-zinc-950 to-zinc-950 -z-10" />
            
            {/* Backdrop Blur Effect */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent blur-3xl -z-10 pointer-events-none opacity-20" />

            {/* Header */}
            <div className="flex justify-between items-center px-4 pt-14 pb-2">
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ChevronDown size={32} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-0.5">Playing from collection</span>
                    <span className="text-xs font-bold truncate max-w-[200px]">{currentSong.artist}</span>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal size={28} />
                </button>
            </div>

            {/* Artwork */}
            <div className="flex-1 flex items-center justify-center px-8 py-4">
                <div className="w-full aspect-square relative group">
                    <div className="absolute inset-0 bg-black/20 blur-xl scale-95 translate-y-4 rounded-xl -z-10" />
                    <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong.title} 
                        className="w-full h-full object-cover rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
                    />
                </div>
            </div>

            {/* Song Info */}
            <div className="px-8 mt-4 mb-6">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black leading-tight mb-1 truncate">{currentSong.title}</h2>
                        <p className="text-zinc-400 text-lg font-medium truncate">{currentSong.artist}</p>
                    </div>
                    <button className="text-emerald-500 hover:scale-110 transition active:scale-95">
                        <Heart size={32} fill="currentColor" />
                    </button>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="px-8 mb-8">
                <Slider 
                    value={[currentTime]} 
                    max={duration || 100} 
                    step={1}
                    onValueChange={handleSeek}
                    className="mb-3" 
                />
                <div className="flex justify-between text-[11px] font-bold text-zinc-500 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Main Controls */}
            <div className="px-8 mb-10 flex items-center justify-between gap-2">
                <button className="text-zinc-500 hover:text-emerald-400 transition active:scale-90 p-2">
                    <Shuffle size={26} />
                </button>
                
                <div className="flex items-center gap-6">
                    <button 
                        onClick={playPrevious} 
                        className="text-white hover:scale-110 transition active:scale-90"
                    >
                        <SkipBack size={42} fill="currentColor" />
                    </button>
                    
                    <button 
                        onClick={togglePlay} 
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition active:scale-95 shadow-2xl"
                    >
                        {isPlaying ? (
                            <Pause size={38} fill="currentColor" />
                        ) : (
                            <Play size={38} fill="currentColor" className="ml-1" />
                        )}
                    </button>
                    
                    <button 
                        onClick={playNext} 
                        className="text-white hover:scale-110 transition active:scale-90"
                    >
                        <SkipForward size={42} fill="currentColor" />
                    </button>
                </div>

                <button className="text-zinc-500 hover:text-emerald-400 transition active:scale-90 p-2">
                    <Repeat size={26} />
                </button>
            </div>

            {/* Bottom Utility Bar */}
            <div className="px-10 flex justify-between items-center pb-8">
                 <button className="text-zinc-400 hover:text-white transition"><Share2 size={24} /></button>
                 <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-300">HQ Audio</span>
                 </div>
                 <button className="text-zinc-400 hover:text-white transition"><ListMusic size={24} /></button>
            </div>
        </div>
    );
};
