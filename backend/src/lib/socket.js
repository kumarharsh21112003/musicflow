import { Server } from "socket.io";
import { Message } from "../models/message.model.js";

export const initializeSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
			credentials: false,
		},
		allowEIO3: true, // Support older socket.io clients
		transports: ['polling', 'websocket'], // Polling first for reliability
		pingTimeout: 60000,
		pingInterval: 25000,
	});

	console.log("🔌 Socket.io server initialized");

	const userSockets = new Map(); // { userId: socketId }
	const userActivities = new Map(); // { userId: activity }
	
	// Room Mode - Group Listening Sessions
	const rooms = new Map(); // { roomId: { host, members: [], currentSong, isPlaying, timestamp } }
	const userRooms = new Map(); // { userId: roomId }

	// Generate unique room code
	const generateRoomCode = () => {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = '';
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	};

	io.on("connection", (socket) => {
		socket.on("user_connected", (userId) => {
			userSockets.set(userId, socket.id);
			userActivities.set(userId, "Idle");

			io.emit("user_connected", userId);
			socket.emit("users_online", Array.from(userSockets.keys()));
			io.emit("activities", Array.from(userActivities.entries()));
		});

		socket.on("update_activity", ({ userId, activity }) => {
			console.log("activity updated", userId, activity);
			userActivities.set(userId, activity);
			io.emit("activity_updated", { userId, activity });
		});

		// ============================================
		// ROOM MODE - Group Listening Sessions
		// ============================================

		// Create a new room
		socket.on("create_room", ({ userId, username }) => {
			const roomCode = generateRoomCode();
			const room = {
				host: userId,
				hostName: username || 'DJ',
				members: [{ id: userId, name: username || 'DJ', isHost: true }],
				currentSong: null,
				isPlaying: false,
				currentTime: 0,
				createdAt: Date.now()
			};
			
			rooms.set(roomCode, room);
			userRooms.set(userId, roomCode);
			socket.join(roomCode);
			
			console.log(`🎉 Room created: ${roomCode} by ${username}`);
			socket.emit("room_created", { roomCode, room });
		});

		// Join an existing room
		socket.on("join_room", ({ userId, username, roomCode }) => {
			const room = rooms.get(roomCode);
			
			if (!room) {
				socket.emit("room_error", { message: "Room not found! Check the code." });
				return;
			}
			
			// Check if already in room
			if (!room.members.find(m => m.id === userId)) {
				room.members.push({ id: userId, name: username || 'Guest', isHost: false });
			}
			
			userRooms.set(userId, roomCode);
			socket.join(roomCode);
			
			// Notify everyone in the room
			io.to(roomCode).emit("member_joined", { 
				userId, 
				username,
				members: room.members,
				currentSong: room.currentSong,
				isPlaying: room.isPlaying,
				currentTime: room.currentTime
			});
			
			console.log(`👋 ${username} joined room: ${roomCode}`);
			socket.emit("room_joined", { roomCode, room });
		});

		// Leave room
		socket.on("leave_room", ({ userId }) => {
			const roomCode = userRooms.get(userId);
			if (!roomCode) return;
			
			const room = rooms.get(roomCode);
			if (!room) return;
			
			// Remove member
			room.members = room.members.filter(m => m.id !== userId);
			userRooms.delete(userId);
			socket.leave(roomCode);
			
			// If host left, assign new host or delete room
			if (room.host === userId) {
				if (room.members.length > 0) {
					room.host = room.members[0].id;
					room.members[0].isHost = true;
					io.to(roomCode).emit("host_changed", { newHost: room.members[0] });
				} else {
					rooms.delete(roomCode);
					console.log(`🗑️ Room ${roomCode} deleted (no members)`);
					return;
				}
			}
			
			io.to(roomCode).emit("member_left", { userId, members: room.members });
			console.log(`👋 User ${userId} left room: ${roomCode}`);
		});

		// Host plays a song - sync to all members
		socket.on("room_play_song", ({ roomCode, song, userId }) => {
			const room = rooms.get(roomCode);
			if (!room || room.host !== userId) return;
			
			room.currentSong = song;
			room.isPlaying = true;
			room.currentTime = 0;
			
			io.to(roomCode).emit("room_song_changed", { 
				song, 
				isPlaying: true,
				currentTime: 0
			});
			
			console.log(`🎵 Room ${roomCode}: Playing "${song.title}"`);
		});

		// Sync playback state
		socket.on("room_sync_playback", ({ roomCode, isPlaying, currentTime, userId }) => {
			const room = rooms.get(roomCode);
			if (!room || room.host !== userId) return;
			
			room.isPlaying = isPlaying;
			room.currentTime = currentTime;
			
			// Broadcast to all except sender
			socket.to(roomCode).emit("room_playback_sync", { isPlaying, currentTime });
		});

		// Room chat message
		socket.on("room_chat", ({ roomCode, userId, username, message }) => {
			io.to(roomCode).emit("room_chat_message", {
				userId,
				username,
				message,
				timestamp: Date.now()
			});
		});

		// Get room info
		socket.on("get_room_info", ({ roomCode }) => {
			const room = rooms.get(roomCode);
			if (room) {
				socket.emit("room_info", { roomCode, room });
			} else {
				socket.emit("room_error", { message: "Room not found" });
			}
		});

		// ============================================
		// MESSAGING
		// ============================================

		socket.on("send_message", async (data) => {
			try {
				const { senderId, receiverId, content } = data;

				const message = await Message.create({
					senderId,
					receiverId,
					content,
				});

				const receiverSocketId = userSockets.get(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("receive_message", message);
				}

				socket.emit("message_sent", message);
			} catch (error) {
				console.error("Message error:", error);
				socket.emit("message_error", error.message);
			}
		});

		socket.on("disconnect", () => {
			let disconnectedUserId;
			for (const [userId, socketId] of userSockets.entries()) {
				if (socketId === socket.id) {
					disconnectedUserId = userId;
					userSockets.delete(userId);
					userActivities.delete(userId);
					
					// Handle room cleanup
					const roomCode = userRooms.get(userId);
					if (roomCode) {
						const room = rooms.get(roomCode);
						if (room) {
							room.members = room.members.filter(m => m.id !== userId);
							if (room.members.length === 0) {
								rooms.delete(roomCode);
							} else if (room.host === userId) {
								room.host = room.members[0].id;
								room.members[0].isHost = true;
								io.to(roomCode).emit("host_changed", { newHost: room.members[0] });
							}
							io.to(roomCode).emit("member_left", { userId, members: room.members });
						}
						userRooms.delete(userId);
					}
					
					break;
				}
			}
			if (disconnectedUserId) {
				io.emit("user_disconnected", disconnectedUserId);
			}
		});
	});
};
