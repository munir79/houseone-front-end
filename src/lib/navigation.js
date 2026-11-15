import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Handshake,
  Home,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

// Sidebar ও BottomNav দুটোই এখান থেকে নেয়
// Module তৈরি হলে সেই Item থেকে soon: true সরিয়ে আসল href দিন
export const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/properties", icon: Home },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "Billing", href: "/billing", icon: ClipboardList },
  { label: "Receipts", href: "/receipts", icon: FileText },
  { label: "Shared Access", icon: Handshake, soon: true },
  { label: "To-Let Marketplace", icon: Megaphone, soon: true },
];

export const secondaryNav = [
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Reports", icon: BarChart3, soon: true },
  { label: "Notifications", icon: Bell, soon: true },
  { label: "Settings", icon: Settings, soon: true },
];

// মোবাইলে শুধু তৈরি হওয়া Menu দেখায়
export const navItems = [...mainNav, ...secondaryNav].filter((item) => !item.soon);

// বাড়ির বিস্তারিত Page এও Properties Menu চিহ্নিত থাকে
export const isNavActive = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`);
