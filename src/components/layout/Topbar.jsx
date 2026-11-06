"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "@/components/notification/NotificationBell";
import Logo from "@/components/ui/Logo";

const Topbar = ({ user, onLogout, isCollapsed, onToggleSidebar }) => {
  const ToggleIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2 md:px-6">
      <Link href="/" aria-label="Go to home page" className="md:hidden">
        <Logo />
      </Link>

      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-primary-soft"
        >
          <ToggleIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <ProfileMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Topbar;
