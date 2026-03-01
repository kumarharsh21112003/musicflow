import { ChevronLeft, ChevronRight, Search, X, LogOut, User, Home, Library } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

	useEffect(() => {
		const saved = localStorage.getItem('musicflow_recent_searches_songs');
		if (saved) setRecentSearches(JSON.parse(saved));
	}, []);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (searchQuery.trim().length > 0) {
			const timer = setTimeout(() => { searchSongs(searchQuery); }, 300);
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
		const updated = [song, ...recentSearches.filter(s => s._id !== song._id)].slice(0, 10);
		setRecentSearches(updated);
		localStorage.setItem('musicflow_recent_searches_songs', JSON.stringify(updated));
		setShowDropdown(false);
		const queue = searchResults.length > 0 ? searchResults : [song];
		setQueue(queue);
		setTimeout(() => { setCurrentSong(song); }, 50);
	};

	const clearRecent = (id: string) => {
		const updated = recentSearches.filter(s => s._id !== id);
		setRecentSearches(updated);
		localStorage.setItem('musicflow_recent_searches_songs', JSON.stringify(updated));
	};

	return (
		<div className='flex items-center justify-between px-4 py-2 sticky top-0 bg-black z-50 gap-4 h-16'>
			{/* Left - Navigation */}
			<div className='flex gap-2 items-center'>
				<div className="flex items-center gap-2 mr-2">
					<button
						onClick={() => navigate("/")}
						className={`p-3 rounded-full transition-all ${location.pathname === '/' ? 'bg-neutral-900 text-white' : 'bg-transparent text-neutral-400 hover:text-white'}`}
					>
						<Home className='size-6' fill={location.pathname === '/' ? "currentColor" : "none"} />
					</button>
				</div>

				<div className="hidden md:flex items-center gap-2">
					<button onClick={() => navigate(-1)} className='p-1.5 bg-black rounded-full text-neutral-400 hover:text-white transition-colors'>
						<ChevronLeft className='size-6' />
					</button>
					<button onClick={() => navigate(1)} className='p-1.5 bg-black rounded-full text-neutral-400 hover:text-white transition-colors'>
						<ChevronRight className='size-6' />
					</button>
				</div>
			</div>

			{/* Center - Search Bar */}
			<div className='flex-1 flex items-center justify-center max-w-2xl'>
				<div ref={searchRef} className='flex-1 relative max-w-[500px]'>
					<form onSubmit={handleSearch} className="relative group">
						<div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
							<Search className='size-5 text-neutral-400 group-focus-within:text-white transition-colors' />
						</div>
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setShowDropdown(true)}
							placeholder='What do you want to play?'
							className='w-full pl-10 pr-12 py-3 bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded-full text-sm border-2 border-transparent focus:border-white/40 outline-none placeholder:text-neutral-400 text-white transition-all overflow-hidden truncate'
						/>
						<div className="absolute right-4 top-1/2 -translate-y-1/2 py-1 pl-3 border-l border-neutral-700 flex items-center">
							<Library className="size-5 text-neutral-400 hover:text-white cursor-pointer transition-colors" />
						</div>
					</form>

					{/* Dropdown - directly below search, perfectly aligned */}
					{showDropdown && (searchQuery || recentSearches.length > 0) && (
						<div
							className='absolute top-full left-0 right-0 mt-2 overflow-hidden'
							style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.9)', zIndex: 9999 }}
						>
							{/* Recent Searches */}
							{!searchQuery && recentSearches.length > 0 && (
								<div className="py-2">
									<div className='px-4 py-3 font-bold text-base text-white'>Recent searches</div>
									<div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
										{recentSearches.map((song) => (
											<div key={song._id} className='flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.08] cursor-pointer group transition-colors' onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }}>
												<div className='flex items-center gap-3 min-w-0'>
													<img src={song.imageUrl} className="w-11 h-11 rounded-lg object-cover" alt="" />
													<div className="truncate">
														<p className='font-semibold text-white truncate text-sm'>{song.title}</p>
														<p className='text-xs text-neutral-500 truncate'>Song • {song.artist}</p>
													</div>
												</div>
												<button onClick={(e) => { e.stopPropagation(); clearRecent(song._id); }} className='p-2 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-white/10'>
													<X className='size-4' />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Search Results */}
							{searchQuery && (
								<div className="py-2">
									{isLoading ? (
										<div className='px-5 py-8 text-center text-neutral-400 text-sm'>
											<div className="size-5 border-2 border-neutral-600 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
											Searching...
										</div>
									) : searchResults.length > 0 ? (
										<>
											<div className='px-4 py-2 font-bold text-xs text-neutral-400 uppercase tracking-wider'>Results</div>
											<div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
												{searchResults.slice(0, 8).map((song) => (
													<div key={song._id} className='flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.08] cursor-pointer transition-colors' onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }}>
														<img src={song.imageUrl} alt={song.title} className='w-11 h-11 rounded-lg object-cover' />
														<div className='flex-1 min-w-0'>
															<p className='font-semibold truncate text-white text-sm'>{song.title}</p>
															<p className='text-xs text-neutral-500 truncate'>Song • {song.artist}</p>
														</div>
													</div>
												))}
												<div className='px-4 py-3.5 text-sm text-orange-400 font-bold hover:bg-white/[0.08] cursor-pointer text-center border-t border-white/5 mt-1 transition-colors' onClick={() => { navigate("/search"); setShowDropdown(false); }}>
													See all results for "{searchQuery}"
												</div>
											</div>
										</>
									) : (
										<div className='px-5 py-10 text-center'>
											<Search className="size-10 text-neutral-700 mx-auto mb-3" />
											<p className="text-white font-bold text-sm">No results for "{searchQuery}"</p>
											<p className="text-xs text-neutral-500 mt-1">Check spelling or try another search</p>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Right - Profile */}
			<div className='flex gap-4 items-center relative'>
				<button
					onClick={() => setShowProfile(!showProfile)}
					className='flex items-center gap-2 p-1 bg-black hover:scale-105 transition-transform'
				>
					<div className='size-8 bg-neutral-900 rounded-full flex items-center justify-center overflow-hidden border border-neutral-700'>
						{user?.photoURL ? (
							<img src={user.photoURL} alt='' className='size-full object-cover' />
						) : (
							<User className='size-5 text-neutral-400' />
						)}
					</div>
				</button>

				{showProfile && (
					<>
						<div className='fixed inset-0 z-[2147483640]' onClick={() => setShowProfile(false)} />
						<div className='absolute top-12 right-0 bg-[#1a1a1a] rounded-xl shadow-2xl z-[2147483641] py-1 min-w-[190px] border border-neutral-700/50'>
							<div className='px-3 py-2 border-b border-neutral-700/50 mb-1'>
								<p className='font-bold text-white text-sm truncate'>{user?.displayName || 'User'}</p>
								<p className='text-[11px] text-neutral-400 truncate'>{user?.email || 'Logged in'}</p>
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
