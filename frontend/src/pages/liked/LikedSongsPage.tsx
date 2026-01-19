import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Heart, Play, Pause, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

const LikedSongsPage = () => {
	const { likedSongs, removeFromLikedSongs } = usePlaylistStore();
	const { setQueue, setCurrentSong, currentSong, isPlaying } = usePlayerStore();
	const navigate = useNavigate();

	const handlePlayAll = () => {
		if (likedSongs.length > 0) {
			setQueue(likedSongs);
			setCurrentSong(likedSongs[0]);
		}
	};

	const handlePlaySong = (index: number) => {
		setQueue(likedSongs);
		setCurrentSong(likedSongs[index]);
	};

	const handleRemove = (songId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeFromLikedSongs(songId);
	};

	const formatDuration = (seconds?: number) => {
		if (!seconds) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className='h-full bg-black md:bg-gradient-to-b md:from-purple-900/50 md:via-zinc-900 md:to-zinc-900 overflow-hidden'>
			<ScrollArea className='h-full'>
				{/* Mobile Header */}
				<div className='md:hidden p-6 pt-12 pb-4 bg-gradient-to-b from-purple-800/80 to-black'>
					<div className='flex flex-col items-center gap-6'>
						<div className='w-44 h-44 bg-gradient-to-br from-purple-700 via-purple-500 to-blue-400 rounded-lg flex items-center justify-center shadow-2xl'>
							<Heart className='w-20 h-20 text-white fill-white' />
						</div>
						<div className='text-center'>
							<h1 className='text-3xl font-black mt-2 mb-1'>Liked Songs</h1>
							<p className='text-zinc-400 font-bold'>Playlist • {likedSongs.length} songs</p>
						</div>
					</div>
				</div>

				{/* Desktop Header */}
				<div className='hidden md:block p-8 pb-6'>
					<div className='flex items-end gap-6'>
						<div className='w-56 h-56 bg-gradient-to-br from-purple-700 via-purple-500 to-blue-400 rounded-lg flex items-center justify-center shadow-2xl'>
							<Heart className='w-28 h-28 text-white fill-white' />
						</div>
						<div className='flex-1 pb-2'>
							<p className='text-sm font-bold text-zinc-300 uppercase tracking-widest'>Playlist</p>
							<h1 className='text-7xl font-black mt-2 mb-4 tracking-tighter'>Liked Songs</h1>
							<div className="flex items-center gap-2 text-zinc-300 font-bold">
								<span className="text-white">Your Name</span>
								<span className="opacity-60">•</span>
								<span>{likedSongs.length} songs</span>
							</div>
						</div>
					</div>
				</div>

				{/* Actions Row */}
				<div className='px-6 py-4 flex items-center justify-between'>
					<div className="flex gap-4">
						<Heart className="h-7 w-7 text-emerald-500 fill-emerald-500" />
						<div className="size-7 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white border border-white/5">
							<Clock className="w-4 h-4" />
						</div>
					</div>
					<Button 
						onClick={handlePlayAll}
						className='bg-emerald-500 hover:bg-emerald-400 text-black rounded-full h-14 w-14 p-0 shadow-xl hover:scale-105 active:scale-95 transition-all'
						disabled={likedSongs.length === 0}
					>
						{isPlaying && likedSongs.some(s => s._id === currentSong?._id) ? <Pause className='h-7 w-7 fill-black' /> : <Play className='h-7 w-7 ml-1 fill-black' />}
					</Button>
				</div>

				{/* Songs List */}
				<div className='px-4 md:px-8 pb-40'>
					{likedSongs.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-24 text-center'>
							<div className="size-24 bg-zinc-800/40 rounded-full flex items-center justify-center mb-6">
								<Heart className='w-12 h-12 text-zinc-600' />
							</div>
							<p className='text-white text-xl font-black mb-2'>Songs you like will appear here</p>
							<p className='text-zinc-500 max-w-xs'>Save songs by tapping the heart icon so you can find them again easily.</p>
							<Button 
								onClick={() => navigate('/')}
								className="mt-8 rounded-full bg-white text-black font-bold h-12 px-8 hover:bg-zinc-200"
							>
								Find songs
							</Button>
						</div>
					) : (
						<div className="space-y-1">
							{likedSongs.map((song, index) => {
								const isCurrentSong = currentSong?._id === song._id;
								return (
									<div 
										key={song._id}
										onClick={() => handlePlaySong(index)}
										className={`flex items-center gap-4 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer group transition-colors ${isCurrentSong ? 'bg-white/10' : ''}`}
									>
										<div className="w-4 text-center text-sm font-medium text-zinc-500 group-hover:hidden">
											{index + 1}
										</div>
										<Play className="hidden group-hover:block size-4 text-white fill-white" />
										
										<div className='flex flex-1 items-center gap-3 min-w-0'>
											<img 
												src={song.imageUrl || `https://i.ytimg.com/vi/${song.videoId}/default.jpg`}
												alt={song.title}
												className='w-12 h-12 rounded shadow-lg object-cover'
											/>
											<div className='min-w-0'>
												<p className={`font-bold text-sm truncate ${isCurrentSong ? 'text-emerald-400' : 'text-white'}`}>
													{song.title}
												</p>
												<p className='text-xs text-zinc-400 font-medium truncate'>{song.artist}</p>
											</div>
										</div>

										<div className="flex items-center gap-4">
											<Heart className="size-5 text-emerald-500 fill-emerald-500" />
											<span className='text-xs text-zinc-500 font-medium md:block hidden min-w-[40px] text-right tabular-nums'>
												{formatDuration(song.duration)}
											</span>
											<button 
												onClick={(e) => handleRemove(song._id, e)}
												className="p-2 text-zinc-500 hover:text-white md:opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export default LikedSongsPage;
