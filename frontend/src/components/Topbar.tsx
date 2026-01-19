import { ChevronLeft, ChevronRight, MoreHorizontal, Search, Home, X, LogOut, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";

const Topbar = () => {
	const [showMenu, setShowMenu] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const [showProfile, setShowProfile] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const location = useLocation();
	const { searchSongs, searchResults, isLoading } = useMusicStore();
	const { setCurrentSong, setQueue } = usePlayerStore();
	const { user, logout } = useAuthStore();

	// Load recent searches from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('musicflow_recent_searches');
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
		if (searchQuery.trim().length > 1) {
			const timer = setTimeout(() => {
				searchSongs(searchQuery);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [searchQuery, searchSongs]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			// Save to recent searches
			const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
			setRecentSearches(updated);
			localStorage.setItem('musicflow_recent_searches', JSON.stringify(updated));
			
			searchSongs(searchQuery);
			navigate("/search");
			setShowDropdown(false);
		}
	};

	const handlePlaySong = (song: any) => {
		setQueue(searchResults);
		setCurrentSong(song);
		setShowDropdown(false);
	};

	const clearRecent = (term: string) => {
		const updated = recentSearches.filter(s => s !== term);
		setRecentSearches(updated);
		localStorage.setItem('musicflow_recent_searches', JSON.stringify(updated));
	};

	const menuItems = [
		{ label: "File" },
		{ label: "Edit" },
		{ label: "View" },
		{ label: "Playback" },
		{ label: "Help" },
	];

	return (
		<div className='flex items-center justify-between p-3 sticky top-0 bg-black/80 backdrop-blur-md z-10 gap-4'>
			{/* Left - Menu & Navigation */}
			<div className='flex gap-2 items-center'>
				<div className='relative'>
					<button 
						onClick={() => setShowMenu(!showMenu)}
						className='p-2 hover:bg-zinc-800 rounded-full transition-colors'
					>
						<MoreHorizontal className='size-5' />
					</button>
					
					{showMenu && (
						<>
							<div className='fixed inset-0 z-40' onClick={() => setShowMenu(false)} />
							<div className='absolute top-10 left-0 bg-zinc-800 rounded-lg shadow-xl z-50 py-2 min-w-[140px] border border-zinc-700'>
								{menuItems.map((item) => (
									<div key={item.label} className='px-4 py-2 hover:bg-zinc-700 cursor-pointer text-sm'>
										{item.label}
									</div>
								))}
							</div>
						</>
					)}
				</div>

				<button onClick={() => navigate(-1)} className='p-2 bg-black/60 rounded-full hover:bg-black/80'>
					<ChevronLeft className='size-5' />
				</button>
				<button onClick={() => navigate(1)} className='p-2 bg-black/60 rounded-full hover:bg-black/80'>
					<ChevronRight className='size-5' />
				</button>
			</div>

			{/* Center - Home & Search */}
			<div className='flex-1 flex items-center justify-center gap-2 max-w-xl'>
				<button 
					onClick={() => navigate("/")}
					className={`p-3 rounded-full transition-colors ${location.pathname === "/" ? "bg-white text-black" : "bg-zinc-800 hover:bg-zinc-700"}`}
				>
					<Home className='size-5' />
				</button>
				
				{/* Search with Dropdown */}
				<div ref={searchRef} className='flex-1 relative'>
					<form onSubmit={handleSearch}>
						<Search className='absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400' />
						<input
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setShowDropdown(true)}
							placeholder='What do you want to play?'
							className='w-full pl-12 pr-4 py-3 bg-zinc-800 rounded-full text-sm border-2 border-transparent focus:border-white/20 outline-none placeholder:text-zinc-400'
						/>
					</form>

					{/* Search Dropdown */}
					{showDropdown && (searchQuery || recentSearches.length > 0) && (
						<div className='absolute top-14 left-0 right-0 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 max-h-[400px] overflow-auto'>
							{/* Recent Searches */}
							{!searchQuery && recentSearches.length > 0 && (
								<>
									<div className='px-4 py-3 font-semibold text-sm'>Recent searches</div>
									{recentSearches.map((term, i) => (
										<div 
											key={i}
											className='flex items-center justify-between px-4 py-2 hover:bg-zinc-700 cursor-pointer'
											onClick={() => { setSearchQuery(term); searchSongs(term); }}
										>
											<div className='flex items-center gap-3'>
												<Search className='size-4 text-zinc-400' />
												<span className='text-sm'>{term}</span>
											</div>
											<button 
												onClick={(e) => { e.stopPropagation(); clearRecent(term); }}
												className='p-1 hover:bg-zinc-600 rounded'
											>
												<X className='size-4' />
											</button>
										</div>
									))}
								</>
							)}

							{/* Live Search Results */}
							{searchQuery && searchResults.length > 0 && (
								<>
									<div className='px-4 py-3 font-semibold text-sm border-t border-zinc-700'>Results</div>
									{searchResults.slice(0, 5).map((song) => (
										<div 
											key={song._id}
											className='flex items-center gap-3 px-4 py-2 hover:bg-zinc-700 cursor-pointer'
											onClick={() => handlePlaySong(song)}
										>
											<img 
												src={song.imageUrl} 
												alt={song.title}
												className='w-10 h-10 rounded object-cover'
											/>
											<div className='flex-1 min-w-0'>
												<p className='text-sm font-medium truncate'>{song.title}</p>
												<p className='text-xs text-zinc-400 truncate'>Song • {song.artist}</p>
											</div>
										</div>
									))}
									{searchResults.length > 5 && (
										<div 
											className='px-4 py-3 text-sm text-emerald-400 hover:bg-zinc-700 cursor-pointer text-center'
											onClick={() => { navigate("/search"); setShowDropdown(false); }}
										>
											See all results →
										</div>
									)}
								</>
							)}

							{searchQuery && isLoading && (
								<div className='px-4 py-4 text-center text-zinc-400 text-sm'>Searching...</div>
							)}
						</div>
					)}
				</div>
			</div>

				{/* Right - Profile */}
			<div className='flex gap-2 items-center relative'>
				<button 
					onClick={() => setShowProfile(!showProfile)}
					className='flex items-center gap-2 p-1 pr-3 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors'
				>
					<div className='size-8 bg-emerald-500 rounded-full flex items-center justify-center'>
						{user?.photoURL ? (
							<img src={user.photoURL} alt='' className='size-8 rounded-full' />
						) : (
							<User className='size-4 text-black' />
						)}
					</div>
					<span className='text-sm font-medium hidden sm:inline'>
						{user?.displayName || user?.email?.split('@')[0] || 'User'}
					</span>
				</button>

				{showProfile && (
					<>
						<div className='fixed inset-0 z-40' onClick={() => setShowProfile(false)} />
						<div className='absolute top-12 right-0 bg-zinc-800 rounded-lg shadow-xl z-50 py-2 min-w-[200px] border border-zinc-700'>
							<div className='px-4 py-3 border-b border-zinc-700'>
								<p className='font-medium'>{user?.displayName || 'User'}</p>
								<p className='text-xs text-zinc-400'>{user?.email}</p>
							</div>
							<button 
								onClick={logout}
								className='w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-700 text-left text-red-400'
							>
								<LogOut className='size-4' />
								Logout
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Topbar;
