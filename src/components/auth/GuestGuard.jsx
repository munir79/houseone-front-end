"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authStorage";
import { landingPath } from "@/lib/navigation";

// Login করা User কে Login/Register Page এ না রেখে Dashboard এ পাঠানো
const GuestGuard = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) router.replace(landingPath());
  }, [router]);

  return children;
};

export default GuestGuard;
