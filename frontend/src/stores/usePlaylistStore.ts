import { Song } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Playlist {
	id: string;
	name: string;
	songs: Song[];
	createdAt: string;
}

interface PlaylistStore {
	playlists: Playlist[];
	likedSongs: Song[];
	
	createPlaylist: (name: string) => string;
	deletePlaylist: (id: string) => void;
	addToPlaylist: (playlistId: string, song: Song) => void;
	removeFromPlaylist: (playlistId: string, songId: string) => void;
	addToLikedSongs: (song: Song) => void;
	removeFromLikedSongs: (songId: string) => void;
	isInLikedSongs: (songId: string) => boolean;
}

export const usePlaylistStore = create<PlaylistStore>()(
	persist(
		(set, get) => ({
			playlists: [],
			likedSongs: [],

			createPlaylist: (name: string) => {
				const id = `playlist-${Date.now()}`;
				set((state) => ({
					playlists: [
						...state.playlists,
						{
							id,
							name,
							songs: [],
							createdAt: new Date().toISOString(),
						},
					],
				}));
				return id;
			},

			deletePlaylist: (id: string) => {
				set((state) => ({
					playlists: state.playlists.filter((p) => p.id !== id),
				}));
			},

			addToPlaylist: (playlistId: string, song: Song) => {
				set((state) => ({
					playlists: state.playlists.map((p) =>
						p.id === playlistId
							? { ...p, songs: [...p.songs.filter(s => s._id !== song._id), song] }
							: p
					),
				}));
			},

			removeFromPlaylist: (playlistId: string, songId: string) => {
				set((state) => ({
					playlists: state.playlists.map((p) =>
						p.id === playlistId
							? { ...p, songs: p.songs.filter((s) => s._id !== songId) }
							: p
					),
				}));
			},

			addToLikedSongs: (song: Song) => {
				set((state) => ({
					likedSongs: state.likedSongs.some((s) => s._id === song._id)
						? state.likedSongs
						: [...state.likedSongs, song],
				}));
			},

			removeFromLikedSongs: (songId: string) => {
				set((state) => ({
					likedSongs: state.likedSongs.filter((s) => s._id !== songId),
				}));
			},

			isInLikedSongs: (songId: string) => {
				return get().likedSongs.some((s) => s._id === songId);
			},
		}),
		{
			name: "musicflow-playlists",
		}
	)
);
