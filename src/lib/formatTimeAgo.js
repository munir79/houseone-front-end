import { BD_TIME_ZONE } from "./bdTime";

export const formatTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: BD_TIME_ZONE });
};
