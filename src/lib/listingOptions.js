import { BD_TIME_ZONE, bdDateInput } from "./bdTime";
import { districtLabel } from "./districts";
import { formatMoney } from "./formatMoney";
import { toBanglaNumber } from "./toBanglaNumber";

const BANGLA_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const MONTHS_AHEAD = 6;
const VISITOR_KEY = "houseone.visitor";

// খোঁজার ধরন — Backend এর categories এর সাথে মেলে
export const LISTING_CATEGORIES = [
  { value: "Family", label: "ফ্যামিলি" },
  { value: "Bachelor", label: "ব্যাচেলর" },
  { value: "Room", label: "রুম / সাবলেট" },
  { value: "Office", label: "অফিস" },
  { value: "Shop", label: "দোকান" },
  { value: "Garage", label: "গ্যারেজ" },
];

export const categoryLabel = (value) => LISTING_CATEGORIES.find((item) => item.value === value)?.label ?? value;

export const RENT_STEPS = [5000, 8000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5].map((number) => ({ value: String(number), label: number === 5 ? "৫+ রুম" : `${toBanglaNumber(number)} রুম` }));

export const SORT_OPTIONS = [
  { value: "new", label: "নতুন আগে" },
  { value: "rentLow", label: "কম ভাড়া আগে" },
  { value: "rentHigh", label: "বেশি ভাড়া আগে" },
  { value: "popular", label: "জনপ্রিয় আগে" },
];

export const CONTACT_MODE_OPTIONS = [
  { value: "both", label: "কল ও WhatsApp" },
  { value: "call", label: "শুধু কল" },
  { value: "whatsapp", label: "শুধু WhatsApp" },
];

export const LISTING_STATUS = {
  Active: { label: "চালু", variant: "success" },
  Paused: { label: "বন্ধ রাখা", variant: "warning" },
  Expired: { label: "মেয়াদ শেষ", variant: "danger" },
  Closed: { label: "বন্ধ", variant: "info" },
};

export const CLOSED_REASONS = { Rented: "ভাড়া হয়ে গেছে", Removed: "ফ্ল্যাট মোছা হয়েছে", NoRent: "ভাড়া লেখা নেই", Owner: "আপনি বন্ধ করেছেন" };

export const REPORT_REASONS = [
  { value: "Rented", label: "ভাড়া হয়ে গেছে, এখনো দেখাচ্ছে" },
  { value: "Wrong", label: "ভুল তথ্য বা ছবি" },
  { value: "Fraud", label: "প্রতারণা বা দালাল" },
  { value: "Other", label: "অন্য কিছু" },
];

// ফ্ল্যাটের ধরন থেকে — Backend এর categoriesOf এর মতোই
export const unitCategories = ({ type, preferredTenant }) => {
  if (["Shop", "Office", "Garage"].includes(type)) return [type];
  if (type === "Room") return preferredTenant === "Family" ? ["Room", "Family"] : ["Office", "Shop"].includes(preferredTenant) ? ["Room"] : ["Room", "Bachelor"];
  if (["Office", "Shop", "Family", "Bachelor"].includes(preferredTenant)) return [preferredTenant];
  return ["Family", "Bachelor"];
};

// "৩ রুমের ফ্যামিলি ফ্ল্যাট", "দোকান"
export const listingTitle = ({ categories = [], unitType, bedrooms }) => {
  const [first] = categories;
  if (first === "Office") return "অফিস স্পেস";
  if (first === "Shop") return "দোকান";
  if (first === "Garage") return "গ্যারেজ / পার্কিং";
  if (unitType === "Room") return categories.includes("Family") ? "ফ্যামিলির জন্য রুম" : "রুম / সাবলেট";
  const rooms = bedrooms ? `${toBanglaNumber(bedrooms)} রুমের ` : "";
  const who = categories.length > 1 ? "" : first === "Family" ? "ফ্যামিলি " : "ব্যাচেলর ";
  return `${rooms}${who}ফ্ল্যাট`;
};

// To-Let modal এ "কার জন্য" — ফ্ল্যাটের ধরন অনুযায়ী
export const audienceOptions = (unitType) => {
  if (["Shop", "Office", "Garage"].includes(unitType)) return [];
  if (unitType === "Room") {
    return [
      { value: "Family", label: "ফ্যামিলি" },
      { value: "Bachelor", label: "ব্যাচেলর" },
      { value: "Any", label: "দুটোই" },
    ];
  }
  return [
    { value: "Family", label: "শুধু ফ্যামিলি" },
    { value: "Bachelor", label: "শুধু ব্যাচেলর" },
    { value: "Any", label: "ফ্যামিলি ও ব্যাচেলর" },
    { value: "Office", label: "অফিস" },
  ];
};

export const BACHELOR_GENDER_OPTIONS = [
  { value: "", label: "যেকোনো" },
  { value: "Male", label: "শুধু পুরুষ" },
  { value: "Female", label: "শুধু মহিলা" },
];

