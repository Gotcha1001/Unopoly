// "use client";

// import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { useUserContext } from "../context/UserContext";
// import { ThemeToggle } from "./ThemeToggle";
// import { SidebarTrigger } from "@/components/ui/sidebar";

// export default function Navbar() {
//   const user = useUserContext();

//   return (
//     <motion.nav
//       className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gradient-to-r dark:from-purple-900 dark:via-purple-950 dark:to-indigo-950 border-gray-200 dark:border-purple-800 shadow-sm dark:shadow-purple-900/50"
//       initial={{ y: -40, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//       transition={{ duration: 0.4 }}
//     >
//       <SidebarTrigger className="md:hidden mr-2" />
//       <Link
//         href="/"
//         className="text-xl font-bold text-black dark:text-white tracking-tight"
//       >
//         🃏 UNO Arena
//       </Link>

//       <div className="flex items-center gap-3">
//         <SignedOut>
//           <Link href="/sign-in">
//             <Button
//               variant="ghost"
//               className="text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
//             >
//               Sign In
//             </Button>
//           </Link>
//           <Link href="/sign-up">
//             <Button className="bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-500 dark:hover:bg-purple-600">
//               Sign Up
//             </Button>
//           </Link>
//         </SignedOut>

//         <SignedIn>
//           <Link href="/lobby">
//             <Button
//               variant="ghost"
//               className="text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
//             >
//               Lobby
//             </Button>
//           </Link>
//           <Link href="/dashboard">
//             <Button
//               variant="ghost"
//               className="text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
//             >
//               Dashboard
//             </Button>
//           </Link>
//           {user?.role === "admin" && (
//             <Link href="/admin">
//               <Button
//                 variant="ghost"
//                 className="text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
//               >
//                 Admin
//               </Button>
//             </Link>
//           )}
//           <ThemeToggle />
//           <UserButton afterSignOutUrl="/" />
//         </SignedIn>
//       </div>
//     </motion.nav>
//   );
// }

"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUserContext } from "../context/UserContext";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Navbar() {
  const user = useUserContext();

  return (
    <motion.nav
      className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b bg-white dark:bg-gradient-to-r dark:from-purple-900 dark:via-purple-950 dark:to-indigo-950 border-gray-200 dark:border-purple-800 shadow-sm dark:shadow-purple-900/50"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        <SidebarTrigger className="md:hidden mr-1 shrink-0" />
        <Link
          href="/"
          className="text-base sm:text-xl font-bold text-black dark:text-white tracking-tight truncate"
        >
          🃏 <span className="hidden xs:inline sm:inline">UNOPOLY</span>
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar">
        <SignedOut>
          <Link href="/sign-in">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-4 text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-4 bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-500 dark:hover:bg-purple-600"
            >
              Sign Up
            </Button>
          </Link>
        </SignedOut>

        <SignedIn>
          <Link href="/lobby">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-4 text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
            >
              Lobby
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="hidden xs:inline-flex text-xs sm:text-sm px-2 sm:px-4 text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
            >
              Dashboard
            </Button>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-4 text-gray-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300"
              >
                Admin
              </Button>
            </Link>
          )}
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </motion.nav>
  );
}
