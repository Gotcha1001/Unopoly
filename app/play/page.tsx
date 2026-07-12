// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useUser } from "@clerk/nextjs";
// import { useMutation, useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { useRouter } from "next/navigation";
// import { motion } from "framer-motion";
// import { WaitingRoom } from "@/app/components/WaitingRoom";
// import { GameBoard } from "../components/Gameboard";
// import { useSoundManager } from "@/hooks/useSoundManager";

// type Stage = "creating" | "ready" | "error";

// export default function PlayPage() {
//   const { user, isLoaded } = useUser();
//   const router = useRouter();

//   const createRoom = useMutation(api.rooms.createRoom);
//   const addBot = useMutation(api.rooms.addBot);
//   const startGame = useMutation(api.game.startGame);
//   const leaveRoom = useMutation(api.rooms.leaveRoom);

//   const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
//   const [stage, setStage] = useState<Stage>("creating");
//   const [errorMsg, setErrorMsg] = useState("");

//   // Prevent double-run in React Strict Mode
//   const didRun = useRef(false);

//   // Sound
//   const { play } = useSoundManager();
//   const prevGameStatus = useRef<string>("active");

//   const room = useQuery(api.rooms.getRoom, roomId ? { roomId } : "skip");
//   const players = useQuery(
//     api.rooms.getRoomPlayers,
//     roomId ? { roomId } : "skip",
//   );
//   const game = useQuery(api.game.getGame, roomId ? { roomId } : "skip");

//   useEffect(() => {
//     if (!isLoaded || !user || didRun.current) return;
//     didRun.current = true;

//     async function setup() {
//       try {
//         // 1. Create a private room
//         const newRoomId = await createRoom({
//           name: `${user!.firstName ?? "Player"}'s Solo Game`,
//           hostId: user!.id,
//           hostName: user!.firstName ?? user!.username ?? "Player",
//           avatarUrl: user!.imageUrl,
//           maxPlayers: 2,
//         });

//         // 2. Add 1 bot
//         await addBot({ roomId: newRoomId, requesterId: user!.id });

//         // 3. Start immediately
//         await startGame({ roomId: newRoomId, requesterId: user!.id });

//         setRoomId(newRoomId);
//         setStage("ready");
//       } catch (e: unknown) {
//         setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
//         setStage("error");
//       }
//     }

//     setup();
//   }, [isLoaded, user, createRoom, addBot, startGame]);

//   // Play win/lose sound when the game finishes
//   useEffect(() => {
//     if (!game || !user) return;
//     if (prevGameStatus.current !== "finished" && game.status === "finished") {
//       if (game.winnerId === user.id) {
//         play("win");
//       } else {
//         play("lose");
//       }
//     }
//     prevGameStatus.current = game.status ?? "active";
//   }, [game?.status, game?.winnerId, user?.id, play]);

//   // Rematch — clean up old room and reboot
//   const handleRematch = async () => {
//     if (roomId && user) {
//       try {
//         await leaveRoom({ roomId, userId: user.id });
//       } catch {
//         // Room may already be gone
//       }
//     }
//     setRoomId(null);
//     setStage("creating");
//     prevGameStatus.current = "active"; // reset so sound fires again on next game
//     didRun.current = false;
//   };

//   // Not signed in
//   if (isLoaded && !user) {
//     router.push("/");
//     return null;
//   }

//   // Error state
//   if (stage === "error") {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
//         <div className="text-5xl">⚠️</div>
//         <p className="text-xl font-semibold text-black dark:text-white">
//           Couldn&apos;t start the game
//         </p>
//         <p className="text-gray-500 dark:text-purple-300 text-sm">{errorMsg}</p>
//         <button
//           onClick={() => {
//             didRun.current = false;
//             setStage("creating");
//           }}
//           className="mt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   // Creating / waiting for Convex data
//   if (stage === "creating" || !room || !players || !game || !user) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center gap-6">
//         <motion.div
//           className="flex gap-3"
//           animate={{ opacity: [0.4, 1, 0.4] }}
//           transition={{ duration: 1.4, repeat: Infinity }}
//         >
//           {["🔴", "🔵", "🟡", "🟢"].map((card, i) => (
//             <motion.span
//               key={i}
//               className="text-4xl"
//               animate={{ y: [0, -12, 0] }}
//               transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
//             >
//               {card}
//             </motion.span>
//           ))}
//         </motion.div>
//         <p className="text-gray-500 dark:text-purple-300 text-lg font-medium">
//           Setting up your game...
//         </p>
//       </div>
//     );
//   }

//   // Win / loss screen with rematch
//   if (game.status === "finished" && game.winnerId) {
//     const winner = players.find((p) => p.userId === game.winnerId);
//     const isWinner = game.winnerId === user.id;

//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-indigo-950 px-4">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ type: "spring", stiffness: 200 }}
//           className="text-center"
//         >
//           <motion.div
//             className="text-8xl mb-6"
//             animate={{ rotate: [0, -10, 10, -10, 0] }}
//             transition={{ duration: 0.6, delay: 0.3 }}
//           >
//             {isWinner ? "🏆" : "😔"}
//           </motion.div>

//           <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-3">
//             {isWinner ? "You Win!" : "You Lost!"}
//           </h1>

