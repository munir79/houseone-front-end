"use client";

import { useEffect, useRef } from "react";
import { onSocketEvent } from "./socket";

export const useSocketEvent = (eventName, handler) => {
  // ✅ সবসময় সর্বশেষ handler চলে, পুরোনো State দেখে না
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => onSocketEvent(eventName, (...args) => handlerRef.current(...args)), [eventName]);
};
