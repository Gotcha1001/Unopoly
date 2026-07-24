// "use client";

// import { useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { useRouter } from "next/navigation";

// interface Room {
//   _id: Id<"rooms">;
//   name: string;
//   hostId: string;
//   hostName: string;
//   status: "waiting" | "playing" | "finished";
//   maxPlayers: number;
//   playerIds: string[];
//   createdAt: number;
// }

// interface Player {
//   _id: Id<"players">;
//   roomId: Id<"rooms">;
//   userId: string;
//   name: string;
//   avatarUrl?: string;
//   isBot: boolean;
//   isReady: boolean;
//   isConnected: boolean;
//   hand: string[];
//   seatIndex: number;
// }
// import { motion } from "framer-motion";
// import { Bot, UserRound, Crown, Play, LogOut, Copy } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";

// interface Props {
//   room: Room;
//   players: Player[];
//   currentUserId: string;
// }

// export function WaitingRoom({ room, players, currentUserId }: Props) {
//   const router = useRouter();
//   const startGame = useMutation(api.game.startGame);
//   const addBot = useMutation(api.rooms.addBot);
//   const leaveRoom = useMutation(api.rooms.leaveRoom);
//   const setReady = useMutation(api.rooms.setReady);

//   const isHost = room.hostId === currentUserId;
//   const myPlayer = players.find((p) => p.userId === currentUserId);
//   const canStart = isHost && players.length >= 2;

//   const handleStart = async () => {
//     try {
//       await startGame({ roomId: room._id, requesterId: currentUserId });
//     } catch (e: unknown) {
//       toast.error(e instanceof Error ? e.message : "Failed to start game");
//     }
//   };

//   const handleAddBot = async () => {
//     try {
//       await addBot({ roomId: room._id, requesterId: currentUserId });
//       toast.success("Bot added!");
//     } catch (e: unknown) {
//       toast.error(e instanceof Error ? e.message : "Failed to add bot");
//     }
//   };

//   const handleLeave = async () => {
//     await leaveRoom({ roomId: room._id, userId: currentUserId });
//     router.push("/lobby");
//   };

//   const handleCopyLink = () => {
//     navigator.clipboard.writeText(window.location.href);
//     toast.success("Room link copied!");
//   };

//   const handleToggleReady = async () => {
//     await setReady({
//       roomId: room._id,
//       userId: currentUserId,
//       isReady: !myPlayer?.isReady,
//     });
//   };

//   return (
//     <div className="max-w-md mx-auto py-8 px-4">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold text-black dark:text-white">
//           {room.name}
//         </h1>
//         <Button
//           variant="outline"
//           size="sm"
//           className="flex items-center gap-1"
//           onClick={handleLeave}
//         >
//           <LogOut size={14} /> Leave
//         </Button>
//       </div>

//       {/* Room info */}
//       <motion.div
//         className="p-5 rounded-2xl border border-gray-200 dark:border-purple-800 bg-white dark:bg-purple-950/40 mb-4 text-center"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//       >
//         <p className="text-gray-500 dark:text-purple-300 mb-3">
//           Waiting for players... ({players.length}/{room.maxPlayers})
//         </p>
//         <Button
//           variant="outline"
//           size="sm"
//           className="flex items-center gap-2 mx-auto"
//           onClick={handleCopyLink}
//         >
//           <Copy size={14} /> Share Room Link
//         </Button>
//       </motion.div>

//       {/* Players list */}
//       <div className="p-4 rounded-2xl border border-gray-200 dark:border-purple-800 bg-white dark:bg-purple-950/40 mb-4 space-y-2">
//         <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-purple-300 mb-3">
//           Players
//         </h2>

