"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const ProfileMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Account menu"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-11 items-center gap-2 rounded-xl p-1 text-left transition-colors hover:bg-primary-soft md:pr-2"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {user?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </span>
        <span className="hidden max-w-40 min-w-0 md:block">
          <span className="block truncate text-sm font-semibold">{user?.name}</span>
          <span className="block truncate text-xs text-muted capitalize">{user?.role}</span>
        </span>
        <ChevronDown
          className={cn("hidden h-4 w-4 shrink-0 text-muted transition-transform md:block", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-surface p-1.5 shadow-card">
          <div className="border-b border-border px-3 py-2">
            <p className="text-sm font-semibold wrap-break-word">{user?.name}</p>
            <p className="text-xs wrap-break-word text-muted">{user?.email}</p>
          </div>
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-primary-soft"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-primary-soft"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
