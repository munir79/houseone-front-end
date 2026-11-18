"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { isSharedProperty, rememberWorld, worldOf } from "@/lib/navigation";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";

const PROPERTY_URL = /^\/properties\/([a-f0-9]{24})(?:\/|$)/;
// এই পাতাগুলো সব সম্পদের — এখানে কোনো সম্পদ বাছা থাকে না
export const OUTSIDE_PAGES = ["/dashboard", "/properties", "/shared", "/granted", "/market", "/markets"];
const MARKET_PAGES = ["/market", "/markets"];
// সব পাতায় একই query — একবারই আনা হয়
export const ALL_PROPERTIES = { page: 1, search: "", limit: 100 };

// শেষ যে সম্পদে ছিলেন — ভাড়াটিয়ার বিস্তারিত বা Settings এর মতো পাতায় সেই menu থাকে; reload এও থাকে
const LAST_KEY = "lastWorkspace";
const listeners = new Set();
let lastWorkspace;

const readLast = () => {
  if (lastWorkspace === undefined) {
    try {
      lastWorkspace = sessionStorage.getItem(LAST_KEY);
    } catch {
      lastWorkspace = null;
    }
  }
  return lastWorkspace;
};

const saveLast = (id) => {
  if (readLast() === id) return;
  lastWorkspace = id;
  try {
    sessionStorage.setItem(LAST_KEY, id);
  } catch {
    // storage বন্ধ থাকলে শুধু এই tab এর memory তে থাকে
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// কোন সম্পদের ভেতরে আছেন — URL থেকে; একটাই সম্পদ থাকলে সবসময় সেটা (Dashboard এর নিচে তার menu)
export const useWorkspace = () => {
  const pathname = usePathname();
  const { data, isLoading } = useGetPropertiesQuery(ALL_PROPERTIES);
  const { data: profile } = useGetMyProfileQuery();
  const last = useSyncExternalStore(subscribe, readLast, () => null);

  const all = data?.data?.data || [];
  const me = profile?.data?._id;
  const fromUrl = pathname.match(PROPERTY_URL)?.[1] ?? null;
  const isOutside = OUTSIDE_PAGES.includes(pathname);
  // কী ভাড়া দেন (স্বাগত পাতা বা Settings), অথবা যা আসলে আছে
  const assetTypes = profile?.data?.assetTypes ?? [];
  const hasMarket = assetTypes.includes("market") || all.some((house) => worldOf(house) === "market");
  const hasHouse = assetTypes.includes("house") || all.some((house) => worldOf(house) === "house");

  // কোন জগৎ — সম্পদের ভেতরে তার ধরন, বাইরে URL; শুধু মার্কেট থাকলে মার্কেট
  const urlProperty = all.find(({ _id }) => _id === fromUrl);
  const lastProperty = !isOutside ? all.find(({ _id }) => _id === last) : null;
  const world = urlProperty
    ? worldOf(urlProperty)
    : MARKET_PAGES.includes(pathname)
      ? "market"
      : lastProperty
        ? worldOf(lastProperty)
        : hasMarket && !hasHouse
          ? "market"
          : "house";
  // এই জগতের সম্পদ — switcher, "একটাই সম্পদ" এর হিসাব এগুলো দিয়ে
  const houses = all.filter((house) => worldOf(house) === world);
  const isSingle = houses.length === 1;

  useEffect(() => {
    if (fromUrl) saveLast(fromUrl);
  }, [fromUrl]);

  useEffect(() => {
    if (!isLoading) rememberWorld(world);
  }, [world, isLoading]);

  const workspaceId = fromUrl ?? (isSingle ? houses[0]._id : !isOutside && houses.some(({ _id }) => _id === last) ? last : null);

  return {
    workspaceId,
    property: all.find(({ _id }) => _id === workspaceId) ?? null,
    houses,
    me,
    isSingle,
    isOutside,
    hasShared: houses.some((house) => isSharedProperty(house) && !house.myAccess),
    hasGranted: houses.some(({ myAccess }) => !!myAccess),
    world,
    hasMarket,
    hasHouse,
    isLoading,
  };
};
