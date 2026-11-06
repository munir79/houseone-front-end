"use client";

import { useEffect } from "react";
import { disconnectSocket, initSocket } from "./socket";

/**
 * Login করা অংশে Socket চালু রাখে, বের হলে বন্ধ করে
 */
const SocketProvider = ({ token, children }) => {
  useEffect(() => {
    if (!token) return;

    initSocket(token);
    return () => disconnectSocket();
  }, [token]);

  return children;
};

export default SocketProvider;
