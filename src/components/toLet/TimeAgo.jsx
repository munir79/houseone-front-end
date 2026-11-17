"use client";

import { useSyncExternalStore } from "react";
import { banglaDate } from "@/lib/listingOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const TICK_MS = 30 * 1000;
// এর পরে "কত আগে" নয়, তারিখ
const RELATIVE_DAYS = 7;

// আধা মিনিট পরপর নতুন সময় — সব TimeAgo একটাই ঘড়ি ভাগ করে
const subscribe = (onChange) => {
  const timer = setInterval(onChange, TICK_MS);
  return () => clearInterval(timer);
};
const clientNow = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;
// Server এ সময় জানা নেই — তারিখ দেখায়, Browser এ এসে "কত আগে"
const serverNow = () => null;

export const timeAgo = (date, now) => {
  const seconds = Math.max(0, Math.floor((now - new Date(date).getTime()) / 1000));
  if (seconds < 60) return `${toBanglaNumber(Math.max(seconds, 1))} সেকেন্ড আগে`;
  if (seconds < 60 * 60) return `${toBanglaNumber(Math.floor(seconds / 60))} মিনিট আগে`;
  if (seconds < 24 * 60 * 60) return `${toBanglaNumber(Math.floor(seconds / 3600))} ঘণ্টা আগে`;
  const days = Math.floor(seconds / 86400);
  if (days <= RELATIVE_DAYS) return `${toBanglaNumber(days)} দিন আগে`;
  return banglaDate(date);
};

// "৫ ঘণ্টা আগে" — বিজ্ঞাপন দেওয়া বা আবার চালু করার সময় থেকে
const TimeAgo = ({ date, prefix = "", className }) => {
  const now = useSyncExternalStore(subscribe, clientNow, serverNow);
  // আধা মিনিটের ঘড়ি একটু পিছিয়ে থাকে — এইমাত্র দেওয়াটা timeAgo নিজেই "১ সেকেন্ড" ধরে
  const text = now === null ? banglaDate(date) : timeAgo(date, now);
  return (
    <time dateTime={new Date(date).toISOString()} title={banglaDate(date)} className={className} data-time-ago>
      {prefix}
      {text}
    </time>
  );
};

export default TimeAgo;
