import { Song } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioSettings {
	bassBoost: number;
	trebleBoost: number;
	loudness: number;
	spatialAudio: boolean;
	qualityMode: 'auto' | 'high' | 'ultra';
	crossfadeEnabled: boolean;
	crossfadeDuration: number; // seconds (5-12)
	mixMode: 'off' | 'fade' | 'rise' | 'blend' | 'party'; // DJ Mix presets
}

interface ListenedSong {
	artist: string;
	title: string;
	playedAt: number;
}

interface PlayerStore {
	currentSong: Song | null;
	isPlaying: boolean;
	queue: Song[];
	currentIndex: number;
	audioSettings: AudioSettings;
	listeningHistory: ListenedSong[];

	setCurrentSong: (song: Song | null) => void;
	setIsPlaying: (playing: boolean) => void;
	togglePlay: () => void;
	playNext: () => void;
	playPrevious: () => void;
	setQueue: (songs: Song[]) => void;
	updateAudioSettings: (settings: Partial<AudioSettings>) => void;
	getTopArtists: () => string[];
	toggleCrossfade: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
	persist(
		(set, get) => ({
			currentSong: null,
			isPlaying: false,
			queue: [],
			currentIndex: -1,
			audioSettings: {
				bassBoost: 50,
				trebleBoost: 50,
				loudness: 70,
				spatialAudio: false,
				qualityMode: 'high',
				crossfadeEnabled: false,
				crossfadeDuration: 8,
				mixMode: 'off',
			},
			listeningHistory: [],

			setCurrentSong: (song) => {
				if (!song) {
					set({ currentSong: null, isPlaying: false });
					return;
				}

				const { queue, listeningHistory } = get();
				const songIndex = queue.findIndex((s) => s._id === song._id);
				
				// Track listening history
				const newHistory: ListenedSong = {
					artist: song.artist,
					title: song.title,
					playedAt: Date.now(),
				};
				
				// Keep last 100 songs
				const updatedHistory = [newHistory, ...listeningHistory].slice(0, 100);
				
				set({ 
					currentSong: song, 
					currentIndex: songIndex !== -1 ? songIndex : 0,
					isPlaying: true,
					listeningHistory: updatedHistory,
				});
			},

			setIsPlaying: (playing) => {
				set({ isPlaying: playing });
			},

			togglePlay: () => {
				const { isPlaying, currentSong, queue } = get();
				
				if (!currentSong && queue.length > 0) {
					get().setCurrentSong(queue[0]);
					return;
				}
				
				set({ isPlaying: !isPlaying });
			},

			playNext: () => {
				const { queue, currentIndex } = get();
				if (queue.length === 0) return;

				const nextIndex = (currentIndex + 1) % queue.length;
				set({ currentIndex: nextIndex, isPlaying: true });
				get().setCurrentSong(queue[nextIndex]);
			},

			playPrevious: () => {
				const { queue, currentIndex } = get();
				if (queue.length === 0) return;

				const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
				set({ currentIndex: prevIndex, isPlaying: true });
				get().setCurrentSong(queue[prevIndex]);
			},

			setQueue: (songs) => {
				set({ queue: songs });
			},

			updateAudioSettings: (settings) => {
				set((state) => ({
					audioSettings: { ...state.audioSettings, ...settings }
				}));
			},

			// Get top played artists for recommendations
			getTopArtists: () => {
				const { listeningHistory } = get();
				const artistCount: Record<string, number> = {};
				
				listeningHistory.forEach(song => {
					artistCount[song.artist] = (artistCount[song.artist] || 0) + 1;
				});
				
				// Sort by play count and return top 5
				return Object.entries(artistCount)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5)
					.map(([artist]) => artist);
			},

			// Toggle crossfade mixing
			toggleCrossfade: () => {
				set((state) => ({
					audioSettings: { 
						...state.audioSettings, 
						crossfadeEnabled: !state.audioSettings.crossfadeEnabled 
					}
				}));
			},
		}),
		{
			name: 'musicflow-player',
			partialize: (state) => ({ 
				audioSettings: state.audioSettings,
				listeningHistory: state.listeningHistory,
			}),
		}
	)
);
