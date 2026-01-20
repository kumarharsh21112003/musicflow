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

// Try multiple backend URLs
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return "http://localhost:3003";
};

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
    const { socket } = get();
    if (socket?.connected) return;

    const backendUrl = getBackendUrl();
    console.log("🔌 Connecting to Room socket:", backendUrl);

    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Room socket connected!");
      set({ isConnected: true });
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      set({ isConnected: false });
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Room socket disconnected");
      set({ isConnected: false });
    });

    // Room events
    newSocket.on("room_created", ({ roomCode, room }) => {
      console.log("🎉 Room created:", roomCode);
      set({ 
        roomCode, 
        isHost: true, 
        members: room.members 
      });
      toast.success(`Room created! Code: ${roomCode}`, { icon: '🎉', duration: 3000 });
    });

    newSocket.on("room_joined", ({ roomCode, room }) => {
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

    newSocket.on("room_error", ({ message }) => {
      console.error("Room error:", message);
      toast.error(message, { icon: '❌' });
    });

    newSocket.on("member_joined", ({ username, members, currentSong, isPlaying }) => {
      set({ members, currentSong, isPlaying });
      toast.success(`${username} joined!`, { icon: '👋' });
    });

    newSocket.on("member_left", ({ members }) => {
      set({ members });
    });

    newSocket.on("host_changed", ({ newHost }) => {
      const userId = newSocket.id;
      const isNewHost = newHost.id === userId;
      set({ isHost: isNewHost });
      if (isNewHost) {
        toast.success("You are now the DJ!", { icon: '🎧' });
      }
    });

    newSocket.on("room_song_changed", ({ song, isPlaying }) => {
      set({ currentSong: song, isPlaying });
      toast.success(`Now playing: ${song.title}`, { icon: '🎵', duration: 2000 });
    });

    newSocket.on("room_playback_sync", ({ isPlaying }) => {
      set({ isPlaying });
    });

    newSocket.on("room_chat_message", (message: RoomMessage) => {
      set(state => ({ 
        messages: [...state.messages.slice(-99), message]
      }));
    });

    set({ socket: newSocket });
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
    const { socket, isConnected } = get();
    if (!socket || !isConnected) {
      toast.error("Not connected. Please wait...");
      return;
    }
    console.log("Creating room for:", userId, username);
    socket.emit("create_room", { userId, username });
  },

  joinRoom: (userId, username, roomCode) => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) {
      toast.error("Not connected. Please wait...");
      return;
    }
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
