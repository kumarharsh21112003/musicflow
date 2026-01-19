import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { Play, Pause, Plus, MoreHorizontal, Heart, ListPlus, Radio, User, Share2, ChevronRight, Check, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import toast from "react-hot-toast";

interface RightSidebarProps {
	onShowLyrics?: () => void;
}

const RightSidebar = ({ onShowLyrics }: RightSidebarProps) => {
	const { currentSong, isPlaying, togglePlay, queue } = usePlayerStore();
	const { playlists, likedSongs, addToPlaylist, addToLikedSongs, removeFromLikedSongs, createPlaylist } = usePlaylistStore();
	const [showMenu, setShowMenu] = useState(false);
	const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");
	const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

	const isLiked = currentSong ? likedSongs.some(s => s._id === currentSong._id) : false;

	const handleLike = () => {
		if (!currentSong) return;
		if (isLiked) {
			removeFromLikedSongs(currentSong._id);
			toast.success("Removed from Liked Songs");
		} else {
			addToLikedSongs(currentSong);
			toast.success("Added to Liked Songs");
		}
	};

	const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
		if (!currentSong) return;
		addToPlaylist(playlistId, currentSong);
		toast.success(`Added to ${playlistName}`);
		setShowMenu(false);
		setShowPlaylistMenu(false);
	};

	const handleCreatePlaylist = () => {
		if (newPlaylistName.trim()) {
			const id = createPlaylist(newPlaylistName.trim());
			if (currentSong) {
				addToPlaylist(id, currentSong);
				toast.success(`Created "${newPlaylistName}" and added song`);
			} else {
				toast.success(`Created "${newPlaylistName}"`);
			}
			setNewPlaylistName("");
			setShowCreatePlaylist(false);
			setShowMenu(false);
		}
	};

	if (!currentSong) {
		return (
			<div className='h-full bg-zinc-900 rounded-lg flex flex-col items-center justify-center p-6'>
				<div className='w-32 h-32 bg-zinc-800 rounded-lg flex items-center justify-center mb-4'>
					<svg className='w-16 h-16 text-zinc-600' fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
					</svg>
				</div>
				<p className='text-zinc-400 text-center'>Select a song to see details</p>
			</div>
		);
	}

	return (
		<div className='h-full bg-zinc-900 rounded-lg flex flex-col overflow-hidden'>
			{/* Header */}
			<div className='p-4 flex items-center justify-between border-b border-zinc-800'>
				<span className='text-sm font-medium truncate flex-1'>{currentSong.title}</span>
				<div className='flex items-center gap-1'>
					{/* Lyrics Button */}
					<Button 
						variant='ghost' 
						size='icon' 
						className='h-8 w-8 text-zinc-400 hover:text-emerald-400'
						onClick={onShowLyrics}
						title='Show lyrics'
					>
						<Mic2 className='h-4 w-4' />
					</Button>
					
					{/* More Button */}
					<Button 
						variant='ghost' 
						size='icon' 
						className='h-8 w-8'
						onClick={() => setShowMenu(!showMenu)}
					>
						<MoreHorizontal className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Dropdown Menu */}
			{showMenu && (
				<>
					<div className='fixed inset-0 z-50 bg-black/60' onClick={() => { setShowMenu(false); setShowPlaylistMenu(false); setShowCreatePlaylist(false); }} />
					<div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-800 rounded-lg shadow-xl z-50 py-2 w-[260px] border border-zinc-700'>
						<div 
							className='flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-700 cursor-pointer'
							onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
						>
							<ListPlus className='h-4 w-4 text-zinc-400' />
							<span className='text-sm'>Add to playlist</span>
							<ChevronRight className='h-4 w-4 text-zinc-400 ml-auto' />
						</div>
						
						{showPlaylistMenu && (
							<div className='bg-zinc-700/50 mx-2 rounded-lg py-1 mt-1'>
								{showCreatePlaylist ? (
									<div className='px-3 py-2'>
										<input
											type='text'
											value={newPlaylistName}
											onChange={(e) => setNewPlaylistName(e.target.value)}
											placeholder='Playlist name'
											className='w-full px-3 py-2 bg-zinc-700 rounded text-sm border-none outline-none'
											autoFocus
										/>
										<div className='flex gap-2 mt-2'>
											<Button size='sm' className='flex-1 bg-emerald-500 hover:bg-emerald-400 text-black' onClick={handleCreatePlaylist}>
												<Check className='h-3 w-3 mr-1' /> Create
											</Button>
										</div>
									</div>
								) : (
									<div className='flex items-center gap-3 px-3 py-2 hover:bg-zinc-600 cursor-pointer rounded mx-1' onClick={() => setShowCreatePlaylist(true)}>
										<Plus className='h-4 w-4 text-zinc-400' />
										<span className='text-sm'>Create new playlist</span>
									</div>
								)}
								
								{playlists.map((playlist) => (
									<div
										key={playlist.id}
										className='flex items-center gap-3 px-3 py-2 hover:bg-zinc-600 cursor-pointer rounded mx-1'
										onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
									>
										<span className='text-sm'>{playlist.name}</span>
									</div>
								))}
							</div>
						)}
						
						<div className='h-px bg-zinc-700 my-1' />
						
						<div className='flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-700 cursor-pointer' onClick={() => setShowMenu(false)}>
							<Radio className='h-4 w-4 text-zinc-400' />
							<span className='text-sm'>Go to song radio</span>
						</div>
						<div className='flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-700 cursor-pointer' onClick={() => setShowMenu(false)}>
							<User className='h-4 w-4 text-zinc-400' />
							<span className='text-sm'>Go to artist</span>
						</div>
						<div className='h-px bg-zinc-700 my-1' />
						<div className='flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-700 cursor-pointer' onClick={() => setShowMenu(false)}>
							<Share2 className='h-4 w-4 text-zinc-400' />
							<span className='text-sm'>Share</span>
						</div>
					</div>
				</>
			)}

			{/* Album Art */}
			<div className='p-4'>
				<div className='aspect-square rounded-lg overflow-hidden shadow-2xl'>
					<img
						src={currentSong.imageUrl || `https://i.ytimg.com/vi/${currentSong.videoId}/maxresdefault.jpg`}
						alt={currentSong.title}
						className='w-full h-full object-cover'
						onError={(e) => {
							(e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg`;
						}}
					/>
				</div>
			</div>

			{/* Song Info */}
			<div className='px-4 pb-4'>
				<div className='flex items-center justify-between'>
					<div className='min-w-0 flex-1'>
						<h3 className='text-xl font-bold truncate'>{currentSong.title}</h3>
						<p className='text-zinc-400 truncate'>{currentSong.artist}</p>
					</div>
					<Button 
						variant='ghost' 
						size='icon' 
						className={`h-8 w-8 ${isLiked ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
						onClick={handleLike}
					>
						<Heart className={`h-5 w-5 ${isLiked ? 'fill-emerald-400' : ''}`} />
					</Button>
				</div>
			</div>

			{/* Play Button */}
			<div className='px-4 pb-4'>
				<Button 
					onClick={togglePlay}
					className='w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full'
				>
					{isPlaying ? <Pause className='h-6 w-6 mr-2' /> : <Play className='h-6 w-6 mr-2' />}
					{isPlaying ? 'Pause' : 'Play'}
				</Button>
			</div>

			{/* Up Next */}
			<div className='flex-1 overflow-hidden'>
				<div className='px-4 pb-2'>
					<h4 className='text-sm font-semibold text-zinc-400'>Up Next</h4>
				</div>
				<div className='overflow-y-auto max-h-40 px-4 space-y-2'>
					{queue.slice(0, 5).map((song, idx) => (
						<div key={`${song._id}-${idx}`} className='flex items-center gap-3 p-2 rounded hover:bg-zinc-800/50'>
							<img
								src={song.imageUrl || `https://i.ytimg.com/vi/${song.videoId}/default.jpg`}
								alt={song.title}
								className='w-10 h-10 rounded object-cover'
							/>
							<div className='min-w-0 flex-1'>
								<p className='text-sm font-medium truncate'>{song.title}</p>
								<p className='text-xs text-zinc-400 truncate'>{song.artist}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default RightSidebar;
