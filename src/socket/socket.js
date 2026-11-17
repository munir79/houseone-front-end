import { socketUri } from "@/utils/url";
import { io } from "socket.io-client";

let socket = null;
let socketToken = null;

// Socket তৈরির আগেও Listener যোগ করা যায় — তৈরি হলে এখান থেকে লেগে যায়
const listeners = new Map();

/**
 * Socket Initialize করা
 * JWT token পাঠাচ্ছি auth-এর জন্য
 */
export const initSocket = (token) => {
  if (socket && socketToken === token) return socket;

  disconnectSocket();

  socket = io(socketUri, {
    auth: { token },
    transports: ["websocket", "polling"], // সরাসরি WebSocket — দ্রুত যুক্ত হয়
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  socketToken = token;

  listeners.forEach((handlers, event) => {
    handlers.forEach((handler) => socket.on(event, handler));
  });

  return socket;
};

/**
 * Event শোনা — ফেরত দেওয়া Function চালালে শোনা বন্ধ হয়
 */
export const onSocketEvent = (event, handler) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  socket?.on(event, handler);

  return () => {
    listeners.get(event).delete(handler);
    socket?.off(event, handler);
  };
};

/**
 * Socket disconnect করা
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};
