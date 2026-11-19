import { BarChart3, Briefcase, ClipboardList, DoorOpen, Handshake, History, Home, KeyRound, LayoutDashboard, Megaphone, Receipt, Settings, Store, UserCheck, Users } from "lucide-react";

// একটা সম্পদের ভেতরের পাতা — /properties/id/billing
export const propertyPath = (id, section = "") => `/properties/${id}${section ? `/${section}` : ""}`;

// owners এ মালিক ছাড়া আর কেউ (অংশীদার বা পরিবারের অ্যাক্সেস) — Activity দেখানোর কারণ
export const hasMembersOf = (property) => (property?.owners?.length ?? 1) > 1;

// অংশীদারি — তৈরির সময় বাছা, বা পরে অংশীদার যোগ হয়েছে (owners এ পরিবারের অ্যাক্সেসও থাকে, তাই সংখ্যা নয়)
export const isSharedProperty = (property) => !!property?.isShared;

// বাড়ি আর মার্কেট — আলাদা জগৎ, নিজের Dashboard আর তালিকা
export const MARKET_HOME = "/market";
export const worldOf = (property) => (property?.kind === "market" ? "market" : "house");
// সম্পদের ধরন — বাংলায়, header আর card এ
export const kindLabel = (kind) => (kind === "market" ? "মার্কেট" : kind === "flats" ? "অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট" : "পুরো বাড়ি");
const LAST_WORLD_KEY = "lastWorld";
export const rememberWorld = (world) => {
  try {
    localStorage.setItem(LAST_WORLD_KEY, world);
  } catch {
    // storage বন্ধ — শুধু এবার মনে থাকে না
  }
};
// শেষ বাছা জগৎ — profile এর toggle বা যে সম্পদে ঢুকলেন
export const rememberedWorld = () => {
  try {
    const world = localStorage.getItem(LAST_WORLD_KEY);
    return world === "market" || world === "house" ? world : null;
  } catch {
    return null;
  }
};

// জগৎ বদল — পুরো পাতা নতুন করে, আগের জগতের পুরনো তথ্য Cache এ থাকে না
export const switchWorld = (world) => {
  rememberWorld(world);
  window.location.assign(homeOf(world));
};

// login এর পর কোথায় — শেষবার মার্কেটে থাকলে মার্কেটের Dashboard
export const landingPath = () => {
  try {
    return localStorage.getItem(LAST_WORLD_KEY) === "market" ? MARKET_HOME : "/dashboard";
  } catch {
    return "/dashboard";
  }
};
export const WORLD_ROLE = { house: "বাড়ির মালিক", market: "মার্কেট মালিক" };

export const homeOf = (world) => (world === "market" ? MARKET_HOME : "/dashboard");

export const DASHBOARD_ITEM = { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true };
export const dashboardItem = (world = "house") => ({ ...DASHBOARD_ITEM, href: homeOf(world) });

// বাইরে, কোনো সম্পদ বাছা নেই — শুধু সব সম্পদের চিত্র আর তালিকা
export const outsideNav = ({ world = "house", hasShared = false, hasGranted = false } = {}) => {
  if (world === "market") return [dashboardItem("market"), { label: "আমার মার্কেট", href: "/markets", icon: Store }];
  return [
    DASHBOARD_ITEM,
    { label: "আমার সম্পদ", href: "/properties", icon: Home },
    ...(hasShared ? [{ label: "অংশীদারি সম্পদ", href: "/shared", icon: Handshake }] : []),
    ...(hasGranted ? [{ label: "আমাকে দেওয়া সম্পদ", href: "/granted", icon: UserCheck }] : []),
  ];
};

// একটা সম্পদের ভেতরে — সব পাতা শুধু সেই সম্পদের; অংশীদারি menu অংশীদারি সম্পদে, অ্যাক্সেস একার সম্পদে মূল মালিকের
// myAccess — পরিবারের অ্যাক্সেসে দেখছেন, তখন সেটিং নেই; hasMembers — অংশীদার বা পরিবারের কেউ আছেন, তখন Activity
export const propertyNav = (id, { kind, isShared = false, isMain = false, myAccess = null, hasMembers = false } = {}) => [
  { label: "Overview", href: propertyPath(id), icon: LayoutDashboard, exact: true },
  { label: kind === "market" ? "দোকান" : kind === "flats" ? "আমার ফ্ল্যাট" : "ইউনিট", href: propertyPath(id, "units"), icon: kind === "market" ? Store : DoorOpen },
  { label: kind === "market" ? "ব্যবসায়ী" : "ভাড়াটিয়া", href: propertyPath(id, "tenants"), icon: kind === "market" ? Briefcase : Users },
  { label: "বিল ও রসিদ", href: propertyPath(id, "billing"), icon: ClipboardList },
  { label: "খরচ", href: propertyPath(id, "expenses"), icon: Receipt },
  { label: "রিপোর্ট", href: propertyPath(id, "reports"), icon: BarChart3 },
  { label: "To-Let", href: propertyPath(id, "listings"), icon: Megaphone },
  ...(isShared ? [{ label: "অংশীদারি", href: propertyPath(id, "sharing"), icon: Handshake }] : []),
  ...(!isShared && isMain ? [{ label: "অ্যাক্সেস", href: propertyPath(id, "access"), icon: KeyRound }] : []),
  ...(hasMembers ? [{ label: "Activity", href: propertyPath(id, "activity"), icon: History }] : []),
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
