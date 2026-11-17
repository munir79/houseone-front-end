"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Headset } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/hooks/useWorkspace";
import { DASHBOARD_ITEM, isNavActive, isSharedProperty, outsideNav, propertyNav, propertyPath } from "@/lib/navigation";

const NavItem = ({ label, href, icon: Icon, soon, isActive, isCollapsed }) => {
  const classes = cn(
    "flex min-h-11 items-center gap-2.5 rounded-xl text-sm font-semibold text-sidebar-foreground",
    isCollapsed ? "justify-center" : "px-2.5"
  );

  // তৈরি না হওয়া Menu — চাপা যায় না, যাতে কেউ খালি Page এ না যায়
  if (soon) {
    return (
      <div
        aria-disabled="true"
        title={isCollapsed ? `${label} (coming soon)` : undefined}
        className={cn(classes, "cursor-not-allowed text-sidebar-foreground/60")}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {isCollapsed ? (
          <span className="sr-only">{label}</span>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <span className="shrink-0 text-xs font-medium">Soon</span>
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
        isActive ? "bg-linear-to-r from-sidebar-accent/30 to-sidebar-accent/10 ring-1 ring-sidebar-accent/50" : "hover:bg-sidebar-foreground/10"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!isCollapsed && label}
    </Link>
  );
};

// একটা সম্পদের ভেতরে — কোন সম্পদ, আর অন্যটায় সরাসরি যাওয়া
const WorkspaceHeader = ({ property, houses, isSingle, isCollapsed }) => {
  const router = useRouter();
  if (isCollapsed) {
    return (
      <Link href={isSingle ? propertyPath(property._id) : "/properties"} title={isSingle ? property.name : "সব সম্পদ"} aria-label={isSingle ? property.name : "সব সম্পদ"} className="flex min-h-11 items-center justify-center rounded-xl text-sidebar-foreground hover:bg-sidebar-foreground/10">
        {isSingle ? <Building2 className="h-5 w-5" aria-hidden="true" /> : <ArrowLeft className="h-5 w-5" aria-hidden="true" />}
      </Link>
    );
  }
  return (
    <div data-workspace-header className="flex flex-col gap-1.5 px-1">
      {!isSingle && (
        <Link href="/properties" className="inline-flex min-h-9 w-fit items-center gap-1 px-1.5 text-xs font-semibold text-sidebar-foreground/80 hover:text-sidebar-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          সব সম্পদ
        </Link>
      )}
      {houses.length > 1 ? (
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-sidebar-foreground/20 bg-sidebar-foreground/10 px-2.5">
          <Building2 className="h-5 w-5 shrink-0 text-sidebar-accent" aria-hidden="true" />
          <span className="sr-only">সম্পদ বদলান</span>
          <select data-workspace-switch value={property._id} onChange={(e) => router.push(propertyPath(e.target.value))} className="min-w-0 flex-1 truncate bg-transparent text-sm font-bold text-sidebar-foreground outline-none [&>option]:text-foreground">
            {houses.map(({ _id, name }) => (
              <option key={_id} value={_id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="flex min-h-11 items-center gap-2 rounded-xl bg-sidebar-foreground/10 px-2.5 text-sm font-bold text-sidebar-foreground">
          <Building2 className="h-5 w-5 shrink-0 text-sidebar-accent" aria-hidden="true" />
          <span className="truncate">{property.name}</span>
        </p>
      )}
    </div>
  );
};

const Sidebar = ({ isCollapsed }) => {
  const pathname = usePathname();
  const { workspaceId, property, houses, isSingle, hasShared } = useWorkspace();
  const items = workspaceId ? propertyNav(workspaceId, { kind: property?.kind, isShared: isSharedProperty(property) }) : outsideNav({ hasShared });

  const renderItems = (list) =>
    list.map((item) => <NavItem key={item.href} {...item} isActive={isNavActive(pathname, item)} isCollapsed={isCollapsed} />);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 isolate z-30 hidden flex-col gap-3 overflow-hidden bg-sidebar p-3 transition-[width] duration-200 md:flex",
        isCollapsed ? "w-20" : "w-68"
      )}
    >
      <Image src="/images/dashboard/sidenavbar.jpg" alt="" fill sizes="900px" className="-z-20 object-cover object-[72%_100%]" />
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-sidebar via-sidebar/80 to-sidebar/10" />

      <Link href="/dashboard" aria-label="Go to dashboard" className={cn("w-fit pt-2 pb-1", isCollapsed ? "self-center" : "px-2")}>
        <Logo showTagline light iconOnly={isCollapsed} />
      </Link>

      {/* ছোট Screen এ Menu নিজেই Scroll হয় */}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none]">
        {workspaceId && property && (
          <>
            {/* সম্পদের ভেতরেও Dashboard এ ফেরা সবসময় এক চাপে */}
            <NavItem {...DASHBOARD_ITEM} isActive={isNavActive(pathname, DASHBOARD_ITEM)} isCollapsed={isCollapsed} />
            <hr className="my-2 border-sidebar-foreground/10" />
            <WorkspaceHeader property={property} houses={houses} isSingle={isSingle} isCollapsed={isCollapsed} />
            <hr className="my-2 border-sidebar-foreground/10" />
          </>
        )}
        {renderItems(items)}
      </nav>

      {!isCollapsed && (
        <>
          <div className="hidden rounded-2xl border border-sidebar-foreground/15 bg-sidebar/70 p-3.5 backdrop-blur-sm [@media(min-height:760px)]:block">
            <p className="text-base font-bold text-sidebar-foreground">Grow Your Rental Business</p>
            <p className="mt-0.5 text-sm text-sidebar-foreground/85">Unlock unlimited features for your properties.</p>
            <p className="mt-2.5 rounded-xl bg-linear-to-r from-accent to-accent-strong px-3 py-2 text-center text-sm font-bold text-accent-foreground">
              Plans Coming Soon
            </p>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl bg-sidebar/70 p-3 backdrop-blur-sm [@media(min-height:900px)]:flex">
            <Headset className="h-6 w-6 shrink-0 text-sidebar-accent" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground">Need Help?</p>
              <p className="text-xs text-sidebar-foreground/85">Support is coming soon.</p>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
