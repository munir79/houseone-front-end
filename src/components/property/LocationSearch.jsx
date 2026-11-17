"use client";

import { useEffect, useState } from "react";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useLazyReversePlaceQuery, useSearchPlacesQuery } from "@/redux/features/location/locationApi";

const MIN_LENGTH = 3;
const DEBOUNCE_MS = 350;

// বাধ্যতামূলক — খোঁজা ও To-Let এ বাড়ি এই বিন্দু দিয়েই আসে; বাছলে জেলা ও এলাকাও আসে
const LocationSearch = ({ value, onChange, error }) => {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [reversePlace] = useLazyReversePlaceQuery();

  // প্রতি অক্ষরে নয়, থামলে তবেই খোঁজে
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const isSearching = term.length >= MIN_LENGTH;
  const { data, isFetching } = useSearchPlacesQuery(term, { skip: !isSearching || Boolean(value) });
  const results = data?.data?.results || [];
  const isUnavailable = data?.data?.unavailable;

  const pick = (place) => {
    onChange(place);
    setText("");
    setTerm("");
  };

  // GPS — বিন্দু থেকে জেলা ও এলাকা Server জানায়
  const locate = () => {
    if (!navigator.geolocation) return toast.error("এই browser-এ location নেই");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const place = (await reversePlace({ lat: coords.latitude, lng: coords.longitude }).unwrap()).data;
          pick({ ...place, label: place.label || "আমার লোকেশন" });
        } catch (err) {
          toast.error(getErrorMessage(err, "লোকেশন পাওয়া যায়নি"));
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        toast.error("Location পাওয়া যায়নি। Browser-এ Location চালু করুন, বা নাম লিখে খুঁজুন।");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60 * 1000 }
    );
  };

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">Map location</p>
        <div data-picked-location className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background pl-3">
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-sm wrap-break-word">{value.label || "Selected location"}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Change map location"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        id="locationSearch"
        label="Map location"
        placeholder="এলাকা, রোড বা জায়গার নাম লিখুন"
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={error}
        suffix={
          isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden="true" />
          ) : (
            <button type="button" onClick={locate} disabled={isLocating} aria-label="আমার লোকেশন" title="আমার লোকেশন" className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-soft disabled:opacity-60">
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
            </button>
          )
        }
      />

      {isSearching && !isFetching && isUnavailable && <p className="text-xs text-muted">ম্যাপ খোঁজা এখন কাজ করছে না। পাশের বোতামে নিজের লোকেশন দিন, বা একটু পরে চেষ্টা করুন।</p>}
      {isSearching && !isFetching && !isUnavailable && results.length === 0 && term === text.trim() && <p className="text-xs text-muted">কোনো জায়গা পাওয়া যায়নি। কাছের রোড বা বাজারের নাম লিখে দেখুন।</p>}

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`} className="border-b border-border last:border-b-0">
              <button type="button" data-place-pick onClick={() => pick(place)} className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary-soft">
                <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span className="min-w-0 wrap-break-word">{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted">Search data © OpenStreetMap contributors</p>
    </div>
  );
};

export default LocationSearch;
