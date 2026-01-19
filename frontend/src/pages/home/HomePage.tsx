import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect, useState } from "react";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

// Artist names for selection
const ARTISTS = [
	"Arijit Singh", "Diljit Dosanjh", "AP Dhillon", "Karan Aujla", "Badshah", "Honey Singh",
	"Shreya Ghoshal", "Neha Kakkar", "Atif Aslam", "Jubin Nautiyal", "B Praak", "Darshan Raval",
	"Ed Sheeran", "The Weeknd", "Drake", "Taylor Swift", "Billie Eilish", "Ariana Grande",
	"Justin Bieber", "BTS", "Coldplay", "Eminem", "Rihanna", "Bruno Mars", "Imagine Dragons",
	"Alan Walker", "Marshmello", "Dua Lipa", "Post Malone", "Selena Gomez"
];

const FILTERS = ["All", "Music", "Podcasts"];

const getArtistImg = (name: string) => 
	`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=1DB954&color=fff&bold=true&font-size=0.4`;

const HomePage = () => {
	const {
		fetchTrending,
		fetchArtistsSongs,
		isLoading,
		featuredSongs,
		trendingSongs,
		madeForYouSongs,
		recommendedSongs,
	} = useMusicStore();

	const { setQueue, getTopArtists, listeningHistory } = usePlayerStore();
	const { userData, saveUserData, user } = useAuthStore();
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
	const [loadingArtists, setLoadingArtists] = useState(false);
	const [activeFilter, setActiveFilter] = useState("All");
	const [checkingData, setCheckingData] = useState(true);

	useEffect(() => {
		// Wait a bit for Firebase to sync userData
		const timeout = setTimeout(() => {
			setCheckingData(false);
		}, 2000);

		// First check Firebase userData, then localStorage
		const firebaseArtists = userData?.selectedArtists;
		const localArtists = localStorage.getItem('musicflow_artists');
		
		if (firebaseArtists && firebaseArtists.length > 0) {
			// Load from Firebase (returning user)
			setSelectedArtists(firebaseArtists);
			fetchArtistsSongs(firebaseArtists);
			localStorage.setItem('musicflow_artists', JSON.stringify(firebaseArtists));
			setShowOnboarding(false);
			setCheckingData(false);
			clearTimeout(timeout);
		} else if (localArtists) {
			// Load from localStorage
			const artists = JSON.parse(localArtists);
			setSelectedArtists(artists);
			fetchArtistsSongs(artists);
			setShowOnboarding(false);
			setCheckingData(false);
			clearTimeout(timeout);
		}
		
		fetchTrending();
		
		return () => clearTimeout(timeout);
	}, [fetchTrending, fetchArtistsSongs, userData, user]);

	// Load personalized recommendations based on listening history
	useEffect(() => {
		const topArtists = getTopArtists();
		if (topArtists.length > 0 && listeningHistory.length >= 5) {
			// Fetch songs from most played artists
			fetchArtistsSongs(topArtists);
		}
	}, [listeningHistory.length, getTopArtists, fetchArtistsSongs]);

	// Show onboarding only after checking is done and no data found
	useEffect(() => {
		if (!checkingData && selectedArtists.length === 0) {
			const localArtists = localStorage.getItem('musicflow_artists');
			if (!localArtists) {
				setShowOnboarding(true);
			}
		}
	}, [checkingData, selectedArtists]);

	useEffect(() => {
		const allSongs = [...featuredSongs, ...trendingSongs, ...recommendedSongs];
		if (allSongs.length > 0) setQueue(allSongs);
	}, [featuredSongs, trendingSongs, recommendedSongs, setQueue]);

	const toggleArtist = (name: string) => {
		setSelectedArtists(prev => 
			prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
		);
	};

	const finishOnboarding = async () => {
		if (selectedArtists.length >= 3) {
			setLoadingArtists(true);
			localStorage.setItem('musicflow_artists', JSON.stringify(selectedArtists));
			// Save to Firebase for sync across devices
			await saveUserData({ selectedArtists });
			await fetchArtistsSongs(selectedArtists);
			setLoadingArtists(false);
			setShowOnboarding(false);
		}
	};

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 17) return "Good afternoon";
		return "Good evening";
	};

	// Full-screen Onboarding
	if (showOnboarding) {
		return (
			<div className='fixed inset-0 bg-zinc-900 z-[100] flex flex-col'>
				<div className='p-6 text-center border-b border-zinc-800'>
					<h1 className='text-2xl font-bold'>Choose 3 or more artists you like</h1>
					<p className='text-zinc-400 text-sm mt-1'>We'll fetch their songs from YouTube!</p>
				</div>

				<div className='flex-1 overflow-auto p-6'>
					<div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-6xl mx-auto'>
						{ARTISTS.map(artist => {
							const isSelected = selectedArtists.includes(artist);
							return (
								<div
									key={artist}
									onClick={() => toggleArtist(artist)}
									className='flex flex-col items-center cursor-pointer group'
								>
									<div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-2 transition-all
										${isSelected ? 'ring-4 ring-emerald-500 scale-110' : 'ring-2 ring-transparent group-hover:ring-zinc-500'}`}>
										<img src={getArtistImg(artist)} alt={artist} className='w-full h-full' />
										{isSelected && (
											<div className='absolute inset-0 bg-emerald-500/60 flex items-center justify-center'>
												<Check className='h-8 w-8 text-white' strokeWidth={3} />
											</div>
										)}
									</div>
									<span className={`text-xs font-medium text-center truncate w-full
										${isSelected ? 'text-emerald-400' : 'text-white'}`}>
										{artist}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				<div className='p-6 border-t border-zinc-800 bg-zinc-900'>
					<div className='max-w-md mx-auto'>
						<Button 
							onClick={finishOnboarding}
							disabled={selectedArtists.length < 3 || loadingArtists}
							className='w-full py-6 text-lg rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold disabled:opacity-40'
						>
							{loadingArtists ? (
								<><Loader2 className='mr-2 h-5 w-5 animate-spin' /> Loading songs...</>
							) : selectedArtists.length < 3 
								? `Select ${3 - selectedArtists.length} more` 
								: `Done (${selectedArtists.length} selected)`}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<main className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900'>
			<ScrollArea className='h-full'>
				<div className='p-4 sm:p-6'>
					{/* Filter Pills */}
					<div className='flex gap-2 mb-6'>
						{FILTERS.map(filter => (
							<button
								key={filter}
								onClick={() => setActiveFilter(filter)}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-all
									${activeFilter === filter 
										? 'bg-white text-black' 
										: 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
							>
								{filter}
							</button>
						))}
					</div>

					<h1 className='text-2xl sm:text-3xl font-bold mb-6'>{getGreeting()}</h1>
					
					<FeaturedSection />

					<div className='space-y-8'>
						{recommendedSongs.length > 0 && (
							<SectionGrid title='Based on Your Artists 💜' songs={recommendedSongs.slice(0, 10)} isLoading={isLoading} />
						)}
						{madeForYouSongs.length > 0 && (
							<SectionGrid title='Made For You' songs={madeForYouSongs} isLoading={isLoading} />
						)}
						{trendingSongs.length > 0 && (
							<SectionGrid title='Trending Now 🔥' songs={trendingSongs} isLoading={isLoading} />
						)}
					</div>
				</div>
			</ScrollArea>
		</main>
	);
};

export default HomePage;