//           <p className="text-lg text-gray-600 dark:text-purple-300 mb-8">
//             {isWinner
//               ? "You beat the bot — impressive!"
//               : `${winner?.name ?? "The bot"} won this round.`}
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button
//               onClick={handleRematch}
//               className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all"
//             >
//               🔄 Play Again
//             </button>
//             <button
//               onClick={() => router.push("/lobby")}
//               className="px-8 py-3 rounded-xl border border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 font-semibold text-lg transition-all"
//             >
//               Back to Lobby
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   // Active game
//   if (room.status === "playing") {
//     return (
//       <GameBoard
//         room={room}
//         game={game}
//         players={players}
//         currentUserId={user.id}
//       />
//     );
//   }

//   // Fallback (shouldn't normally be reached)
//   return <WaitingRoom room={room} players={players} currentUserId={user.id} />;
// }
"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WaitingRoom } from "@/app/components/WaitingRoom";
import { GameBoard } from "../components/Gameboard";
import { useSoundManager } from "@/hooks/useSoundManager";

type Stage = "creating" | "ready" | "error";

export default function PlayPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const createRoom = useMutation(api.rooms.createRoom);
  const addBot = useMutation(api.rooms.addBot);
  const startGame = useMutation(api.game.startGame);
  const leaveRoom = useMutation(api.rooms.leaveRoom);

  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [stage, setStage] = useState<Stage>("creating");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryKey, setRetryKey] = useState(0); // ← increments to re-trigger setup

  // Prevent double-run in React Strict Mode
  const didRun = useRef(false);

  // Sound
  const { play } = useSoundManager();
  const prevGameStatus = useRef<string>("active");

  const room = useQuery(api.rooms.getRoom, roomId ? { roomId } : "skip");
  const players = useQuery(
    api.rooms.getRoomPlayers,
    roomId ? { roomId } : "skip",
  );
  const game = useQuery(api.game.getGame, roomId ? { roomId } : "skip");

  // Setup effect — retryKey in deps so rematch re-fires it
  useEffect(() => {
    if (!isLoaded || !user || didRun.current) return;
    didRun.current = true;

    async function setup() {
      try {
        const newRoomId = await createRoom({
          name: `${user!.firstName ?? "Player"}'s Solo Game`,
          hostId: user!.id,
          hostName: user!.firstName ?? user!.username ?? "Player",
          avatarUrl: user!.imageUrl,
          maxPlayers: 2,
        });

        await addBot({ roomId: newRoomId, requesterId: user!.id });
        await startGame({ roomId: newRoomId, requesterId: user!.id });

        setRoomId(newRoomId);
        setStage("ready");
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
        setStage("error");
      }
    }

    setup();
  }, [isLoaded, user, createRoom, addBot, startGame, retryKey]); // ← retryKey here

  // Win / lose sound when game finishes
  useEffect(() => {
    if (!game || !user) return;
    if (prevGameStatus.current !== "finished" && game.status === "finished") {
      if (game.winnerId === user.id) {
        play("win");
      } else {
        play("lose");
      }
    }
    prevGameStatus.current = game.status ?? "active";
  }, [game?.status, game?.winnerId, user?.id, play]);

  // Rematch — clean up old room and reboot
  const handleRematch = async () => {
    if (roomId && user) {
      try {
        await leaveRoom({ roomId, userId: user.id });
      } catch {
        // Room may already be gone
      }
    }
    setRoomId(null);
    setStage("creating");
    prevGameStatus.current = "active";
    didRun.current = false;
    setRetryKey((k) => k + 1); // ← this triggers the setup effect to re-run
  };

  // Not signed in
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  // Error state
  if (stage === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">⚠️</div>
        <p className="text-xl font-semibold text-black dark:text-white">
          Couldn&apos;t start the game
        </p>
        <p className="text-gray-500 dark:text-purple-300 text-sm">{errorMsg}</p>
        <button
          onClick={() => {
            didRun.current = false;
            setRetryKey((k) => k + 1);
            setStage("creating");
          }}
          className="mt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Creating / waiting for Convex data
  if (stage === "creating" || !room || !players || !game || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <motion.div
          className="flex gap-3"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          {["🔴", "🔵", "🟡", "🟢"].map((card, i) => (
            <motion.span
              key={i}
              className="text-4xl"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
            >
              {card}
            </motion.span>
          ))}
        </motion.div>
        <p className="text-gray-500 dark:text-purple-300 text-lg font-medium">
          Setting up your game...
        </p>
      </div>
    );
  }

  // Win / loss screen with rematch
  if (game.status === "finished" && game.winnerId) {
    const winner = players.find((p) => p.userId === game.winnerId);
    const isWinner = game.winnerId === user.id;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-indigo-950 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isWinner ? "🏆" : "😔"}
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-3">
            {isWinner ? "You Win!" : "You Lost!"}
          </h1>

          <p className="text-lg text-gray-600 dark:text-purple-300 mb-8">
            {isWinner
              ? "You beat the bot — impressive!"
              : `${winner?.name ?? "The bot"} won this round.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRematch}
              className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all"
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => router.push("/lobby")}
              className="px-8 py-3 rounded-xl border border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 font-semibold text-lg transition-all"
            >
              Back to Lobby
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active game
  if (room.status === "playing") {
    return (
      <GameBoard
        room={room}
        game={game}
        players={players}
        currentUserId={user.id}
      />
    );
  }

  // Fallback
  return <WaitingRoom room={room} players={players} currentUserId={user.id} />;
}
