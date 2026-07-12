"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface Room {
  _id: Id<"rooms">;
  name: string;
  hostId: string;
  hostName: string;
  status: "waiting" | "playing" | "finished";
  maxPlayers: number;
  playerIds: string[];
  createdAt: number;
}
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Plus, LogIn, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LobbyPage() {
  const { user } = useUser();
  const router = useRouter();
  const rooms = useQuery(api.rooms.listOpenRooms);
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreating, setIsCreating] = useState(false);

  if (!user) {
    router.push("/");
    return null;
  }

  const handleCreate = async () => {
    if (!roomName.trim()) return toast.error("Enter a room name");
    setIsCreating(true);
    try {
      const roomId = await createRoom({
        name: roomName.trim(),
        hostId: user.id,
        hostName: user.firstName ?? user.username ?? "Player",
        avatarUrl: user.imageUrl,
        maxPlayers,
      });
      toast.success("Room created!");
      router.push(`/game/${roomId}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (roomId: Id<"rooms">) => {
    try {
      await joinRoom({
        roomId,
        userId: user.id,
        userName: user.firstName ?? user.username ?? "Player",
        avatarUrl: user.imageUrl,
      });
      router.push(`/game/${roomId}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to join room");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Game Lobby
          </h1>
          <p className="text-gray-500 dark:text-purple-300">
            Join an open room or create your own
          </p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus size={18} /> Create Room
        </Button>
      </div>

      {/* Create Room Panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="p-6 mb-6 rounded-2xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-purple-950/40 shadow-sm overflow-hidden"
          >
            <h2 className="font-semibold text-lg mb-4 text-black dark:text-white">
              Create a New Room
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Room name (e.g. Friday Night UNO)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none bg-gray-50 dark:bg-purple-900/30 border border-gray-200 dark:border-purple-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-purple-400"
              />
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="px-4 py-3 rounded-xl text-sm outline-none bg-gray-50 dark:bg-purple-900/30 border border-gray-200 dark:border-purple-700 text-black dark:text-white"
              >
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
              </select>
              <Button
                className="bg-purple-600 hover:bg-purple-500 text-white"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create & Enter"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room List */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-purple-300 mb-4">
          Open Rooms ({rooms?.length ?? 0})
        </h2>

        {rooms === undefined && (
          <div className="text-center py-12 text-gray-400 dark:text-purple-400">
            Loading rooms...
          </div>
        )}

        {rooms?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center rounded-2xl border border-gray-200 dark:border-purple-800 bg-white dark:bg-purple-950/40"
          >
            <div className="text-5xl mb-4">🃏</div>
            <p className="font-semibold text-black dark:text-white mb-1">
              No open rooms yet
            </p>
            <p className="text-gray-500 dark:text-purple-300">
              Be the first — create a room above!
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {rooms?.map((room: Room, i: number) => (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 dark:border-purple-800 bg-white dark:bg-purple-950/40 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white bg-gradient-to-br from-purple-600 to-purple-800">
                  {room.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-black dark:text-white">
                    {room.name}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-purple-300">
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      {room.playerIds.length} / {room.maxPlayers}
                    </span>
                    <span>Host: {room.hostName}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {Math.round((Date.now() - room.createdAt) / 60000)}m ago
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Player slot dots */}
                <div className="hidden sm:flex gap-1 mr-2">
                  {Array.from({ length: room.maxPlayers }).map((_, j) => (
                    <div
                      key={j}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          j < room.playerIds.length ? "#9333ea" : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>

                {room.playerIds.includes(user.id) ? (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1"
                    onClick={() => router.push(`/game/${room._id}`)}
                  >
                    <LogIn size={15} /> Rejoin
                  </Button>
                ) : room.playerIds.length >= room.maxPlayers ? (
                  <span className="text-sm px-4 py-2 rounded-xl text-gray-400 dark:text-purple-400 bg-gray-100 dark:bg-purple-900/30">
                    Full
                  </span>
                ) : (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1"
                    onClick={() => handleJoin(room._id)}
                  >
                    <LogIn size={15} /> Join
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
