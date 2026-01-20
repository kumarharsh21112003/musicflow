/**
 * Room Mode Component - Group Listening Sessions
 * Create or join a room to listen together with friends
 */

import { useState, useEffect } from "react";
import { useRoomStore } from "@/stores/useRoomStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Plus, 
  LogIn, 
  X, 
  Crown, 
  Music2, 
  Copy, 
  Send,
  Radio,
  Headphones
} from "lucide-react";

interface RoomModeProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoomMode = ({ isOpen, onClose }: RoomModeProps) => {
  const { user } = useAuthStore();
  const { currentSong, isPlaying, setCurrentSong } = usePlayerStore();
  const { 
    connect,
    isConnected,
    roomCode,
    isHost,
    members,
    messages,
    createRoom,
    joinRoom,
    leaveRoom,
    playSong,
    syncPlayback,
    sendMessage,
    currentSong: roomSong
  } = useRoomStore();

  const [joinCode, setJoinCode] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  // Connect socket on mount
  useEffect(() => {
    if (isOpen && !isConnected) {
      connect();
    }
  }, [isOpen, isConnected, connect]);

  // Sync room song to player - when room song changes, play it!
  useEffect(() => {
    if (roomSong && !isHost) {
      console.log("🎵 Syncing room song:", roomSong.title);
      setCurrentSong(roomSong);
      // Actually start playing
      setTimeout(() => {
        const playerStore = usePlayerStore.getState();
        playerStore.setIsPlaying(true);
      }, 500);
    }
  }, [roomSong?._id, isHost]);

  // When room isPlaying changes, sync playback state
  useEffect(() => {
    if (!isHost && roomCode) {
      const roomPlaying = useRoomStore.getState().isPlaying;
      const playerStore = usePlayerStore.getState();
      playerStore.setIsPlaying(roomPlaying);
    }
  }, [useRoomStore.getState().isPlaying]);

  // Any member can sync their song to room
  useEffect(() => {
    if (currentSong && user && roomCode) {
      playSong(currentSong, user.uid);
    }
  }, [currentSong?._id, roomCode]);

  const handleCreateRoom = () => {
    if (user) {
      createRoom(user.uid, user.displayName || "DJ");
    }
  };

  const handleJoinRoom = () => {
    if (user && joinCode.length >= 4) {
      joinRoom(user.uid, user.displayName || "Guest", joinCode);
      setJoinCode("");
      setShowJoinInput(false);
    }
  };

  const handleLeaveRoom = () => {
    if (user) {
      leaveRoom(user.uid);
    }
  };

  const handleSendMessage = () => {
    if (user && chatMessage.trim()) {
      sendMessage(user.uid, user.displayName || "User", chatMessage);
      setChatMessage("");
    }
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose} // Click outside to close
    >
      <div 
        className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking modal
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-purple-500/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-purple-500 rounded-lg">
              <Radio className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Room Mode</h2>
              <p className="text-xs text-zinc-400">{roomCode ? `Room: ${roomCode}` : 'Listen together with friends'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          {!roomCode ? (
            // No room - Show create/join options
            <div className="space-y-4">
              <div className="text-center py-6">
                <Headphones className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Start a Listening Party</h3>
                <p className="text-zinc-400 text-sm">
                  Create a room and invite friends, or join an existing room
                </p>
              </div>

              {/* Create Room */}
              <Button 
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold py-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Room
              </Button>

              {/* Join Room */}
              {showJoinInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-emerald-500 outline-none text-center font-mono text-lg tracking-widest"
                  />
                  <Button onClick={handleJoinRoom} disabled={joinCode.length < 4}>
                    <LogIn className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowJoinInput(true)}
                  className="w-full py-6 border-zinc-700"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Join Room
                </Button>
              )}
            </div>
          ) : (
            // In a room - Show room info
            <div className="space-y-4">
              {/* Room Code */}
              <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Room Code</p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-emerald-400">
                    {roomCode}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={copyRoomCode}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>

              {/* Members */}
              <div>
                <p className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <div 
                      key={member.id}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        member.isHost 
                          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {member.isHost && <Crown className="h-3 w-3" />}
                      {member.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Now Playing */}
              {roomSong && (
                <div className="bg-zinc-800/50 rounded-xl p-3 flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={roomSong.imageUrl} 
                      alt={roomSong.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <Music2 className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{roomSong.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{roomSong.artist}</p>
                  </div>
                </div>
              )}

              {/* Chat */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <div className="h-32 overflow-y-auto p-2 space-y-1 bg-zinc-800/30">
                  {messages.length === 0 ? (
                    <p className="text-center text-zinc-500 text-xs py-4">No messages yet</p>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium text-emerald-400">{msg.username}: </span>
                        <span className="text-zinc-300">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex border-t border-zinc-800">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-transparent outline-none text-sm"
                  />
                  <Button variant="ghost" size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Leave Room */}
              <Button 
                variant="outline" 
                onClick={handleLeaveRoom}
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Leave Room
              </Button>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
            {isConnected ? 'Connected' : 'Connecting...'}
            {!isConnected && (
              <button 
                onClick={() => connect()} 
                className="ml-2 text-emerald-400 hover:text-emerald-300 underline"
              >
                Retry
              </button>
            )}
            {isHost && <span className="ml-auto text-amber-400">👑 You are the DJ</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomMode;
