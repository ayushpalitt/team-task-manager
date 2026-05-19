"use client";

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth-store";

let socket: Socket | null = null;

export const getSocket = () => {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
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
