import { Song } from "@/types";
import { create } from "zustand";

interface MusicStore {
	songs: Song[];
	isLoading: boolean;
	error: string | null;
	featuredSongs: Song[];
	madeForYouSongs: Song[];
	trendingSongs: Song[];
	searchResults: Song[];
	recommendedSongs: Song[];

	searchSongs: (query: string) => Promise<void>;
	fetchTrending: () => Promise<void>;
	fetchArtistsSongs: (artists: string[]) => Promise<void>;
	clearSearch: () => void;
}

const convertToSong = (item: any): Song => ({
	_id: item.id || item.videoId || item._id,
	title: item.title,
	artist: item.artist,
	imageUrl: item.imageUrl || `https://i.ytimg.com/vi/${item.videoId || item.id}/mqdefault.jpg`,
	audioUrl: "",
	videoId: item.videoId || item.id,
	duration: item.duration || 240,
	albumId: null,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
});

// Backend URL - use env in production, localhost in dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || null;
const LOCAL_PORTS = [3003, 3004, 3002, 3005];

const fetchWithRetry = async (endpoint: string, options?: RequestInit) => {
	// In production, use the configured backend URL
	if (BACKEND_URL) {
		try {
			const response = await fetch(`${BACKEND_URL}${endpoint}`, {
				...options,
				signal: AbortSignal.timeout(10000)
			});
			if (response.ok) return response;
		} catch (e) {
			console.error('Production backend error:', e);
		}
		throw new Error('Backend unavailable');
	}
	
	// In development, try multiple local ports
	for (const port of LOCAL_PORTS) {
		try {
			const response = await fetch(`http://localhost:${port}${endpoint}`, {
				...options,
				signal: AbortSignal.timeout(5000)
			});
			if (response.ok) return response;
		} catch (e) {
			continue;
		}
	}
	throw new Error('All ports failed');
};

export const useMusicStore = create<MusicStore>((set) => ({
	songs: [],
	isLoading: false,
	error: null,
	featuredSongs: [],
	madeForYouSongs: [],
	trendingSongs: [],
	searchResults: [],
	recommendedSongs: [],

	clearSearch: () => set({ searchResults: [] }),

	searchSongs: async (query: string) => {
		if (!query.trim()) {
			set({ searchResults: [] });
			return;
		}
		set({ isLoading: true });
		try {
			const response = await fetchWithRetry(`/api/search?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			if (Array.isArray(data) && data.length > 0) {
				set({ searchResults: data.map(convertToSong), isLoading: false });
				return;
			}
		} catch (e) {
			console.error('Search error:', e);
		}
		set({ searchResults: [], isLoading: false });
		console.error('Backend unavailable');
	},

	fetchTrending: async () => {
		try {
			const response = await fetchWithRetry('/api/trending');
			const data = await response.json();
			set({ trendingSongs: data.map(convertToSong) });
		} catch (e) {
			console.error('Trending error:', e);
		}
	},

	fetchArtistsSongs: async (artists: string[]) => {
		set({ isLoading: true });
		try {
			const response = await fetchWithRetry('/api/artists-songs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ artists }),
			});
			
			const data = await response.json();
			const songs = data.map(convertToSong);
			
			// Shuffle and split for variety
			const shuffled = [...songs].sort(() => Math.random() - 0.5);
			set({ 
				featuredSongs: shuffled.slice(0, 6),
				madeForYouSongs: shuffled.slice(6, 12),
				recommendedSongs: songs,
				isLoading: false 
			});
		} catch (e) {
			console.error('Artists error:', e);
			set({ isLoading: false });
		}
	},
}));