//         {players.map((player, i) => (
//           <motion.div
//             key={player._id}
//             initial={{ opacity: 0, x: -15 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ delay: i * 0.08 }}
//             className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-purple-900/30"
//           >
//             <div
//               className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
//               style={{
//                 background: player.isBot
//                   ? "#4a4a6a"
//                   : "linear-gradient(135deg, #9333ea, #7c3aed)",
//               }}
//             >
//               {player.isBot ? <Bot size={18} /> : <UserRound size={18} />}
//             </div>
//             <div className="flex-1">
//               <div className="flex items-center gap-2">
//                 <span className="font-medium text-sm text-black dark:text-white">
//                   {player.name}
//                 </span>
//                 {player.userId === room.hostId && (
//                   <Crown size={12} className="text-yellow-500" />
//                 )}
//                 {player.isBot && (
//                   <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-purple-800 text-gray-600 dark:text-purple-300">
//                     BOT
//                   </span>
//                 )}
//               </div>
//             </div>
//             <div
//               className="w-2 h-2 rounded-full"
//               style={{
//                 background:
//                   player.isReady || player.isBot ? "#22c55e" : "#d1d5db",
//               }}
//             />
//           </motion.div>
//         ))}

//         {/* Empty slots */}
//         {Array.from({ length: room.maxPlayers - players.length }).map(
//           (_, i) => (
//             <div
//               key={`empty-${i}`}
//               className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-purple-800"
//             >
//               <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-purple-900" />
//               <span className="text-sm text-gray-400 dark:text-purple-400">
//                 Waiting for player...
//               </span>
//             </div>
//           ),
//         )}
//       </div>

//       {/* Actions */}
//       <div className="space-y-3">
//         {isHost ? (
//           <>
//             {players.length < room.maxPlayers && (
//               <Button
//                 variant="outline"
//                 className="w-full flex items-center justify-center gap-2"
//                 onClick={handleAddBot}
//               >
//                 <Bot size={16} /> Add AI Bot
//               </Button>
//             )}
//             <Button
//               className={`w-full py-6 text-lg flex items-center justify-center gap-2 ${
//                 canStart
//                   ? "bg-purple-600 hover:bg-purple-500 text-white"
//                   : "bg-gray-200 dark:bg-purple-900/30 text-gray-400 cursor-not-allowed"
//               }`}
//               onClick={canStart ? handleStart : undefined}
//               disabled={!canStart}
//             >
//               <Play size={20} />
//               {players.length < 2 ? "Need 2+ Players" : "Start Game"}
//             </Button>
//           </>
//         ) : (
//           <Button
//             variant="outline"
//             className="w-full py-6 text-lg"
//             onClick={handleToggleReady}
//           >
//             {myPlayer?.isReady
//               ? "✓ Ready! (click to unready)"
//               : "Mark as Ready"}
//           </Button>
//         )}
//       </div>

//       {!isHost && (
//         <p className="text-center text-sm mt-4 text-gray-500 dark:text-purple-400">
//           Waiting for host to start the game...
//         </p>
//       )}
//     </div>
//   );
// }
"use client";

// ─── CHANGES FROM ORIGINAL ────────────────────────────────────────────────────
// 1. Import useSoundManager
// 2. play("gameStart") on handleStart
// 3. play("buttonClick") on handleAddBot, handleCopyLink, handleToggleReady
// 4. play("roomJoin") when a new player joins (reactive useEffect on players.length)
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, UserRound, Crown, Play, LogOut, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { useSoundManager } from "@/hooks/useSoundManager"; // ← adjust path

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

interface Player {
  _id: Id<"players">;
  roomId: Id<"rooms">;
  userId: string;
  name: string;
  avatarUrl?: string;
  isBot: boolean;
  isReady: boolean;
  isConnected: boolean;
  hand: string[];
  seatIndex: number;
}

interface Props {
  room: Room;
  players: Player[];
  currentUserId: string;
}

