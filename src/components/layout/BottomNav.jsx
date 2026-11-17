"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Ellipsis } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/hooks/useWorkspace";
import { DASHBOARD_ITEM, hasMembersOf, isNavActive, isSharedProperty, outsideNav, propertyNav } from "@/lib/navigation";

// নিচের Bar এ ৪টি প্রধান + More — বেশি হলে নাম জড়িয়ে যায়
const MAIN_COUNT = 4;

const itemClasses = (isActive) => cn("flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold", isActive ? "text-primary" : "text-muted");

const ItemIcon = ({ icon: Icon, isActive }) => (
  <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", isActive && "bg-primary-soft")}>
    <Icon className="h-5 w-5" aria-hidden="true" />
  </span>
);

const BottomNav = () => {
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState(null);
  const { workspaceId, property, me, isSingle, hasShared, hasGranted } = useWorkspace();
  // ভেতরে থাকলে সেই সম্পদের menu, More এ Dashboard আর "সব সম্পদ" এ ফেরা
  const navItems = workspaceId
    ? [
        ...propertyNav(workspaceId, { kind: property?.kind, isShared: isSharedProperty(property), isMain: !!me && property?.owner === me, myAccess: property?.myAccess, hasMembers: hasMembersOf(property) }),
        DASHBOARD_ITEM,
        ...(isSingle ? [] : [{ label: "সব সম্পদ", href: "/properties", icon: ArrowLeft, exact: true }]),
      ]
    : outsideNav({ hasShared, hasGranted });

  const hasMore = navItems.length > MAIN_COUNT + 1;
  const mainItems = hasMore ? navItems.slice(0, MAIN_COUNT) : navItems;
  const moreItems = hasMore ? navItems.slice(MAIN_COUNT) : [];
  const isMoreActive = moreItems.some((item) => isNavActive(pathname, item));
  // পেজ বদলালে নিজে থেকেই বন্ধ — যে পেজে খোলা হয়েছিল শুধু সেখানেই খোলা থাকে
  const isMoreOpen = openedAt === pathname;

  return (
    <>
      {isMoreOpen && <button type="button" aria-label="Close menu" onClick={() => setOpenedAt(null)} className="fixed inset-0 z-30 bg-foreground/20 md:hidden" />}
      {isMoreOpen && (
        <div id="more-menu" data-more-menu className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-3 shadow-card md:hidden">
          {moreItems.map((item) => {
            const { label, href, icon } = item;
            const isActive = isNavActive(pathname, item);
            return (
              <Link key={href} href={href} aria-current={isActive ? "page" : undefined} onClick={() => setOpenedAt(null)} className={cn(itemClasses(isActive), "rounded-xl hover:bg-background")}>
                <ItemIcon icon={icon} isActive={isActive} />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {mainItems.map((item) => {
          const { label, href, icon } = item;
          const isActive = isNavActive(pathname, item);
          return (
            <Link key={href} href={href} aria-current={isActive ? "page" : undefined} className={itemClasses(isActive)}>
              <ItemIcon icon={icon} isActive={isActive} />
              {label}
            </Link>
          );
        })}
        {hasMore && (
          <button
            type="button"
            aria-expanded={isMoreOpen}
            aria-controls="more-menu"
            onClick={() => setOpenedAt(isMoreOpen ? null : pathname)}
            className={itemClasses(isMoreActive || isMoreOpen)}
          >
            <ItemIcon icon={Ellipsis} isActive={isMoreActive || isMoreOpen} />
            More
          </button>
        )}
      </nav>
    </>
  );
};

export default BottomNav;
