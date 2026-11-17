import { BarChart3, ClipboardList, DoorOpen, Handshake, Home, KeyRound, LayoutDashboard, Megaphone, Receipt, Settings, UserCheck, Users } from "lucide-react";

// একটা সম্পদের ভেতরের পাতা — /properties/id/billing
export const propertyPath = (id, section = "") => `/properties/${id}${section ? `/${section}` : ""}`;

// অংশীদারি — তৈরির সময় বাছা, বা পরে অংশীদার যোগ হয়েছে (owners এ পরিবারের অ্যাক্সেসও থাকে, তাই সংখ্যা নয়)
export const isSharedProperty = (property) => !!property?.isShared;

export const DASHBOARD_ITEM = { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true };

// বাইরে, কোনো সম্পদ বাছা নেই — শুধু সব সম্পদের চিত্র আর তালিকা
export const outsideNav = ({ hasShared = false, hasGranted = false } = {}) => [
  DASHBOARD_ITEM,
  { label: "আমার সম্পদ", href: "/properties", icon: Home },
  ...(hasShared ? [{ label: "অংশীদারি সম্পদ", href: "/shared", icon: Handshake }] : []),
  ...(hasGranted ? [{ label: "আমাকে দেওয়া সম্পদ", href: "/granted", icon: UserCheck }] : []),
];

// একটা সম্পদের ভেতরে — সব পাতা শুধু সেই সম্পদের; অংশীদারি menu অংশীদারি সম্পদে, অ্যাক্সেস একার সম্পদে মূল মালিকের
// myAccess — পরিবারের অ্যাক্সেসে দেখছেন, তখন সেটিং নেই
export const propertyNav = (id, { kind, isShared = false, isMain = false, myAccess = null } = {}) => [
  { label: "Overview", href: propertyPath(id), icon: LayoutDashboard, exact: true },
  { label: kind === "flats" ? "আমার ফ্ল্যাট" : "ইউনিট", href: propertyPath(id, "units"), icon: DoorOpen },
  { label: "ভাড়াটিয়া", href: propertyPath(id, "tenants"), icon: Users },
  { label: "বিল ও রসিদ", href: propertyPath(id, "billing"), icon: ClipboardList },
  { label: "খরচ", href: propertyPath(id, "expenses"), icon: Receipt },
  { label: "রিপোর্ট", href: propertyPath(id, "reports"), icon: BarChart3 },
  { label: "To-Let", href: propertyPath(id, "listings"), icon: Megaphone },
  ...(isShared ? [{ label: "অংশীদারি", href: propertyPath(id, "sharing"), icon: Handshake }] : []),
  ...(!isShared && isMain ? [{ label: "অ্যাক্সেস", href: propertyPath(id, "access"), icon: KeyRound }] : []),
  ...(myAccess ? [] : [{ label: "সেটিং", href: propertyPath(id, "settings"), icon: Settings }]),
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
  "/access": "পরিবারের অ্যাক্সেস",
  "/settings": "Settings",
};

// Overview শুধু নিজের পাতায়; বাকিগুলো ভেতরের পাতাতেও (ইউনিট → ইউনিটের পাতা)
export const isNavActive = (pathname, item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
