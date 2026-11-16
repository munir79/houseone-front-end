"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import LocationSearch, { myPlace } from "./LocationSearch";
import RentRange, { RENT_MAX, RENT_MIN } from "./RentRange";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { LISTING_CATEGORIES, moveMonthOptions } from "@/lib/listingOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { API_BASE_URL } from "@/utils/url";

const RANGE_OPTIONS = [{ value: "", label: "যেকোনো দূরত্ব" }, ...[1, 2, 3, 5, 10, 15].map((km) => ({ value: String(km), label: `${toBanglaNumber(km)} কিমির মধ্যে` }))];

const placeFrom = (params) => {
  const [lat, lng] = (params.get("near") ?? "").split(",").map(Number);
  const box = (params.get("box") ?? "").split(",").map(Number);
  if (Number.isFinite(lat) && Number.isFinite(lng) && params.get("near")) {
    return { label: params.get("place") || "নির্বাচিত লোকেশন", lat, lng, box: box.length === 4 && box.every(Number.isFinite) ? box : null };
  }
  // "এলাকায় আরও" link — এলাকার নাম দিয়েই খোঁজা, না বদলালে
  return { label: params.get("area") ?? "", lat: null, lng: null, box: null, isArea: Boolean(params.get("area")) };
};

// তালিকা থেকে না বেছে শুধু লিখে "খুঁজুন" — Photon এর প্রথম মিলটা
const firstPlace = async (text) => {
  const response = await fetch(`${API_BASE_URL}location/public-search?q=${encodeURIComponent(text)}`);
  const body = await response.json().catch(() => null);
  const [place] = body?.data?.results ?? [];
  return place ? { label: place.label, lat: place.lat, lng: place.lng, box: place.box } : null;
};

const rentFrom = (params) => ({
  min: Math.min(Math.max(Number(params.get("min")) || RENT_MIN, RENT_MIN), RENT_MAX),
  max: Number(params.get("max")) > 0 ? Math.min(Number(params.get("max")), RENT_MAX) : RENT_MAX,
});

const currentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(myPlace(coords)),
      reject,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  });

// To-Let পাতার hero — কাচের মতো বাক্স; লোকেশন, ধরন, দূরত্ব, ভাড়ার সীমা, কবে থেকে
const ToLetSearch = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [place, setPlace] = useState(() => placeFrom(params));
  const [rent, setRent] = useState(() => rentFrom(params));
  const [values, setValues] = useState(() => ({ category: params.get("category") ?? "", km: params.get("km") ?? "", month: params.get("month") ?? "" }));
  const [isLocating, setIsLocating] = useState(false);
  const change = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    let point = place;
    const typed = point.label.trim();
    if (!point.lat && !point.isArea && (typed || values.km)) {
      setIsLocating(true);
      try {
        // লেখা আছে কিন্তু বাছা হয়নি — প্রথম মিল; কিছু লেখা নেই অথচ দূরত্ব বাছা — নিজের জায়গা
        point = typed ? await firstPlace(typed) : await currentPosition();
        if (!point) {
          toast.error(`"${typed}" পাওয়া যায়নি। অন্য নাম লিখে দেখুন।`);
          return;
        }
        setPlace(point);
      } catch {
        toast.error(typed ? "লোকেশন খোঁজা যায়নি। একটু পরে চেষ্টা করুন।" : "দূরত্ব দিয়ে খুঁজতে লোকেশন লিখুন, বা Browser-এ Location চালু করুন");
        return;
      } finally {
        setIsLocating(false);
      }
    }

    const next = new URLSearchParams();
    // রুম ও সাজানো নিচের সারি থেকে — সেগুলো থাকে
    ["bedrooms", "sort"].forEach((key) => params.get(key) && next.set(key, params.get(key)));
    Object.entries(values).forEach(([key, value]) => value && next.set(key, value));
    if (rent.min > RENT_MIN) next.set("min", String(rent.min));
    if (rent.max < RENT_MAX) next.set("max", String(rent.max));
    if (point.lat) {
      next.set("near", `${point.lat},${point.lng}`);
      next.set("place", point.label);
      // দূরত্ব বাছা না থাকলে জায়গার নিজের সীমানা
      if (!values.km && point.box) next.set("box", point.box.join(","));
      next.delete("sort");
    } else if (point.isArea && typed) {
      next.set("area", typed);
    }
    const query = next.toString();
    router.push(query ? `/to-let?${query}#results` : "/to-let#results");
  };

  return (
    <form
      data-tolet-search
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-2xl border border-sidebar-foreground/25 bg-sidebar-foreground/10 p-4 shadow-card backdrop-blur-md lg:grid-cols-4 lg:items-end [&_label]:text-sidebar-foreground"
    >
      <div className="col-span-2">
        <LocationSearch value={place} onChange={setPlace} />
      </div>
      <Select id="toLetCategory" label="ধরন" options={[{ value: "", label: "সব ধরন" }, ...LISTING_CATEGORIES]} value={values.category} onChange={change("category")} />
      <Select id="toLetRange" label="দূরত্ব" options={RANGE_OPTIONS} value={values.km} onChange={change("km")} />
      <div className="col-span-2 text-sidebar-foreground">
        <RentRange min={rent.min} max={rent.max} onChange={setRent} labelClassName="text-sm font-medium" />
      </div>
      <Select id="toLetMonth" label="কবে থেকে" options={[{ value: "", label: "যেকোনো সময়" }, ...moveMonthOptions()]} value={values.month} onChange={change("month")} />
      <Button type="submit" size="lg" className="self-end" isLoading={isLocating}>
        {!isLocating && <Search className="h-4 w-4" aria-hidden="true" />}
        খুঁজুন
      </Button>
    </form>
  );
};

export default ToLetSearch;