export function WaitingRoom({ room, players, currentUserId }: Props) {
  const router = useRouter();
  const startGame = useMutation(api.game.startGame);
  const addBot = useMutation(api.rooms.addBot);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const setReady = useMutation(api.rooms.setReady);

  const { play } = useSoundManager();

  const isHost = room.hostId === currentUserId;
  const myPlayer = players.find((p) => p.userId === currentUserId);
  const canStart = isHost && players.length >= 2;

  // ── Sound: play roomJoin whenever the player count goes up ────────────────
  const prevPlayerCount = useRef(players.length);
  useEffect(() => {
    if (players.length > prevPlayerCount.current) {
      play("roomJoin");
    }
    prevPlayerCount.current = players.length;
  }, [players.length, play]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = async () => {
    try {
      play("gameStart"); // ← fanfare before the mutation
      await startGame({ roomId: room._id, requesterId: currentUserId });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to start game");
    }
  };

  const handleAddBot = async () => {
    try {
      play("buttonClick");
      await addBot({ roomId: room._id, requesterId: currentUserId });
      toast.success("Bot added!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add bot");
    }
  };

  const handleLeave = async () => {
    await leaveRoom({ roomId: room._id, userId: currentUserId });
    router.push("/lobby");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    play("buttonClick");
    toast.success("Room link copied!");
  };

  const handleToggleReady = async () => {
    play("buttonClick");
    await setReady({
      roomId: room._id,
      userId: currentUserId,
      isReady: !myPlayer?.isReady,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          {room.name}
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleLeave}
        >
          <LogOut size={14} /> Leave
        </Button>
      </div>

      {/* Room info */}
      <motion.div
        className="p-5 rounded-2xl border border-gray-200 dark:border-purple-800 bg-white dark:bg-purple-950/40 mb-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-gray-500 dark:text-purple-300 mb-3">
          Waiting for players... ({players.length}/{room.maxPlayers})
        </p>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 mx-auto"
          onClick={handleCopyLink}
        >
          <Copy size={14} /> Share Room Link
        </Button>
      </motion.div>

      {/* Players list */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-purple-800 bg-white dark:bg-purple-950/40 mb-4 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-purple-300 mb-3">
          Players
        </h2>
        {players.map((player, i) => (
          <motion.div
            key={player._id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-purple-900/30"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{
                background: player.isBot
                  ? "#4a4a6a"
                  : "linear-gradient(135deg, #9333ea, #7c3aed)",
              }}
            >
              {player.isBot ? <Bot size={18} /> : <UserRound size={18} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-black dark:text-white">
                  {player.name}
                </span>
                {player.userId === room.hostId && (
                  <Crown size={12} className="text-yellow-500" />
                )}
                {player.isBot && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-purple-800 text-gray-600 dark:text-purple-300">
                    BOT
                  </span>
                )}
              </div>
            </div>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  player.isReady || player.isBot ? "#22c55e" : "#d1d5db",
              }}
            />
          </motion.div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: room.maxPlayers - players.length }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-purple-800"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-purple-900" />
              <span className="text-sm text-gray-400 dark:text-purple-400">
                Waiting for player...
              </span>
            </div>
          ),
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {isHost ? (
          <>
            {players.length < room.maxPlayers && (
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleAddBot}
              >
                <Bot size={16} /> Add AI Bot
              </Button>
            )}
            <Button
              className={`w-full py-6 text-lg flex items-center justify-center gap-2 ${
                canStart
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-gray-200 dark:bg-purple-900/30 text-gray-400 cursor-not-allowed"
              }`}
              onClick={canStart ? handleStart : undefined}
              disabled={!canStart}
            >
              <Play size={20} />
              {players.length < 2 ? "Need 2+ Players" : "Start Game"}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="w-full py-6 text-lg"
            onClick={handleToggleReady}
          >
            {myPlayer?.isReady
              ? "✓ Ready! (click to unready)"
              : "Mark as Ready"}
          </Button>
        )}
      </div>

      {!isHost && (
        <p className="text-center text-sm mt-4 text-gray-500 dark:text-purple-400">
          Waiting for host to start the game...
        </p>
      )}
    </div>
  );
}
