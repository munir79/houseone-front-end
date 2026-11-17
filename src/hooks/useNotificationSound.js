"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "notificationSound";

let audioContext = null;

// কোনো Sound File ছাড়া Browser দিয়েই ছোট শব্দ বানানো হয়
const playBeep = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ??= new AudioContextClass();
  // User এখনো Page এ চাপ না দিলে Browser শব্দ আটকে রাখে — তখন শুধু চুপচাপ বাদ যায়
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
};

export const useNotificationSound = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== "off");

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      localStorage.setItem(STORAGE_KEY, prev ? "off" : "on");
      return !prev;
    });
  }, []);

  const playSound = useCallback(() => {
    if (isSoundEnabled) playBeep();
  }, [isSoundEnabled]);

  return { playSound, isSoundEnabled, toggleSound };
};
