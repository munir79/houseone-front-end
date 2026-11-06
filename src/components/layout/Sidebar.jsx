"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset, Rocket } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { isNavActive, mainNav, secondaryNav } from "@/lib/navigation";

const NavItem = ({ label, href, icon: Icon, soon, isActive, isCollapsed }) => {
  const classes = cn(
    "flex min-h-10 items-center gap-2.5 rounded-xl text-sm font-medium text-sidebar-foreground",
    isCollapsed ? "justify-center" : "px-2.5"
  );

  // তৈরি না হওয়া Menu — চাপা যায় না, যাতে কেউ খালি Page এ না যায়
  if (soon) {
    return (
      <div
        aria-disabled="true"
        title={isCollapsed ? `${label} (coming soon)` : undefined}
        className={cn(classes, "cursor-not-allowed text-sidebar-foreground/40")}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {isCollapsed ? (
          <span className="sr-only">{label}</span>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <span className="shrink-0 text-[10px]">Soon</span>
          </>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      aria-label={isCollapsed ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        classes,
        "transition-colors",
        isActive ? "bg-sidebar-foreground/15" : "hover:bg-sidebar-foreground/10"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!isCollapsed && label}
    </Link>
  );
};

const Sidebar = ({ isCollapsed }) => {
  const pathname = usePathname();

  const renderItems = (items) =>
    items.map((item) => (
      <NavItem key={item.label} {...item} isActive={isNavActive(pathname, item.href)} isCollapsed={isCollapsed} />
    ));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col gap-3 bg-linear-to-b from-sidebar to-sidebar-end p-3 transition-[width] duration-200 md:flex",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <Link href="/" aria-label="Go to home page" className={cn("w-fit pt-2 pb-1", isCollapsed ? "self-center" : "px-2")}>
        <Logo showTagline light iconOnly={isCollapsed} />
      </Link>

      {/* ছোট Screen এ Menu নিজেই Scroll হয় */}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none]">
        {renderItems(mainNav)}
        <hr className="my-2 border-sidebar-foreground/10" />
        {renderItems(secondaryNav)}
      </nav>

      {!isCollapsed && (
        <>
          <div className="hidden rounded-2xl bg-sidebar-foreground/10 p-3 text-center [@media(min-height:760px)]:block">
            <Rocket className="mx-auto h-6 w-6 text-sidebar-accent" aria-hidden="true" />
            <p className="mt-1 text-sm font-semibold text-sidebar-foreground">Upgrade to Premium</p>
            <p className="mt-0.5 text-xs text-sidebar-foreground/70">Unlock unlimited features for your properties.</p>
            <p className="mt-2 rounded-xl bg-sidebar-foreground px-3 py-2 text-xs font-semibold text-sidebar">
              Plans Coming Soon
            </p>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl bg-sidebar-foreground/10 p-3 [@media(min-height:840px)]:flex">
            <Headset className="h-6 w-6 shrink-0 text-sidebar-accent" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground">Need Help?</p>
              <p className="text-xs text-sidebar-foreground/70">Support is coming soon.</p>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
