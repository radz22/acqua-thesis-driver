import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/constants";
import { authClient } from "@/lib/auth-client";

export function connectAppSocket(): Socket {
  const cookie = authClient.getCookie();
  return io(API_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    extraHeaders: cookie ? { cookie } : {},
    auth: cookie ? { cookie } : {},
  });
}

export const connectDriverSocket = connectAppSocket;
