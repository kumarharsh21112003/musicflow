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

// Try multiple backend URLs - Production first!
const BACKEND_URLS = [
  "https://musicflow-s9jn.onrender.com", // Production - try first
  import.meta.env.VITE_BACKEND_URL,
  "http://localhost:3003",
].filter(Boolean);

// Helper to setup socket listeners
const setupSocketListeners = (socket: Socket, set: any, get: any) => {
  socket.on("disconnect", () => {
    console.log("🔌 Room socket disconnected");
    set({ isConnected: false });
  });

  socket.on("room_created", ({ roomCode, room }: any) => {
    console.log("🎉 Room created:", roomCode);
    set({ roomCode, isHost: true, members: room.members });
    toast.success(`Room created! Code: ${roomCode}`, { icon: '🎉', duration: 3000 });
  });

  socket.on("room_joined", ({ roomCode, room }: any) => {
    console.log("👋 Joined room:", roomCode);
    set({ 
      roomCode, isHost: false, members: room.members,
      currentSong: room.currentSong, isPlaying: room.isPlaying
    });
    toast.success(`Joined room: ${roomCode}`, { icon: '👋' });
  });

  socket.on("room_error", ({ message }: any) => {
    console.error("Room error:", message);
    toast.error(message, { icon: '❌' });
  });

  socket.on("member_joined", ({ username, members, currentSong, isPlaying }: any) => {
    set({ members, currentSong, isPlaying });
    toast.success(`${username} joined!`, { icon: '👋' });
  });

  socket.on("member_left", ({ members }: any) => set({ members }));

  socket.on("host_changed", ({ newHost }: any) => {
    const isNewHost = newHost.id === socket.id;
    set({ isHost: isNewHost });
    if (isNewHost) toast.success("You are now the DJ!", { icon: '🎧' });
  });

  socket.on("room_song_changed", ({ song, isPlaying }: any) => {
    set({ currentSong: song, isPlaying });
    toast.success(`Now playing: ${song.title}`, { icon: '🎵', duration: 2000 });
  });

  socket.on("room_playback_sync", ({ isPlaying }: any) => set({ isPlaying }));

  socket.on("room_chat_message", (message: RoomMessage) => {
    set((state: any) => ({ messages: [...state.messages.slice(-99), message] }));
  });
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

    // Try to connect to multiple URLs
    const tryConnect = (urlIndex: number) => {
      if (urlIndex >= BACKEND_URLS.length) {
        console.error("❌ All backend URLs failed");
        toast.error("Backend server not running. Start it with: cd backend && npm run dev", { 
          duration: 5000,
          icon: '⚠️'
        });
        return;
      }

      const backendUrl = BACKEND_URLS[urlIndex];
      console.log(`🔌 Trying to connect to: ${backendUrl}`);

      const newSocket = io(backendUrl as string, {
        withCredentials: false, // Changed to false for local dev
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 500,
        timeout: 3000,
      });

      const connectTimeout = setTimeout(() => {
        if (!newSocket.connected) {
          newSocket.disconnect();
          tryConnect(urlIndex + 1);
        }
      }, 3000);

      newSocket.on("connect", () => {
        clearTimeout(connectTimeout);
        console.log("✅ Room socket connected to:", backendUrl);
        set({ isConnected: true, socket: newSocket });
        toast.success("Connected to server!", { icon: '✅', duration: 2000 });
        setupSocketListeners(newSocket, set, get);
      });

      newSocket.on("connect_error", (err) => {
        clearTimeout(connectTimeout);
        console.error(`❌ Connection failed for ${backendUrl}:`, err.message);
        newSocket.disconnect();
        tryConnect(urlIndex + 1);
      });
    };

    tryConnect(0);
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
