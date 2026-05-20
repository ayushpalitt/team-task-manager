"use client";

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth-store";

let socket: Socket | null = null;

const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://team-task-manager-ne5e.onrender.com"
    : "http://localhost:5000");

export const getSocket = () => {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  if (!socket) {
    socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"]
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