const bachelorWord = (gender) => (gender === "Male" ? "পুরুষ ব্যাচেলর" : gender === "Female" ? "মহিলা ব্যাচেলর" : "ব্যাচেলর");

// "শুধু ফ্যামিলি", "শুধু মহিলা ব্যাচেলর", "ফ্যামিলি ও ব্যাচেলর" — card এ
export const audienceText = ({ categories = [], bachelorGender = "" }) => {
  const family = categories.includes("Family");
  const bachelor = categories.includes("Bachelor");
  if (family && bachelor) return `ফ্যামিলি ও ${bachelorWord(bachelorGender)}`;
  if (family) return "শুধু ফ্যামিলি";
  if (bachelor) return `শুধু ${bachelorWord(bachelorGender)}`;
  return null;
};

// বিজ্ঞাপনের পাতায় ✓ ও ✕ — কাদের দেওয়া হয়, কাদের হয় না
export const audienceRules = ({ categories = [], bachelorGender = "" }) => {
  if (!categories.some((item) => item === "Family" || item === "Bachelor")) return [];
  const family = categories.includes("Family");
  const bachelor = categories.includes("Bachelor");
  return [
    { ok: family, text: family ? "ফ্যামিলি ভাড়া দেওয়া হয়" : "ফ্যামিলি ভাড়া দেওয়া হয় না" },
    { ok: bachelor, text: bachelor ? `${bachelorGender ? "শুধু " : ""}${bachelorWord(bachelorGender)} ভাড়া দেওয়া হয়` : "ব্যাচেলর ভাড়া দেওয়া হয় না" },
  ];
};

export const floorText = (floor, totalFloors) => {
  if (floor == null) return null;
  const name = floor === 0 ? "নিচতলা" : `${toBanglaNumber(floor)} তলা`;
  return totalFloors ? `${name} (${toBanglaNumber(totalFloors)} তলার মধ্যে)` : name;
};

export const banglaDate = (date) => {
  const [year, month, day] = bdDateInput(date).split("-").map(Number);
  return `${toBanglaNumber(day)} ${BANGLA_MONTHS[month - 1]} ${toBanglaNumber(year)}`;
};

export const availableText = (date) => (!date || bdDateInput(date) <= bdDateInput() ? "এখনই খালি" : `${banglaDate(date)} থেকে`);

export const monthName = (month) => {
  const [year, number] = month.split("-").map(Number);
  return `${BANGLA_MONTHS[number - 1]} ${toBanglaNumber(year)}`;
};

// এই মাস থেকে সামনের কয়েক মাস — "কবে থেকে লাগবে"
export const moveMonthOptions = () => {
  const [year, month] = bdDateInput().split("-").map(Number);
  return Array.from({ length: MONTHS_AHEAD }, (_, index) => {
    const value = new Date(Date.UTC(year, month - 1 + index, 1)).toISOString().slice(0, 7);
    return { value, label: monthName(value) };
  });
};

export const daysLeft = (date) => Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

export const timeText = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  const label = new Date(Date.UTC(2000, 0, 1, hour, minute)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  return label.replace(":00", "");
};

export const distanceText = (meters) => (meters < 1000 ? `${toBanglaNumber(Math.max(100, Math.round(meters / 100) * 100))} মিটার দূরে` : `${toBanglaNumber((meters / 1000).toFixed(1))} কিমি দূরে`);

// Cloudinary থেকে ঠিক মাপে কেটে — Facebook ও WhatsApp এর ছবির জন্য
export const croppedPhoto = (url, width, height) => url?.replace("/upload/", `/upload/c_fill,g_auto,w_${width},h_${height},f_jpg,q_auto/`);

export const listingPath = ({ slug }) => `/to-let/${slug}`;

// "শেওড়াপাড়া, Mirpur, Dhaka · ঢাকা" — পাড়া, এলাকা, জেলা
export const placeText = ({ locality, area, city }) => [locality, area, districtLabel(city)].filter(Boolean).join(", ");

export const formatPhone = (phone) => `${phone.slice(0, 5)}-${phone.slice(5)}`;

export const whatsappLink = (phone, text) => `https://wa.me/88${phone}?text=${encodeURIComponent(text)}`;

export const contactMessage = (listing, url) =>
  `আসসালামু আলাইকুম, HouseOne-এ আপনার ${listing.area}-এর ${listingTitle(listing)}টি (${formatMoney(listing.rent)}) দেখলাম। এটা কি এখনো খালি আছে?\n${url}`;

export const listingShareText = (listing) => `${listingTitle(listing)} ভাড়া · ${listing.area}, ${listing.city} · ${formatMoney(listing.rent)}/মাস`;

// এই browser এর গোপন id — একজন বারবার দেখলেও একবার গোনার জন্য; জমা না থাকলে পাঠানো হয় না
export const visitorId = () => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

export const LISTING_TIME_ZONE = BD_TIME_ZONE;
