import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Share2, ListMusic } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Slider } from "@/components/ui/slider";
import { audioEngine } from "@/lib/audioEngine";
import { createPortal } from "react-dom";

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

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#121212] flex flex-col text-white pb-safe overflow-hidden animate-in slide-in-from-bottom duration-500 fill-mode-forwards">
            {/* Dynamic Background Gradient - Spotify Style */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1e3a8a]/40 via-[#121212] to-[#121212] -z-10" />
            
            {/* Backdrop Glow */}
            <div className="absolute top-[-10%] left-[-10%] right-[-10%] h-[60%] bg-[#1ed760]/5 blur-[120px] -z-10 pointer-events-none opacity-30" />

            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-14 pb-4">
                <button 
                    onClick={onClose}
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                >
                    <ChevronDown size={32} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-0.5">Playing Song</span>
                    <span className="text-xs font-bold truncate max-w-[200px]">{currentSong.title}</span>
                </div>
                <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal size={28} />
                </button>
            </div>

            {/* Artwork Container */}
            <div className="flex-1 flex items-center justify-center px-10 py-6">
                <div className="w-full aspect-square relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden border border-white/5">
                    <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong.title} 
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                </div>
            </div>

            {/* Song Meta Data */}
            <div className="px-10 mt-2 mb-8">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[26px] font-black leading-tight mb-1.5 tracking-tight truncate">{currentSong.title}</h2>
                        <p className="text-zinc-400 text-lg font-semibold truncate hover:text-white transition-colors cursor-pointer">{currentSong.artist}</p>
                    </div>
                    <button className="text-emerald-500 hover:scale-110 transition active:scale-90">
                        <Heart size={34} fill="currentColor" />
                    </button>
                </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="px-10 mb-8">
                <Slider 
                    value={[currentTime]} 
                    max={duration || 100} 
                    step={1}
                    onValueChange={handleSeek}
                    className="mb-3" 
                />
                <div className="flex justify-between text-[11px] font-bold text-zinc-500 tabular-nums tracking-wider">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="px-10 mb-12 flex items-center justify-between">
                <button className="text-zinc-500 hover:text-emerald-400 transition active:scale-90">
                    <Shuffle size={24} />
                </button>
                
                <div className="flex items-center gap-8">
                    <button 
                        onClick={playPrevious} 
                        className="text-white hover:scale-110 active:scale-90 transition"
                    >
                        <SkipBack size={38} fill="currentColor" />
                    </button>
                    
                    <button 
                        onClick={togglePlay} 
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition shadow-2xl"
                    >
                        {isPlaying ? (
                            <Pause size={36} fill="currentColor" />
                        ) : (
                            <Play size={36} fill="currentColor" className="ml-1" />
                        )}
                    </button>
                    
                    <button 
                        onClick={playNext} 
                        className="text-white hover:scale-110 active:scale-90 transition"
                    >
                        <SkipForward size={38} fill="currentColor" />
                    </button>
                </div>

                <button className="text-zinc-500 hover:text-emerald-400 transition active:scale-90">
                    <Repeat size={24} />
                </button>
            </div>

            {/* Secondary Actions */}
            <div className="px-10 flex justify-between items-center pb-12">
                 <button className="text-zinc-400 hover:text-white transition"><Share2 size={22} /></button>
                 <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 rounded-full border border-white/5 active:scale-95 transition">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-300">Ultra HQ</span>
                 </div>
                 <button className="text-zinc-400 hover:text-white transition"><ListMusic size={24} /></button>
            </div>
        </div>,
        document.body
    );
};
