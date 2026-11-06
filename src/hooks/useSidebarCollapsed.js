"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sidebarCollapsed";

const listeners = new Set();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => localStorage.getItem(STORAGE_KEY) === "true";

// পছন্দ Browser এ থাকে, তাই Page রিফ্রেশ করলেও Sidebar একই অবস্থায় থাকে
export const useSidebarCollapsed = () => {
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toggleSidebar = () => {
    localStorage.setItem(STORAGE_KEY, String(!getSnapshot()));
    listeners.forEach((listener) => listener());
  };

  return { isCollapsed, toggleSidebar };
};
