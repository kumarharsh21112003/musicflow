import { ChevronLeft, ChevronRight, Search, X, LogOut, User, Home, Library } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";

const Topbar = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);
	const [recentSearches, setRecentSearches] = useState<any[]>([]);
	const [showProfile, setShowProfile] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const location = useLocation();
	const { searchSongs, searchResults, isLoading } = useMusicStore();
	const { setCurrentSong, setQueue } = usePlayerStore();
	const { user, logout } = useAuthStore();

	// Load recent searches from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('musicflow_recent_searches_songs');
		if (saved) setRecentSearches(JSON.parse(saved));
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Search as user types
	useEffect(() => {
		if (searchQuery.trim().length > 0) {
			const timer = setTimeout(() => {
				searchSongs(searchQuery);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [searchQuery, searchSongs]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			searchSongs(searchQuery);
			navigate("/search");
			setShowDropdown(false);
		}
	};

	const handlePlaySong = async (song: any) => {
		console.log('Playing song:', song.title, song);
		
		// Save to recent searches (full song object)
		const updated = [song, ...recentSearches.filter(s => s._id !== song._id)].slice(0, 10);
		setRecentSearches(updated);
		localStorage.setItem('musicflow_recent_searches_songs', JSON.stringify(updated));

		// Close dropdown first
		setShowDropdown(false);
		
		// Set queue and play
		const queue = searchResults.length > 0 ? searchResults : [song];
		setQueue(queue);
		
		// Small delay to ensure state updates
		setTimeout(() => {
			setCurrentSong(song);
		}, 50);
	};

	const clearRecent = (id: string) => {
		const updated = recentSearches.filter(s => s._id !== id);
		setRecentSearches(updated);
		localStorage.setItem('musicflow_recent_searches_songs', JSON.stringify(updated));
	};

	return (
		<div className='flex items-center justify-between px-4 py-2 sticky top-0 bg-black z-50 gap-4 h-16'>
			{/* Left - Navigation & Home */}
			<div className='flex gap-2 items-center'>
				<div className="flex items-center gap-2 mr-2">
					<button 
						onClick={() => navigate("/")} 
						className={`p-3 rounded-full transition-all ${location.pathname === '/' ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-400 hover:text-white'}`}
					>
						<Home className='size-6' fill={location.pathname === '/' ? "currentColor" : "none"} />
					</button>
				</div>
				
				<div className="hidden md:flex items-center gap-2">
					<button onClick={() => navigate(-1)} className='p-1.5 bg-black rounded-full text-zinc-400 hover:text-white transition-colors'>
						<ChevronLeft className='size-6' />
					</button>
					<button onClick={() => navigate(1)} className='p-1.5 bg-black rounded-full text-zinc-400 hover:text-white transition-colors'>
						<ChevronRight className='size-6' />
					</button>
				</div>
			</div>

			{/* Center - Spotify Style Search Bar */}
			<div className='flex-1 flex items-center justify-center max-w-2xl'>
				<div ref={searchRef} className='flex-1 relative max-w-[500px]'>
					<form onSubmit={handleSearch} className="relative group">
						<div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
							<Search className='size-5 text-zinc-400 group-focus-within:text-white transition-colors' />
						</div>
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setShowDropdown(true)}
							placeholder='What do you want to play?'
							className='w-full pl-10 pr-12 py-3 bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded-full text-sm border-2 border-transparent focus:border-white/40 outline-none placeholder:text-zinc-400 text-white transition-all overflow-hidden truncate'
						/>
						<div className="absolute right-4 top-1/2 -translate-y-1/2 py-1 pl-3 border-l border-zinc-700 flex items-center">
							<Library className="size-5 text-zinc-400 hover:text-white cursor-pointer transition-colors" />
						</div>
					</form>

					{/* Spotify Style Search Dropdown */}
					{showDropdown && (searchQuery || recentSearches.length > 0) && createPortal(
						<div className="fixed inset-0" style={{ zIndex: 2147483647 }}>
							{/* Subtle backdrop */}
							<div 
								className='absolute inset-0 bg-black/40'
								onClick={() => setShowDropdown(false)}
							/>
							
							{/* Results Container */}
							<div 
								className='absolute left-1/2 -translate-x-1/2 w-[95%] max-w-[500px] bg-[#282828] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200'
								style={{ top: '64px' }}
							>
								{/* Section: Recent Searches */}
								{!searchQuery && recentSearches.length > 0 && (
									<div className="py-2">
										<div className='px-4 py-3 font-bold text-base text-white'>Recent searches</div>
										<div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
											{recentSearches.map((song) => (
												<div 
													key={song._id}
													className='flex items-center justify-between px-4 py-2 hover:bg-white/10 cursor-pointer group'
													onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }}
												>
													<div className='flex items-center gap-3 min-w-0'>
														<img 
															src={song.imageUrl} 
															className="w-10 h-10 rounded shadow-lg object-cover" 
															alt="" 
														/>
														<div className="truncate">
															<p className='font-medium text-white truncate'>{song.title}</p>
															<p className='text-xs text-zinc-400 truncate'>Song • {song.artist}</p>
														</div>
													</div>
													<button 
														onClick={(e) => { e.stopPropagation(); clearRecent(song._id); }}
														className='p-2 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all'
													>
														<X className='size-5' />
													</button>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Section: Live Search Results */}
								{searchQuery && (
									<div className="py-2">
										{isLoading ? (
											<div className='px-4 py-8 text-center text-zinc-400 text-sm'>
												<div className="size-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin mx-auto mb-2" />
												Searching...
											</div>
										) : searchResults.length > 0 ? (
											<>
												<div className='px-4 py-2 font-bold text-sm text-white opacity-60 uppercase tracking-wider'>Results</div>
												<div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
													{searchResults.slice(0, 8).map((song) => (
														<div 
															key={song._id}
															className='flex items-center gap-3 px-4 py-2 hover:bg-white/10 cursor-pointer transition-colors'
															onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }}
														>
															<img 
																src={song.imageUrl} 
																alt={song.title}
																className='w-12 h-12 rounded shadow-md object-cover'
															/>
															<div className='flex-1 min-w-0'>
																<p className='font-medium truncate text-white'>{song.title}</p>
																<p className='text-sm text-zinc-400 truncate'>Song • {song.artist}</p>
															</div>
														</div>
													))}
													<div 
														className='px-4 py-4 text-sm text-white font-bold hover:bg-white/10 cursor-pointer text-center border-t border-white/5 mt-2'
														onClick={() => { navigate("/search"); setShowDropdown(false); }}
													>
														See all results for "{searchQuery}"
													</div>
												</div>
											</>
										) : (
											<div className='px-4 py-12 text-center'>
												<Search className="size-10 text-zinc-600 mx-auto mb-3" />
												<p className="text-white font-bold">No results found for "{searchQuery}"</p>
												<p className="text-sm text-zinc-400">Please check your spelling or try another search.</p>
											</div>
										)}
									</div>
								)}
							</div>
						</div>,
						document.body
					)}
				</div>
			</div>

			{/* Right - Profile & Actions */}
			<div className='flex gap-4 items-center relative'>
				<button 
					onClick={() => setShowProfile(!showProfile)}
					className='flex items-center gap-2 p-1 bg-black hover:scale-105 transition-transform'
				>
					<div className='size-8 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700'>
						{user?.photoURL ? (
							<img src={user.photoURL} alt='' className='size-full object-cover' />
						) : (
							<User className='size-5 text-zinc-400' />
						)}
					</div>
				</button>

				{showProfile && (
					<>
						<div className='fixed inset-0 z-[2147483640]' onClick={() => setShowProfile(false)} />
						<div className='absolute top-12 right-0 bg-[#282828] rounded shadow-2xl z-[2147483641] py-1 min-w-[190px] border border-[#3e3e3e] animate-in fade-in slide-in-from-top-2 duration-150'>
							<div className='px-3 py-2 border-b border-[#3e3e3e] mb-1'>
								<p className='font-bold text-white text-sm truncate'>{user?.displayName || 'User'}</p>
								<p className='text-[11px] text-zinc-400 truncate'>{user?.email || 'Logged in'}</p>
							</div>
							<button 
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									logout();
									setShowProfile(false);
								}}
								className='w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/10 text-left text-white text-sm transition-colors'
							>
								<span>Logout</span>
								<LogOut className='size-4' />
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Topbar;
