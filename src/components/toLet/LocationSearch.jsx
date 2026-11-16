"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { API_BASE_URL } from "@/utils/url";

const MIN_LENGTH = 3;
const DEBOUNCE_MS = 400;
export const MY_LOCATION = "আমার লোকেশন";
const MY_BOX_KM = 2;
const KM_PER_DEGREE = 111;

// নিজের জায়গার চারপাশ — দূরত্ব না বাছলে এর ভেতরের বিজ্ঞাপন
export const myPlace = ({ latitude, longitude }) => {
  const lat = Number(latitude.toFixed(4));
  const lng = Number(longitude.toFixed(4));
  const dLat = MY_BOX_KM / KM_PER_DEGREE;
  const dLng = MY_BOX_KM / (KM_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
  const box = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((value) => Number(value.toFixed(4)));
  return { label: MY_LOCATION, lat, lng, box };
};

// বাংলাদেশের যেকোনো জায়গা — লিখলে Photon থেকে, বাছলে lat/lng; GPS বোতামে নিজের জায়গা
const LocationSearch = ({ value, onChange }) => {
  const listId = useId();
  const boxRef = useRef(null);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  // link থেকে আগে বসানো নাম দিয়ে নিজে থেকে খোঁজে না — লিখলে তবেই
  const [hasTyped, setHasTyped] = useState(false);

  const text = value.label;
  const shouldSearch = hasTyped && !value.lat && text.trim().length >= MIN_LENGTH && text !== MY_LOCATION;

  // থেমে লেখার পরে একবার — আগের অনুরোধ বাতিল
  useEffect(() => {
    if (!shouldSearch) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`${API_BASE_URL}location/public-search?q=${encodeURIComponent(text.trim())}`, { signal: controller.signal });
        const body = await response.json();
        setResults(body.data?.results ?? []);
        setUnavailable(Boolean(body.data?.unavailable) || !response.ok);
        setActive(-1);
        setIsOpen(true);
      } catch (err) {
        if (err.name !== "AbortError") setUnavailable(true);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, shouldSearch]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event) => !boxRef.current?.contains(event.target) && setIsOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  const pick = (place) => {
    onChange({ label: place.label, lat: place.lat, lng: place.lng, box: place.box });
    setIsOpen(false);
  };

  const locate = () => {
    if (!navigator.geolocation) return toast.error("এই browser-এ location নেই");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        onChange(myPlace(coords));
      },
      () => {
        setIsLocating(false);
        toast.error("Location পাওয়া যায়নি। Browser-এ Location চালু করুন।");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const handleKey = (event) => {
    if (!isOpen || results.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      pick(results[active]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showList = isOpen && shouldSearch && !isSearching;

  return (
    <div ref={boxRef} className="relative flex flex-col gap-1.5">
      <label htmlFor="toLetPlace" className="text-sm font-medium text-foreground">
        লোকেশন
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="toLetPlace"
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="এলাকা, রাস্তা বা জায়গার নাম"
          value={text}
          onChange={(event) => {
            setHasTyped(true);
            onChange({ label: event.target.value, lat: null, lng: null });
          }}
          onFocus={() => results.length > 0 && shouldSearch && setIsOpen(true)}
          onKeyDown={handleKey}
          className="min-h-11 w-full rounded-xl border border-border bg-surface pr-12 pl-9 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary-soft md:min-h-10"
        />
        <button
          type="button"
          onClick={locate}
          aria-label="আমার লোকেশন"
          title="আমার লোকেশন"
          className={cn("absolute top-1/2 right-1 flex h-9 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-primary hover:bg-primary-soft", value.label === MY_LOCATION && value.lat && "bg-primary-soft")}
        >
          {isLocating || isSearching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {showList && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-card">
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted">{unavailable ? "এখন খোঁজা যাচ্ছে না, একটু পরে চেষ্টা করুন" : "কিছু পাওয়া যায়নি"}</li>
          ) : (
            results.map((place, index) => (
              <li
                key={`${place.lat},${place.lng},${index}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                data-place-option
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => pick(place)}
                className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm", index === active ? "bg-primary-soft" : "hover:bg-background")}
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span className="min-w-0 wrap-break-word">{place.label}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
