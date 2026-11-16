import { getToken } from "./authStorage";
import { visitorId } from "./listingOptions";
import { PUBLIC_LISTING, PUBLIC_LISTINGS } from "@/utils/url";

// To-Let পাতা — Login ছাড়াই, তাই RTK Query নয়; Server পাতা এক মিনিট মনে রাখে
const REVALIDATE_SECONDS = 60;
const SEARCH_KEYS = ["category", "city", "area", "min", "max", "bedrooms", "month", "sort", "near", "km", "after"];

// URL এর খোঁজা থেকে শুধু চেনা ঘরগুলো — অন্য কিছু API তে যায় না
export const searchQuery = (params) => {
  const query = new URLSearchParams();
  SEARCH_KEYS.forEach((key) => {
    const value = typeof params.get === "function" ? params.get(key) : params[key];
    if (typeof value === "string" && value) query.set(key, value);
  });
  return query.toString();
};

const readJson = async (response) => {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return body.data;
};

// fresh — Browser থেকে "আরও দেখুন"; Server এর পাতা এক মিনিট মনে রাখে
export const fetchListings = async (query, { fresh = false } = {}) =>
  readJson(await fetch(`${PUBLIC_LISTINGS}${query ? `?${query}` : ""}`, fresh ? { cache: "no-store" } : { next: { revalidate: REVALIDATE_SECONDS } }));

// না পাওয়া গেলে null — পাতা 404 দেখায়; সবসময় তাজা, যাতে ভাড়া হয়ে যাওয়া বিজ্ঞাপন খোলা না দেখায়
export const fetchListing = async (code) => {
  const response = await fetch(PUBLIC_LISTING(code), { cache: "no-store" });
  if (response.status === 404) return null;
  return readJson(response);
};

// login থাকলে Token যায়, যাতে মালিক নিজে দেখলে গোনা না হয়
const viewerHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const id = visitorId();
  const token = getToken();
  if (id) headers["X-Visitor-Id"] = id;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const trackListing = (code, kind) =>
  fetch(`${PUBLIC_LISTING(code)}/hit`, { method: "POST", headers: viewerHeaders(), body: JSON.stringify({ kind }), keepalive: true }).catch(() => null);

export const revealContact = async (code) => readJson(await fetch(`${PUBLIC_LISTING(code)}/contact`, { method: "POST", headers: viewerHeaders(), body: "{}" }));

export const reportListing = async (code, body) => readJson(await fetch(`${PUBLIC_LISTING(code)}/report`, { method: "POST", headers: viewerHeaders(), body: JSON.stringify(body) }));
