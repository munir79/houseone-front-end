"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isNavActive, navItems } from "@/lib/navigation";

const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = isNavActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
              isActive ? "text-primary" : "text-muted"
            )}
          >
            <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", isActive && "bg-primary-soft")}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
