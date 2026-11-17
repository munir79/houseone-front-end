"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/authStorage";

// Login করা User কে Login/Register Page এ না রেখে Dashboard এ পাঠানো
const GuestGuard = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  return children;
};

export default GuestGuard;
