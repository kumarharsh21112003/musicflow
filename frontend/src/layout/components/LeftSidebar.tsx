import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, Heart, Plus, Music, ListPlus, Trash2, Pencil, Pin, Share2, Play, Radio, Folder, Headphones, Users } from "lucide-react";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const LeftSidebar = () => {
	const { playlists, likedSongs, createPlaylist, deletePlaylist } = usePlaylistStore();
	const { setQueue, setCurrentSong } = usePlayerStore();
	const navigate = useNavigate();
	const [showPlusMenu, setShowPlusMenu] = useState(false);
	const [showCreateInput, setShowCreateInput] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; playlistId: string; type: 'playlist' | 'liked' } | null>(null);

	const handleCreatePlaylist = () => {
		if (newPlaylistName.trim()) {
			createPlaylist(newPlaylistName.trim());
			toast.success(`Created "${newPlaylistName}"`);
			setNewPlaylistName("");
			setShowCreateInput(false);
			setShowPlusMenu(false);
		} else {
			setShowCreateInput(true);
		}
	};

	const handleRightClick = (e: React.MouseEvent, playlistId: string, type: 'playlist' | 'liked') => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY, playlistId, type });
	};

	const handleDeletePlaylist = () => {
		if (!contextMenu || contextMenu.type === 'liked') {
			toast.error("Cannot delete Liked Songs");
			setContextMenu(null);
			return;
		}
		deletePlaylist(contextMenu.playlistId);
		toast.success("Playlist deleted");
		setContextMenu(null);
	};

	const handlePlayLikedSongs = () => {
		if (likedSongs.length > 0) {
			setQueue(likedSongs);
			setCurrentSong(likedSongs[0]);
			toast.success("Playing Liked Songs");
		}
	};

	const handlePlayPlaylist = (playlistId: string) => {
		const playlist = playlists.find(p => p.id === playlistId);
		if (playlist && playlist.songs.length > 0) {
			setQueue(playlist.songs);
			setCurrentSong(playlist.songs[0]);
			toast.success(`Playing ${playlist.name}`);
		} else {
			toast.error("Playlist is empty!");
		}
	};

	const plusMenuItems = [
		{ icon: ListPlus, label: "Playlist", desc: "Create a playlist with songs" },
		{ icon: Users, label: "Blend", desc: "Combine your friends' tastes" },
		{ icon: Folder, label: "Folder", desc: "Organize your playlists" },
		{ icon: Headphones, label: "Jam", desc: "Listen together from anywhere" },
	];

	return (
		<div className='h-full flex flex-col'>
			{/* Library section */}
			<div className='flex-1 rounded-lg bg-zinc-900 p-4'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center text-white px-2'>
						<Library className='size-5 mr-2' />
						<span className='hidden md:inline'>Your Library</span>
					</div>
					<div className='relative'>
						<Button
							variant='ghost'
							size='icon'
							className='h-8 w-8 text-zinc-400 hover:text-white'
							onClick={() => setShowPlusMenu(!showPlusMenu)}
						>
							<Plus className='size-5' />
						</Button>

						{/* Plus Menu Dropdown */}
						{showPlusMenu && (
							<>
								<div className='fixed inset-0 z-50 bg-black/60' onClick={() => { setShowPlusMenu(false); setShowCreateInput(false); }} />
								<div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-800 rounded-lg shadow-xl z-50 py-3 w-[240px] border border-zinc-700'>
									{/* Create Playlist Input */}
									{showCreateInput ? (
										<div className='px-4 py-3'>
											<p className='text-sm font-medium mb-2'>Create playlist</p>
											<input
												type='text'
												value={newPlaylistName}
												onChange={(e) => setNewPlaylistName(e.target.value)}
												placeholder='Playlist name...'
												className='w-full px-3 py-2 bg-zinc-700 rounded-lg text-sm border-none outline-none focus:ring-2 ring-emerald-500'
												autoFocus
												onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
											/>
											<div className='flex gap-2 mt-3'>
												<Button 
													size='sm' 
													onClick={handleCreatePlaylist}
													disabled={!newPlaylistName.trim()}
													className='flex-1 bg-emerald-500 hover:bg-emerald-400 text-black'
												>
													Create
												</Button>
												<Button size='sm' variant='ghost' onClick={() => { setShowCreateInput(false); setNewPlaylistName(""); }}>
													Cancel
												</Button>
											</div>
										</div>
									) : (
										<>
											{plusMenuItems.map((item, index) => (
												<div 
													key={index}
													className='flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 cursor-pointer'
													onClick={item.label === "Playlist" ? () => setShowCreateInput(true) : () => { toast.success(`${item.label} coming soon!`); setShowPlusMenu(false); }}
												>
													<div className='w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center'>
														<item.icon className='h-5 w-5 text-zinc-300' />
													</div>
													<div>
														<p className='font-medium'>{item.label}</p>
														<p className='text-xs text-zinc-400'>{item.desc}</p>
													</div>
												</div>
											))}
										</>
									)}
								</div>
							</>
						)}
					</div>
				</div>

				{/* Filter Tabs */}
				<div className='flex gap-2 mb-4' style={{ overflow: 'hidden' }}>
					<button className='px-3 py-1.5 bg-zinc-800 rounded-full text-sm whitespace-nowrap hover:bg-zinc-700'>Playlists</button>
					<button className='px-3 py-1.5 bg-zinc-800 rounded-full text-sm whitespace-nowrap hover:bg-zinc-700'>Podcasts</button>
					<button className='px-3 py-1.5 bg-zinc-800 rounded-full text-sm whitespace-nowrap hover:bg-zinc-700'>Albums</button>
				</div>

				<ScrollArea className='h-[calc(100vh-350px)]'>
					<div className='space-y-2'>
						{/* Liked Songs - Only show if there are liked songs */}
						{likedSongs.length > 0 && (
							<div 
								className='p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer'
								onClick={() => navigate('/liked')}
								onContextMenu={(e) => handleRightClick(e, 'liked', 'liked')}
							>
								<div className='size-12 rounded-md flex-shrink-0 bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center'>
									<Heart className='size-6 text-white' />
								</div>
								<div className='flex-1 min-w-0 hidden md:block'>
									<p className='font-medium truncate'>Liked Songs</p>
									<p className='text-sm text-zinc-400 truncate'>
										<span className='text-emerald-400'>📌</span> Playlist • {likedSongs.length} songs
									</p>
								</div>
								<div className='opacity-0 group-hover:opacity-100 transition-opacity'>
									<Play className='size-4 text-white' />
								</div>
							</div>
						)}

						{/* User Created Playlists */}
						{playlists.map((playlist) => (
							<div 
								key={playlist.id} 
								className='p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer'
								onClick={() => navigate(`/playlist/${playlist.id}`)}
								onContextMenu={(e) => handleRightClick(e, playlist.id, 'playlist')}
							>
								<div className='size-12 rounded-md flex-shrink-0 bg-zinc-800 flex items-center justify-center overflow-hidden'>
									{playlist.songs[0] ? (
										<img
											src={playlist.songs[0].imageUrl}
											alt={playlist.name}
											className='size-12 object-cover'
										/>
									) : (
										<Music className='size-6 text-zinc-500' />
									)}
								</div>
								<div className='flex-1 min-w-0 hidden md:block'>
									<p className='font-medium truncate'>{playlist.name}</p>
									<p className='text-sm text-zinc-400 truncate'>Playlist • {playlist.songs.length} songs</p>
								</div>
								<div className='opacity-0 group-hover:opacity-100 transition-opacity'>
									<Play className='size-4 text-white' />
								</div>
							</div>
						))}

						{/* Empty state */}
						{playlists.length === 0 && likedSongs.length === 0 && (
							<div className='text-center py-8 text-zinc-500'>
								<Music className='size-12 mx-auto mb-3 opacity-50' />
								<p className='text-sm'>No playlists yet</p>
								<p className='text-xs mt-1'>Click + to create one</p>
							</div>
						)}
					</div>
				</ScrollArea>
			</div>

			{/* Right Click Context Menu */}
			{contextMenu && (
				<>
					<div className='fixed inset-0 z-50' onClick={() => setContextMenu(null)} />
					<div 
						className='fixed bg-zinc-800 rounded-lg shadow-xl z-50 py-2 min-w-[200px] border border-zinc-700'
						style={{ 
							left: Math.min(contextMenu.x, window.innerWidth - 220),
							top: Math.min(contextMenu.y, window.innerHeight - 250)
						}}
					>
						<div className='flex items-center gap-3 px-4 py-2 hover:bg-zinc-700 cursor-pointer' onClick={() => { toast.success("Added to queue"); setContextMenu(null); }}>
							<Play className='h-4 w-4' />
							<span className='text-sm'>Add to queue</span>
						</div>
						<div className='flex items-center gap-3 px-4 py-2 hover:bg-zinc-700 cursor-pointer' onClick={() => { toast.success("Starting Jam..."); setContextMenu(null); }}>
							<Radio className='h-4 w-4' />
							<span className='text-sm'>Start a Jam</span>
						</div>
						
						<div className='h-px bg-zinc-700 my-1' />
						
						<div className='flex items-center gap-3 px-4 py-2 hover:bg-zinc-700 cursor-pointer' onClick={() => { toast.success("Edit coming soon"); setContextMenu(null); }}>
							<Pencil className='h-4 w-4' />
							<span className='text-sm'>Edit details</span>
						</div>
						
						{contextMenu.type === 'playlist' && (
							<div 
								className='flex items-center gap-3 px-4 py-2 hover:bg-zinc-700 cursor-pointer text-red-400'
								onClick={handleDeletePlaylist}
							>
								<Trash2 className='h-4 w-4' />
								<span className='text-sm'>Delete</span>
							</div>
						)}
						
						<div className='h-px bg-zinc-700 my-1' />
						
						<div className='flex items-center gap-3 px-4 py-2 hover:bg-zinc-700 cursor-pointer' onClick={() => { toast.success("Pinned!"); setContextMenu(null); }}>
							<Pin className='h-4 w-4' />
							<span className='text-sm'>Pin playlist</span>
						</div>
						<div className='flex items-center gap-3 px-4 py-2 hover:bg-zinc-700 cursor-pointer' onClick={() => { toast.success("Link copied!"); setContextMenu(null); }}>
							<Share2 className='h-4 w-4' />
							<span className='text-sm'>Share</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
};
export default LeftSidebar;
