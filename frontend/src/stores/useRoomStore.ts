/**
 * Room Mode Store - Group Listening Sessions
 * Manage room state, members, and synced playback
 */

import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { Song } from "@/types";
import toast from "react-hot-toast";

interface RoomMember {
  id: string;
  name: string;
  isHost: boolean;
}

interface RoomMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface RoomStore {
  socket: Socket | null;
  isConnected: boolean;
  roomCode: string | null;
  isHost: boolean;
  members: RoomMember[];
  currentSong: Song | null;
  isPlaying: boolean;
  messages: RoomMessage[];
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: (userId: string, username: string) => void;
  joinRoom: (userId: string, username: string, roomCode: string) => void;
  leaveRoom: (userId: string) => void;
  playSong: (song: Song, userId: string) => void;
  syncPlayback: (isPlaying: boolean, currentTime: number, userId: string) => void;
  sendMessage: (userId: string, username: string, message: string) => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3003";

export const useRoomStore = create<RoomStore>((set, get) => ({
  socket: null,
  isConnected: false,
  roomCode: null,
  isHost: false,
  members: [],
  currentSong: null,
  isPlaying: false,
  messages: [],

  connect: () => {
    if (get().socket?.connected) return;

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => {
      console.log("🔌 Room socket connected");
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Room socket disconnected");
      set({ isConnected: false });
    });

    // Room events
    socket.on("room_created", ({ roomCode, room }) => {
      console.log("🎉 Room created:", roomCode);
      set({ 
        roomCode, 
        isHost: true, 
        members: room.members 
      });
      toast.success(`Room created! Code: ${roomCode}`, { icon: '🎉' });
    });

    socket.on("room_joined", ({ roomCode, room }) => {
      console.log("👋 Joined room:", roomCode);
      set({ 
        roomCode, 
        isHost: false, 
        members: room.members,
        currentSong: room.currentSong,
        isPlaying: room.isPlaying
      });
      toast.success(`Joined room: ${roomCode}`, { icon: '👋' });
    });

    socket.on("room_error", ({ message }) => {
      toast.error(message, { icon: '❌' });
    });

    socket.on("member_joined", ({ username, members, currentSong, isPlaying }) => {
      set({ members, currentSong, isPlaying });
      toast.success(`${username} joined the room!`, { icon: '👋' });
    });

    socket.on("member_left", ({ members }) => {
      set({ members });
    });

    socket.on("host_changed", ({ newHost }) => {
      const state = get();
      const isNewHost = newHost.id === state.socket?.id;
      set({ isHost: isNewHost });
      if (isNewHost) {
        toast.success("You are now the DJ!", { icon: '🎧' });
      }
    });

    socket.on("room_song_changed", ({ song, isPlaying }) => {
      set({ currentSong: song, isPlaying });
      toast.success(`Now playing: ${song.title}`, { icon: '🎵', duration: 2000 });
    });

    socket.on("room_playback_sync", ({ isPlaying }) => {
      set({ isPlaying });
    });

    socket.on("room_chat_message", (message: RoomMessage) => {
      set(state => ({ 
        messages: [...state.messages.slice(-99), message] // Keep last 100 messages
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ 
        socket: null, 
        isConnected: false, 
        roomCode: null, 
        isHost: false, 
        members: [], 
        messages: [] 
      });
    }
  },

  createRoom: (userId, username) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit("create_room", { userId, username });
  },

  joinRoom: (userId, username, roomCode) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit("join_room", { userId, username, roomCode: roomCode.toUpperCase() });
  },

  leaveRoom: (userId) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit("leave_room", { userId });
    set({ roomCode: null, isHost: false, members: [], messages: [] });
    toast.success("Left the room", { icon: '👋' });
  },

  playSong: (song, userId) => {
    const { socket, roomCode, isHost } = get();
    if (!socket || !roomCode || !isHost) return;
    socket.emit("room_play_song", { roomCode, song, userId });
  },

  syncPlayback: (isPlaying, currentTime, userId) => {
    const { socket, roomCode, isHost } = get();
    if (!socket || !roomCode || !isHost) return;
    socket.emit("room_sync_playback", { roomCode, isPlaying, currentTime, userId });
  },

  sendMessage: (userId, username, message) => {
    const { socket, roomCode } = get();
    if (!socket || !roomCode) return;
    socket.emit("room_chat", { roomCode, userId, username, message });
  }
}));
