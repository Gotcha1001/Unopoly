// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useUser } from "@clerk/nextjs";
// import { useQuery, useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import { WaitingRoom } from "@/app/components/WaitingRoom";
// import { GameBoard } from "@/app/components/Gameboard";
// import { WinScreen } from "@/app/components/Winscreen";

// export default function GamePage() {
//   const { gameId } = useParams();
//   const { user, isLoaded } = useUser();
//   const router = useRouter();

//   // Cast the URL param to a Convex Id
//   const roomId = gameId as Id<"rooms">;

//   const room = useQuery(api.rooms.getRoom, { roomId });
//   const players = useQuery(api.rooms.getRoomPlayers, { roomId });
//   const game = useQuery(api.game.getGame, { roomId });

//   if (!isLoaded || room === undefined) {
//     return <div>Loading...</div>;
//   }

//   // Room not found
//   if (room === null) {
//     router.push("/lobby");
//     return null;
//   }

//   // Redirect unauthenticated users
//   if (!user) {
//     router.push("/");
//     return null;
//   }

//   // Game finished — show win screen
//   if (game?.status === "finished" && game.winnerId) {
//     const winner = players?.find((p) => p.userId === game.winnerId);
//     return (
//       <WinScreen
//         winnerName={winner?.name ?? "Unknown"}
//         isWinner={game.winnerId === user.id}
//         roomId={roomId}
//         currentUserId={user.id}
//         // Final cash/property standings for the leaderboard table.
//         players={players}
//         // onPlayAgain: no router.push needed — resetRoom sets room.status back
//         // to "waiting" and Convex reactivity re-renders into <WaitingRoom>
//         // automatically.
//         onPlayAgain={() => {}}
//       />
//     );
//   }

//   // Game active — show board
//   if (room.status === "playing" && game && players) {
//     return (
//       <GameBoard
//         room={room}
//         game={game}
//         players={players}
//         currentUserId={user.id}
//       />
//     );
//   }

//   // Room waiting — show waiting room
//   if (players) {
//     return (
//       <WaitingRoom room={room} players={players} currentUserId={user.id} />
//     );
//   }

//   return <div>Loading room...</div>;
// }

"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { WaitingRoom } from "@/app/components/WaitingRoom";
import { GameBoard } from "@/app/components/Gameboard";
import { WinScreen } from "@/app/components/Winscreen";

export default function GamePage() {
  const { gameId } = useParams();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Cast the URL param to a Convex Id
  const roomId = gameId as Id<"rooms">;

  const room = useQuery(api.rooms.getRoom, { roomId });
  const players = useQuery(api.rooms.getRoomPlayers, { roomId });
  const game = useQuery(api.game.getGame, { roomId });

  if (!isLoaded || room === undefined) {
    return <div>Loading...</div>;
  }

  // Room not found
  if (room === null) {
    router.push("/lobby");
    return null;
  }

  // Redirect unauthenticated users
  if (!user) {
    router.push("/");
    return null;
  }

  // Game finished — show win screen. Gate on `players` too, not just
  // game/winnerId — WinScreen's standings table needs the live money/
  // properties/savings/shares off the players query, and rendering it one
  // tick early with players still `undefined` would just show an empty
  // table for a frame instead of nothing.
  if (game?.status === "finished" && game.winnerId && players) {
    const winner = players.find((p) => p.userId === game.winnerId);
    return (
      <WinScreen
        winnerName={winner?.name ?? "Unknown"}
        isWinner={game.winnerId === user.id}
        roomId={roomId}
        currentUserId={user.id}
        // Final cash/property standings for the leaderboard table.
        players={players}
        // No router.push needed here — resetRoom (called inside WinScreen's
        // own handlePlayAgain) flips room.status back to "waiting" and
        // deletes the finished game doc. That alone makes `game` above
        // become undefined/non-"finished" and `room.status` fall out of
        // "playing", so this component's own branches below re-derive
        // straight into <WaitingRoom> on the next reactive render — no
        // imperative navigation required. This callback is intentionally
        // a no-op; it exists only to satisfy WinScreen's optional prop.
        onPlayAgain={() => {}}
      />
    );
  }

  // Game active — show board
  if (room.status === "playing" && game && players) {
    return (
      <GameBoard
        room={room}
        game={game}
        players={players}
        currentUserId={user.id}
      />
    );
  }

  // Room waiting — show waiting room
  if (players) {
    return (
      <WaitingRoom room={room} players={players} currentUserId={user.id} />
    );
  }

  return <div>Loading room...</div>;
}
