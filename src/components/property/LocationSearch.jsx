"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import Input from "@/components/ui/Input";
import { useSearchPlacesQuery } from "@/redux/features/location/locationApi";

const MIN_LENGTH = 3;
const DEBOUNCE_MS = 350;

// ঐচ্ছিক — Photon বন্ধ থাকলেও বাড়ি যোগ করা যায়
const LocationSearch = ({ value, onChange }) => {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");

  // প্রতি অক্ষরে নয়, থামলে তবেই খোঁজে
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const isSearching = term.length >= MIN_LENGTH;
  const { data, isFetching } = useSearchPlacesQuery(term, { skip: !isSearching || Boolean(value) });
  const results = data?.data?.results || [];
  const isUnavailable = data?.data?.unavailable;

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">Map location</p>
        <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background pl-3">
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-sm wrap-break-word">{value.label || "Selected location"}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove map location"
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
        label="Map location (optional)"
        placeholder="রোড বা জায়গার নাম লিখুন"
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        suffix={isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden="true" /> : null}
      />

      {isSearching && !isFetching && isUnavailable && (
        <p className="text-xs text-muted">ম্যাপ খোঁজা এখন কাজ করছে না। পরে যোগ করতে পারবেন।</p>
      )}
      {isSearching && !isFetching && !isUnavailable && results.length === 0 && term === text.trim() && (
        <p className="text-xs text-muted">কোনো জায়গা পাওয়া যায়নি। এই ঘর খালি রাখলেও চলবে।</p>
      )}

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  onChange(place);
                  setText("");
                  setTerm("");
                }}
                className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary-soft"
              >
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
