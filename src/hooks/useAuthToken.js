"use client";

import { useSyncExternalStore } from "react";
import { getToken } from "@/lib/authStorage";

const subscribe = () => () => {};

// Server এ localStorage নেই, তাই প্রথমে null, Browser এ আসল Token
export const useAuthToken = () => useSyncExternalStore(subscribe, getToken, () => null);
