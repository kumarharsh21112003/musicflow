import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useState } from "react";
import { Play, Pause, Search } from "lucide-react";

const FILTERS = ["All", "Songs", "Albums", "Playlists", "Artists", "Podcasts & Shows", "Profiles"];

const SearchPage = () => {
	const [activeFilter, setActiveFilter] = useState("All");
	const { searchResults, isLoading } = useMusicStore();
	const { currentSong, isPlaying, setCurrentSong, setQueue, togglePlay } = usePlayerStore();

	const handlePlay = (song: any) => {
		const isCurrentSong = currentSong?._id === song._id;
		if (isCurrentSong) {
			togglePlay();
		} else {
			setQueue(searchResults);
			setCurrentSong(song);
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const topResult = searchResults[0];

	return (
		<main className='h-full rounded-lg overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900'>
			<ScrollArea className='h-[calc(100vh-180px)]'>
				<div className='p-4'>
					{/* Filter Pills */}
					{searchResults.length > 0 && (
						<div className='flex gap-2 mb-6 overflow-x-auto pb-2'>
							{FILTERS.map(filter => (
								<button
									key={filter}
									onClick={() => setActiveFilter(filter)}
									className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
										${activeFilter === filter 
											? 'bg-white text-black' 
											: 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
								>
									{filter}
								</button>
							))}
						</div>
					)}

					{/* Results */}
					{searchResults.length > 0 ? (
						<>
							{/* Top Result + Songs Grid */}
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
								{/* Top Result */}
								<div>
									<h2 className='text-2xl font-bold mb-4'>Top result</h2>
									{topResult && (
										<div 
											onClick={() => handlePlay(topResult)}
											className='bg-zinc-800/60 rounded-lg p-5 hover:bg-zinc-700/60 transition-all cursor-pointer group relative h-[220px]'
										>
											<img
												src={topResult.imageUrl}
												alt={topResult.title}
												className='w-24 h-24 rounded-lg shadow-xl mb-4 object-cover'
											/>
											<h3 className='text-2xl font-bold mb-1 truncate'>{topResult.title}</h3>
											<p className='text-zinc-400'>
												<span className='text-sm'>Song</span>
												<span className='mx-2'>•</span>
												<span className='text-white'>{topResult.artist}</span>
											</p>
											
											<div className={`absolute bottom-5 right-5 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl
												transition-all group-hover:opacity-100 group-hover:translate-y-0
												${currentSong?._id === topResult._id ? 'opacity-100' : 'opacity-0 translate-y-2'}`}>
												{currentSong?._id === topResult._id && isPlaying 
													? <Pause className='h-5 w-5 text-black' />
													: <Play className='h-5 w-5 text-black ml-0.5' />}
											</div>
										</div>
									)}
								</div>

								{/* Songs List */}
								<div>
									<h2 className='text-2xl font-bold mb-4'>Songs</h2>
									<div className='space-y-1'>
										{searchResults.slice(0, 4).map((song) => {
											const isCurrentSong = currentSong?._id === song._id;
											const showPause = isCurrentSong && isPlaying;
											
											return (
												<div
													key={song._id}
													onClick={() => handlePlay(song)}
													className={`flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/60 cursor-pointer group
														${isCurrentSong ? 'bg-zinc-800/60' : ''}`}
												>
													<div className='relative w-12 h-12 flex-shrink-0'>
														<img
															src={song.imageUrl}
															alt={song.title}
															className='w-full h-full rounded object-cover'
														/>
														<div className={`absolute inset-0 bg-black/60 flex items-center justify-center rounded
															${isCurrentSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
															{showPause 
																? <Pause className='h-4 w-4 text-white' />
																: <Play className='h-4 w-4 text-white' />}
														</div>
													</div>
													<div className='flex-1 min-w-0'>
														<p className={`font-medium truncate text-sm ${isCurrentSong ? 'text-emerald-400' : 'text-white'}`}>
															{song.title}
														</p>
														<p className='text-xs text-zinc-400 truncate'>{song.artist}</p>
													</div>
													<span className='text-sm text-zinc-400'>
														{formatDuration(song.duration || 240)}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							</div>

							{/* All Songs Grid */}
							{searchResults.length > 4 && (
								<div>
									<h2 className='text-2xl font-bold mb-4'>All Results</h2>
									<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
										{searchResults.slice(4).map((song) => {
											const isCurrentSong = currentSong?._id === song._id;
											
											return (
												<div
													key={song._id}
													onClick={() => handlePlay(song)}
													className='bg-zinc-800/40 p-4 rounded-lg hover:bg-zinc-700/40 transition-all cursor-pointer group'
												>
													<div className='relative mb-3'>
														<img
															src={song.imageUrl}
															alt={song.title}
															className='w-full aspect-square rounded-md object-cover'
														/>
														<button
															className={`absolute bottom-2 right-2 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 shadow-xl rounded-full flex items-center justify-center
																${isCurrentSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all hover:scale-105`}
														>
															{isCurrentSong && isPlaying 
																? <Pause className='h-5 w-5 text-black' />
																: <Play className='h-5 w-5 text-black ml-0.5' />}
														</button>
													</div>
													<h4 className={`font-semibold truncate text-sm ${isCurrentSong ? 'text-emerald-400' : ''}`}>
														{song.title}
													</h4>
													<p className='text-xs text-zinc-400 truncate'>{song.artist}</p>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</>
					) : (
						<div className='flex flex-col items-center justify-center h-[50vh] text-center'>
							<Search className='h-20 w-20 text-zinc-700 mb-4' />
							<h3 className='text-2xl font-bold mb-2'>Search for music</h3>
							<p className='text-zinc-400'>Type in the search bar above to find songs</p>
						</div>
					)}

					{isLoading && (
						<div className='flex items-center justify-center py-12'>
							<div className='animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full'></div>
						</div>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};

export default SearchPage;
