import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect, useState } from "react";
import FeaturedSection from "./components/FeaturedSection";
import ForYouSection from "./components/ForYouSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Bell, Clock as History, Settings } from "lucide-react";

// Artist names for selection
const ARTISTS = [
	"Arijit Singh", "Diljit Dosanjh", "AP Dhillon", "Karan Aujla", "Badshah", "Honey Singh",
	"Shreya Ghoshal", "Neha Kakkar", "Atif Aslam", "Jubin Nautiyal", "B Praak", "Darshan Raval",
	"Ed Sheeran", "The Weeknd", "Drake", "Taylor Swift", "Billie Eilish", "Ariana Grande",
	"Justin Bieber", "BTS", "Coldplay", "Eminem", "Rihanna", "Bruno Mars", "Imagine Dragons",
	"Alan Walker", "Marshmello", "Dua Lipa", "Post Malone", "Selena Gomez"
];

const FILTERS = ["All", "Music", "Podcasts"];

// Artist images mapping - using reliable CDN images
const ARTIST_IMAGES: Record<string, string> = {
	"Arijit Singh": "https://i.scdn.co/image/ab6761610000e5eb0261696c5df3be99da6ed3f3",
	"Diljit Dosanjh": "https://i.scdn.co/image/ab6761610000e5eb2e0c128eb75b4e5a2e5a16a3",
	"AP Dhillon": "https://i.scdn.co/image/ab6761610000e5eb6f5c3f4e4e4e4e4e4e4e4e4e",
	"Karan Aujla": "https://i.scdn.co/image/ab6761610000e5eb4f4f4f4f4f4f4f4f4f4f4f4f",
	"Badshah": "https://i.scdn.co/image/ab6761610000e5eb8b8b8b8b8b8b8b8b8b8b8b8b",
	"Honey Singh": "https://i.scdn.co/image/ab67616100005174a5a5a5a5a5a5a5a5a5a5a5a5",
	"Shreya Ghoshal": "https://i.scdn.co/image/ab6761610000e5ebc5c5c5c5c5c5c5c5c5c5c5c5",
	"Neha Kakkar": "https://i.scdn.co/image/ab6761610000e5ebd5d5d5d5d5d5d5d5d5d5d5d5",
	"Atif Aslam": "https://i.scdn.co/image/ab6761610000e5ebe5e5e5e5e5e5e5e5e5e5e5e5",
	"Jubin Nautiyal": "https://i.scdn.co/image/ab6761610000e5ebf5f5f5f5f5f5f5f5f5f5f5f5",
	"B Praak": "https://i.scdn.co/image/ab6761610000e5eb1a1a1a1a1a1a1a1a1a1a1a1a",
	"Darshan Raval": "https://i.scdn.co/image/ab6761610000e5eb2a2a2a2a2a2a2a2a2a2a2a2a",
	"Ed Sheeran": "https://i.scdn.co/image/ab6761610000e5eb3bcef85e105dfc42399ef0ba",
	"The Weeknd": "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb",
	"Drake": "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9",
	"Taylor Swift": "https://i.scdn.co/image/ab6761610000e5ebe672b5f553298dcdccb0e676",
	"Billie Eilish": "https://i.scdn.co/image/ab6761610000e5ebd8b9980db67272cb4d2c3daf",
	"Ariana Grande": "https://i.scdn.co/image/ab6761610000e5ebcdce7620dc940db079bf4952",
	"Justin Bieber": "https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a87ea36",
	"BTS": "https://i.scdn.co/image/ab6761610000e5ebd642648235ebf3460d2d1f6a",
	"Coldplay": "https://i.scdn.co/image/ab6761610000e5eb989ed05e1f0570cc4726c2d3",
	"Eminem": "https://i.scdn.co/image/ab6761610000e5eba00b11c129b27a88fc72f36b",
	"Rihanna": "https://i.scdn.co/image/ab6761610000e5eb99e4fca7c0b7cb166d915789",
	"Bruno Mars": "https://i.scdn.co/image/ab6761610000e5ebc36dd9eb55fb0db4911f25dd",
	"Imagine Dragons": "https://i.scdn.co/image/ab6761610000e5eb920dc1f617550de8388f368e",
	"Alan Walker": "https://i.scdn.co/image/ab6761610000e5eb20241dbb7cc12a5a6f3e9f85",
	"Marshmello": "https://i.scdn.co/image/ab6761610000e5ebb2c4886fc28938f42ac02f70",
	"Dua Lipa": "https://i.scdn.co/image/ab6761610000e5eb1bbee4a02f85ecc58d385c3e",
	"Post Malone": "https://i.scdn.co/image/ab6761610000e5ebe17c0aa1714a03d62b5ce4e0",
	"Selena Gomez": "https://i.scdn.co/image/ab6761610000e5eb50a9e3f3e1c95c8be6a69c32"
};

// Fallback to text avatar if image not found
const getArtistImg = (name: string) => {
	if (ARTIST_IMAGES[name]) return ARTIST_IMAGES[name];
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=1DB954&color=fff&bold=true&font-size=0.35`;
};

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
						<div className='flex items-center justify-between mb-6 sticky top-0 bg-transparent backdrop-blur-md z-[20] -mx-4 px-4 py-3 md:relative md:p-0 md:m-0'>
							<h1 className='text-2xl sm:text-3xl font-black tracking-tight'>{getGreeting()}</h1>
							<div className='flex gap-4 items-center'>
								<span className='text-zinc-400 md:hidden'><Bell size={22} /></span>
								<span className='text-zinc-400 md:hidden'><History size={22} /></span>
								<span className='text-zinc-400 md:hidden'><Settings size={22} /></span>
							</div>
						</div>

						<div className='flex gap-2 mb-8 overflow-x-auto no-scrollbar -mx-1 px-1 sticky top-[60px] bg-transparent z-[15] py-2 md:relative md:top-0 h-14'>
							{FILTERS.map(filter => (
								<button
									key={filter}
									onClick={() => setActiveFilter(filter)}
									className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
										${activeFilter === filter 
											? 'bg-emerald-500 text-black shadow-[0_4px_12px_rgba(16,185,129,0.3)]' 
											: 'bg-zinc-800/80 text-white hover:bg-zinc-700'}`}
								>
									{filter}
								</button>
							))}
						</div>
						
						<ForYouSection />

						<FeaturedSection />

						<div className='space-y-10 pb-32'>
							{recommendedSongs.length > 0 && (
								<SectionGrid title='Recently Played' songs={recommendedSongs.slice(0, 8)} isLoading={isLoading} />
							) || <SectionGrid title='Recently Played' songs={featuredSongs.slice(0, 8)} isLoading={isLoading} />}
							
							{madeForYouSongs.length > 0 && (
								<SectionGrid title='Made For You' songs={madeForYouSongs} isLoading={isLoading} />
							)}
							
							{trendingSongs.length > 0 && (
								<SectionGrid title='Trending Now' songs={trendingSongs} isLoading={isLoading} />
							)}
						</div>
				</div>
			</ScrollArea>
		</main>
	);
};

export default HomePage;
