import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useState } from "react";
import { Play, Pause, Search } from "lucide-react";

const FILTERS = ["All", "Songs", "Albums", "Playlists", "Artists", "Podcasts & Shows", "Profiles"];

const SearchPage = () => {
	const [activeFilter, setActiveFilter] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");
	const { searchResults, isLoading, searchSongs } = useMusicStore();
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

	// Debounced Search for Mobile
	const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setSearchQuery(val);
		if (val.trim()) {
			searchSongs(val);
		}
	};

	const topResult = searchResults[0];

	return (
		<main className='h-full overflow-hidden bg-black md:bg-gradient-to-b md:from-zinc-800 md:to-zinc-900'>
			<ScrollArea className='h-full md:h-[calc(100vh-180px)]'>
				<div className='p-4 md:p-6 pb-40'>
					{/* Mobile Search Header */}
					<div className="md:hidden mb-6">
						<h1 className="text-3xl font-black tracking-tight mb-4">Search</h1>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-900" />
							<input 
								type="text" 
								value={searchQuery}
								onChange={handleSearchInput}
								placeholder="What do you want to play?"
								className="w-full bg-white text-black py-3 pl-10 pr-4 rounded-lg font-bold text-sm focus:outline-none placeholder:text-zinc-600"
							/>
						</div>
					</div>

					{/* Filter Pills */}
					{searchResults.length > 0 && (
						<div className='flex gap-2 mb-6 overflow-x-auto no-scrollbar -mx-1 px-1'>
							{FILTERS.map(filter => (
								<button
									key={filter}
									onClick={() => setActiveFilter(filter)}
									className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
										${activeFilter === filter 
											? 'bg-emerald-500 text-black' 
											: 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
								>
									{filter}
								</button>
							))}
						</div>
					)}

					{/* Results */}
					{searchResults.length > 0 ? (
						<div className="animate-in fade-in duration-500">
							{/* Top Result + Songs Grid */}
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10'>
								{/* Top Result */}
								<div>
									<h2 className='text-xl font-black mb-4'>Top result</h2>
									{topResult && (
										<div 
											onClick={() => handlePlay(topResult)}
											className='bg-zinc-900/60 rounded-lg p-5 hover:bg-zinc-800/60 transition-all cursor-pointer group relative border border-white/5'
										>
											<img
												src={topResult.imageUrl}
												alt={topResult.title}
												className='w-32 h-32 rounded shadow-2xl mb-4 object-cover'
											/>
											<h3 className='text-2xl font-black mb-1 truncate'>{topResult.title}</h3>
											<p className='text-zinc-400'>
												<span className='text-sm bg-zinc-800 px-2 py-0.5 rounded-full mr-2'>Song</span>
												<span className='text-white font-bold'>{topResult.artist}</span>
											</p>
											
											<div className={`absolute bottom-5 right-5 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl
												transition-all active:scale-95
												${currentSong?._id === topResult._id ? 'opacity-100' : 'opacity-100 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0'}`}>
												{currentSong?._id === topResult._id && isPlaying 
													? <Pause className='h-6 w-6 text-black fill-black' />
													: <Play className='h-6 w-6 text-black fill-black ml-1' />}
											</div>
										</div>
									)}
								</div>

								{/* Songs List */}
								<div>
									<h2 className='text-xl font-black mb-4'>Songs</h2>
									<div className='space-y-2'>
										{searchResults.slice(0, 5).map((song) => {
											const isCurrentSong = currentSong?._id === song._id;
											const showPause = isCurrentSong && isPlaying;
											
											return (
												<div
													key={song._id}
													onClick={() => handlePlay(song)}
													className={`flex items-center gap-3 p-2 rounded-md hover:bg-zinc-900/60 cursor-pointer group transition-colors
														${isCurrentSong ? 'bg-zinc-900/60' : ''}`}
												>
													<div className='relative w-12 h-12 flex-shrink-0'>
														<img
															src={song.imageUrl}
															alt={song.title}
															className='w-full h-full rounded object-cover shadow-lg'
														/>
														<div className={`absolute inset-0 bg-black/40 flex items-center justify-center rounded
															${isCurrentSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
															{showPause 
																? <Pause className='h-4 w-4 text-white fill-white' />
																: <Play className='h-4 w-4 text-white fill-white ml-0.5' />}
														</div>
													</div>
													<div className='flex-1 min-w-0'>
														<p className={`font-bold truncate text-sm mb-0.5 ${isCurrentSong ? 'text-emerald-400' : 'text-white'}`}>
															{song.title}
														</p>
														<p className='text-xs text-zinc-400 truncate font-medium'>{song.artist}</p>
													</div>
													<span className='text-xs text-zinc-500 font-medium tabular-nums px-2'>
														{formatDuration(song.duration || 210)}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							</div>

							{/* All Songs Grid */}
							{searchResults.length > 5 && (
								<div className="pb-10">
									<h2 className='text-xl font-black mb-6'>All Results</h2>
									<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
										{searchResults.slice(5).map((song) => {
											const isCurrentSong = currentSong?._id === song._id;
											
											return (
												<div
													key={song._id}
													onClick={() => handlePlay(song)}
													className='bg-zinc-900/40 p-4 rounded-md hover:bg-zinc-800/40 transition-all cursor-pointer group border border-white/5'
												>
													<div className='relative mb-4'>
														<img
															src={song.imageUrl}
															alt={song.title}
															className='w-full aspect-square rounded shadow-xl object-cover'
														/>
														<button
															className={`absolute bottom-2 right-2 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 shadow-2xl rounded-full flex items-center justify-center
																${isCurrentSong ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'} transition-all hover:scale-105 active:scale-90`}
														>
															{isCurrentSong && isPlaying 
																? <Pause className='h-5 w-5 text-black fill-black' />
																: <Play className='h-5 w-5 text-black fill-black ml-0.5' />}
														</button>
													</div>
													<h4 className={`font-bold truncate text-sm mb-1 ${isCurrentSong ? 'text-emerald-400' : ''}`}>
														{song.title}
													</h4>
													<p className='text-xs text-zinc-400 font-medium truncate opacity-80'>{song.artist}</p>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>
					) : (
						<div className='flex flex-col items-center justify-center h-[50vh] text-center px-8'>
							<Search className='h-24 w-24 text-zinc-800 mb-6' />
							<h3 className='text-2xl font-black mb-3 tracking-tight'>Search for music</h3>
							<p className='text-zinc-500 font-medium max-w-xs'>Find your favorite songs, artists, and playlists. Just start typing.</p>
						</div>
					)}

					{isLoading && (
						<div className='flex items-center justify-center py-20'>
							<div className='animate-spin w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full'></div>
						</div>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};

export default SearchPage;
