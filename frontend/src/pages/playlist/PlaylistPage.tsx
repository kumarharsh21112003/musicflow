import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Music, Play, Trash2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const PlaylistPage = () => {
	const { playlistId } = useParams();
	const navigate = useNavigate();
	const { playlists, removeFromPlaylist } = usePlaylistStore();
	const { setQueue, setCurrentSong, currentSong, isPlaying } = usePlayerStore();

	const playlist = playlists.find(p => p.id === playlistId);

	if (!playlist) {
		return (
			<div className='h-full bg-zinc-900 rounded-lg flex flex-col items-center justify-center'>
				<Music className='w-16 h-16 text-zinc-600 mb-4' />
				<p className='text-zinc-400'>Playlist not found</p>
				<Button variant='ghost' onClick={() => navigate('/')} className='mt-4'>
					<ArrowLeft className='w-4 h-4 mr-2' /> Go Home
				</Button>
			</div>
		);
	}

	const handlePlayAll = () => {
		if (playlist.songs.length > 0) {
			setQueue(playlist.songs);
			setCurrentSong(playlist.songs[0]);
			toast.success(`Playing ${playlist.name}`);
		}
	};

	const handlePlaySong = (index: number) => {
		setQueue(playlist.songs);
		setCurrentSong(playlist.songs[index]);
	};

	const handleRemove = (songId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeFromPlaylist(playlist.id, songId);
		toast.success("Removed from playlist");
	};

	const formatDuration = (seconds?: number) => {
		if (!seconds) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	// Generate gradient from first song thumbnail or use default
	const coverImage = playlist.songs[0]?.imageUrl || null;

	return (
		<div className='h-full bg-gradient-to-b from-emerald-900/50 via-zinc-900 to-zinc-900 rounded-lg overflow-hidden'>
			{/* Header */}
			<div className='p-6 pb-4'>
				<Button variant='ghost' size='sm' onClick={() => navigate('/')} className='mb-4 text-zinc-400 hover:text-white'>
					<ArrowLeft className='w-4 h-4 mr-2' /> Back
				</Button>
				<div className='flex items-end gap-6'>
					<div className='w-48 h-48 bg-zinc-800 rounded-lg flex items-center justify-center shadow-2xl overflow-hidden'>
						{coverImage ? (
							<img src={coverImage} alt={playlist.name} className='w-full h-full object-cover' />
						) : (
							<Music className='w-24 h-24 text-zinc-600' />
						)}
					</div>
					<div className='flex-1'>
						<p className='text-sm font-medium text-zinc-300'>Playlist</p>
						<h1 className='text-5xl font-bold mt-2 mb-4'>{playlist.name}</h1>
						<p className='text-zinc-400'>{playlist.songs.length} songs</p>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className='px-6 py-4 flex items-center gap-4'>
				<Button 
					onClick={handlePlayAll}
					className='bg-emerald-500 hover:bg-emerald-400 text-black rounded-full h-14 w-14 p-0'
					disabled={playlist.songs.length === 0}
				>
					<Play className='h-7 w-7 ml-1' />
				</Button>
				<span className='text-zinc-400 text-sm'>
					{playlist.songs.length === 0 ? "Add songs to this playlist" : "Click to play all"}
				</span>
			</div>

			{/* Songs List */}
			<div className='px-6 pb-20 overflow-y-auto max-h-[calc(100vh-400px)]'>
				{playlist.songs.length === 0 ? (
					<div className='flex flex-col items-center justify-center py-20'>
						<Music className='w-16 h-16 text-zinc-600 mb-4' />
						<p className='text-zinc-400 text-lg'>No songs in this playlist</p>
						<p className='text-zinc-600 text-sm'>Add songs from search or Now Playing</p>
					</div>
				) : (
					<>
						{/* Table Header */}
						<div className='grid grid-cols-[16px_4fr_1fr_auto] gap-4 px-4 py-2 text-zinc-400 text-sm border-b border-zinc-800'>
							<span>#</span>
							<span>Title</span>
							<span><Clock className='w-4 h-4' /></span>
							<span></span>
						</div>

						{/* Songs */}
						{playlist.songs.map((song, index) => {
							const isCurrentSong = currentSong?._id === song._id;
							return (
								<div 
									key={`${song._id}-${index}`}
									onClick={() => handlePlaySong(index)}
									className={`grid grid-cols-[16px_4fr_1fr_auto] gap-4 px-4 py-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer group ${isCurrentSong ? 'bg-zinc-800/50' : ''}`}
								>
									{/* Number/Play */}
									<div className='flex items-center justify-center'>
										<span className={`group-hover:hidden ${isCurrentSong ? 'text-emerald-400' : 'text-zinc-400'}`}>
											{isCurrentSong && isPlaying ? (
												<Music className='w-4 h-4 animate-pulse' />
											) : (
												index + 1
											)}
										</span>
										<Play className='w-4 h-4 hidden group-hover:block text-white' />
									</div>

									{/* Song Info */}
									<div className='flex items-center gap-3 min-w-0'>
										<img 
											src={song.imageUrl || `https://i.ytimg.com/vi/${song.videoId}/default.jpg`}
											alt={song.title}
											className='w-10 h-10 rounded object-cover'
										/>
										<div className='min-w-0'>
											<p className={`font-medium truncate ${isCurrentSong ? 'text-emerald-400' : 'text-white'}`}>
												{song.title}
											</p>
											<p className='text-sm text-zinc-400 truncate'>{song.artist}</p>
										</div>
									</div>

									{/* Duration */}
									<div className='flex items-center text-zinc-400 text-sm'>
										{formatDuration(song.duration)}
									</div>

									{/* Remove */}
									<div className='flex items-center'>
										<Button 
											variant='ghost' 
											size='icon'
											className='h-8 w-8 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100'
											onClick={(e) => handleRemove(song._id, e)}
										>
											<Trash2 className='w-4 h-4' />
										</Button>
									</div>
								</div>
							);
						})}
					</>
				)}
			</div>
		</div>
	);
};

export default PlaylistPage;
