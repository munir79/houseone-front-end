import { BarChart3, ClipboardList, DoorOpen, Handshake, Home, LayoutDashboard, Megaphone, Receipt, Settings, Users } from "lucide-react";

// একটা সম্পদের ভেতরের পাতা — /properties/id/billing
export const propertyPath = (id, section = "") => `/properties/${id}${section ? `/${section}` : ""}`;

// অংশীদারি — তৈরির সময় বাছা, বা পরে অংশীদার যোগ হয়েছে
export const isSharedProperty = (property) => !!property && (property.isShared || (property.owners?.length ?? 1) > 1);

export const DASHBOARD_ITEM = { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true };

// বাইরে, কোনো সম্পদ বাছা নেই — শুধু সব সম্পদের চিত্র আর তালিকা
export const outsideNav = ({ hasShared = false } = {}) => [
  DASHBOARD_ITEM,
  { label: "আমার সম্পদ", href: "/properties", icon: Home },
  ...(hasShared ? [{ label: "অংশীদারি সম্পদ", href: "/shared", icon: Handshake }] : []),
];

// একটা সম্পদের ভেতরে — সব পাতা শুধু সেই সম্পদের; অংশীদারি menu শুধু অংশীদারি সম্পদে
export const propertyNav = (id, { kind, isShared = false } = {}) => [
  { label: "Overview", href: propertyPath(id), icon: LayoutDashboard, exact: true },
  { label: kind === "flats" ? "আমার ফ্ল্যাট" : "ইউনিট", href: propertyPath(id, "units"), icon: DoorOpen },
  { label: "ভাড়াটিয়া", href: propertyPath(id, "tenants"), icon: Users },
  { label: "বিল ও রসিদ", href: propertyPath(id, "billing"), icon: ClipboardList },
  { label: "খরচ", href: propertyPath(id, "expenses"), icon: Receipt },
  { label: "রিপোর্ট", href: propertyPath(id, "reports"), icon: BarChart3 },
  { label: "To-Let", href: propertyPath(id, "listings"), icon: Megaphone },
  ...(isShared ? [{ label: "অংশীদারি", href: propertyPath(id, "sharing"), icon: Handshake }] : []),
  { label: "সেটিং", href: propertyPath(id, "settings"), icon: Settings },
];

// সব সম্পদের পাতা — menu তে নেই, link বা notification থেকে আসে
export const GLOBAL_PAGES = {
  "/billing": "Billing",
  "/receipts": "Receipts",
  "/expenses": "Expenses",
  "/reports": "সব সম্পদের রিপোর্ট",
  "/tenants": "Tenants",
  "/listings": "To-Let Marketplace",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

// Overview শুধু নিজের পাতায়; বাকিগুলো ভেতরের পাতাতেও (ইউনিট → ইউনিটের পাতা)
export const isNavActive = (pathname, item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
