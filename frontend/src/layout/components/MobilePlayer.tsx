import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Share2, ListMusic } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

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
        // Sync with YouTube player if needed
        if (window.YT) {
            // This is handled via the store/engine integration
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-gradient-to-b from-blue-900/80 to-black flex flex-col text-white pb-6 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-4 pt-12">
                <button onClick={onClose}><ChevronDown size={28} /></button>
                <span className="text-xs font-bold tracking-widest uppercase opacity-70">Now Playing</span>
                <button><MoreHorizontal size={24} /></button>
            </div>

            {/* Artwork */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full aspect-square relative shadow-2xl rounded-lg overflow-hidden">
                    <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong.title} 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Song Info */}
            <div className="px-8 mb-8">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h2 className="text-2xl font-bold leading-tight mb-1">{currentSong.title}</h2>
                        <p className="text-zinc-400 text-lg">{currentSong.artist}</p>
                    </div>
                    <button className="text-zinc-400"><Heart size={28} /></button>
                </div>
            </div>

            {/* Progress */}
            <div className="px-8 mb-8">
                <Slider 
                    value={[currentTime]} 
                    max={duration || 100} 
                    step={1}
                    onValueChange={handleSeek}
                    className="mb-2" 
                />
                <div className="flex justify-between text-xs text-zinc-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 mb-8 flex items-center justify-between">
                <button className="text-zinc-400 hover:text-white"><Shuffle size={24} /></button>
                <button onClick={playPrevious} className="text-white hover:scale-110 transition"><SkipBack size={32} fill="currentColor" /></button>
                
                <button 
                    onClick={togglePlay} 
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-xl"
                >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                
                <button onClick={playNext} className="text-white hover:scale-110 transition"><SkipForward size={32} fill="currentColor" /></button>
                <button className="text-zinc-400 hover:text-white"><Repeat size={24} /></button>
            </div>

            {/* Bottom Actions */}
            <div className="px-8 flex justify-between items-center text-zinc-400">
                 <button><Share2 size={20} /></button>
                 <div className="flex items-center gap-2">
                    <span className="text-xs">Lyrics</span>
                 </div>
                 <button><ListMusic size={22} /></button>
            </div>
        </div>
    );
};
