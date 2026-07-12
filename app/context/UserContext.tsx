"use client";

import { createContext, useContext } from "react";
import { Id } from "@/convex/_generated/dataModel";

export interface UserType {
  _id: Id<"users">;
  _creationTime: number;
  clerkId: string;
  email: string;
  name: string;
  imageUrl?: string;
  role: "admin" | "user";
  createdAt: number;
}

export const UserContext = createContext<UserType | null>(null);

export const useUserContext = () => {
  const context = useContext(UserContext);
  return context;
};
