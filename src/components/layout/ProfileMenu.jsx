"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Home, KeyRound, LogOut, Settings, Store } from "lucide-react";
import { toast } from "sonner";
import PropertyFormModal from "@/components/property/PropertyFormModal";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { WORLD_ROLE, homeOf, switchWorld, propertyPath } from "@/lib/navigation";
import { useUpdateProfileMutation } from "@/redux/features/account/accountApi";

const WORLDS = [
  { value: "house", label: "বাড়ি", icon: Home },
  { value: "market", label: "মার্কেট", icon: Store },
];

const itemClass = "mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-primary-soft";

const ProfileMenu = ({ user, onLogout }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingMarket, setIsAddingMarket] = useState(false);
  const containerRef = useRef(null);
  const { world, hasMarket, hasHouse, isLoading } = useWorkspace();
  const [updateProfile] = useUpdateProfileMutation();

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

  // নতুন জগৎ চালু — বাসা-বাড়ি বা মার্কেট; আগেরটা থেকে যায়
  const startWorld = async (next) => {
    setIsOpen(false);
    try {
      await updateProfile({ assetTypes: [...new Set([...(user?.assetTypes ?? []), next])] }).unwrap();
    } catch (err) {
      return toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    }
    if (next === "market") setIsAddingMarket(true);
    else switchWorld(next);
  };

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
          {/* এখন কোন জগতে — বাড়ি না মার্কেট */}
          <span data-world-role className="block truncate text-xs text-muted">
            {WORLD_ROLE[world]}
          </span>
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

          {/* দুটোই থাকলে — কোন জগৎ দেখছেন, এক চাপে বদল */}
          {hasMarket && hasHouse && (
            <nav aria-label="বাড়ি বা মার্কেট" data-world-switch className="border-b border-border py-1">
              <p className="px-3 pt-1 text-xs font-semibold text-muted">এখন দেখছেন</p>
              {WORLDS.map(({ value, label, icon: Icon }) => {
                const isActive = world === value;
                return (
                  <Link
                    key={value}
                    href={homeOf(value)}
                    data-world={value}
                    aria-current={isActive ? "page" : undefined}
                    onClick={(event) => {
                      // অন্য জগতে — পুরো পাতা নতুন করে; একই জগতে শুধু তার Dashboard
                      setIsOpen(false);
                      if (isActive) return;
                      event.preventDefault();
                      switchWorld(value);
                    }}
                    className={cn(itemClass, isActive && "bg-primary-soft font-semibold text-primary")}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {isActive && <Check className="h-4 w-4" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
          )}

          <Link href="/settings" onClick={() => setIsOpen(false)} className={itemClass}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
          <Link href="/access" data-family-access onClick={() => setIsOpen(false)} className={itemClass}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            পরিবারের অ্যাক্সেস
          </Link>
          {!isLoading && !hasMarket && (
            <button type="button" data-start-market onClick={() => startWorld("market")} className={itemClass}>
              <Store className="h-4 w-4" aria-hidden="true" />
              মার্কেট চালু করুন
            </button>
          )}
          {!isLoading && !hasHouse && (
            <button type="button" data-start-house onClick={() => startWorld("house")} className={itemClass}>
              <Home className="h-4 w-4" aria-hidden="true" />
              বাড়ি চালু করুন
            </button>
          )}
          <button type="button" onClick={onLogout} className={itemClass}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
      {isAddingMarket && <PropertyFormModal kind="market" onClose={() => setIsAddingMarket(false)} onSaved={(saved) => saved?._id && router.push(propertyPath(saved._id, "units"))} />}
    </div>
  );
};

export default ProfileMenu;
