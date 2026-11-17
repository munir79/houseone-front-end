"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Loader2, SearchX } from "lucide-react";
import ListingCard from "./ListingCard";
import { buttonClasses } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import { fetchListings } from "@/lib/publicListing";

const STORE_KEY = "houseone.toLetResults";

// "আরও দেখুন" আসলে link — Google পরের বিজ্ঞাপন পড়তে পারে; চাপলে পাতা না বদলে নিচে জোড়ে
const nextHref = (query, next) => {
  const params = new URLSearchParams(query);
  params.set("after", next);
  return `/to-let?${params.toString()}`;
};

// বিজ্ঞাপন খুলে Back চাপলে আগের মতো — এই খোঁজার তালিকা কিছুক্ষণ মনে থাকে
const noSubscribe = () => () => {};
const readRaw = () => {
  try {
    return sessionStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
};
const parseSaved = (raw, query) => {
  try {
    const saved = JSON.parse(raw);
    return saved?.query === query && Array.isArray(saved.items) ? saved : null;
  } catch {
    return null;
  }
};

const save = (value) => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    // জায়গা না থাকলে শুধু মনে থাকে না
  }
};

const ListingResults = ({ data, meta, query }) => {
  // Server এ কিছু মনে থাকে না — hydration এর পরে Browser এর মনে রাখা তালিকা
  const raw = useSyncExternalStore(noSubscribe, readRaw, () => null);
  const saved = useMemo(() => parseSaved(raw, query), [raw, query]);
  const [loaded, setLoaded] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  // Server এর প্রথম ১২টার চেয়ে বেশি দেখা হয়ে থাকলে সেগুলো ফেরত
  const list = loaded ?? (saved && saved.items.length > data.length ? saved : { items: data, next: meta.next });

  const loadMore = async (event) => {
    event.preventDefault();
    if (isLoading || !list.next) return;
    setIsLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams(query);
      params.set("after", list.next);
      const page = await fetchListings(params.toString(), { fresh: true });
      const seen = new Set(list.items.map(({ code }) => code));
      const value = { items: [...list.items, ...page.data.filter(({ code }) => !seen.has(code))], next: page.meta.next };
      setLoaded(value);
      save({ query, ...value });
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (list.items.length === 0) {
    // জায়গার ভেতরে নেই — সীমা ছাড়া কাছেরগুলো দেখার পথ, দূরত্ব লেখা থাকে
    const params = new URLSearchParams(query);
    const place = params.get("place");
    const isBounded = params.get("near") && (params.get("box") || params.get("km"));
    ["box", "km", "after"].forEach((key) => params.delete(key));
    return (
      <div className="rounded-2xl border border-border bg-surface">
        <EmptyState
          icon={SearchX}
          title={isBounded && place ? `${place}-এ এখনো বিজ্ঞাপন নেই` : "কিছু পাওয়া যায়নি"}
          description={isBounded ? "আশেপাশের এলাকার বিজ্ঞাপন দেখতে পারেন, প্রতিটায় দূরত্ব লেখা থাকবে।" : "ফিল্টার একটু কমিয়ে দেখুন, বা অন্য জায়গায় খুঁজুন। নতুন বিজ্ঞাপন প্রতিদিন আসে।"}
          action={
            isBounded ? (
              <LinkButton href={`/to-let?${params.toString()}#results`} data-nearby>
                আশেপাশের বিজ্ঞাপন দেখুন
              </LinkButton>
            ) : query ? (
              <LinkButton href="/to-let" variant="outline">
                সব বিজ্ঞাপন দেখুন
              </LinkButton>
            ) : null
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul data-listing-results className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.items.map((listing, index) => (
          <li key={listing.code} className="flex min-w-0 [&>a]:min-w-0 [&>a]:flex-1">
            <ListingCard listing={listing} priority={index < 3} />
          </li>
        ))}
      </ul>
      {list.next && (
        <div className="flex flex-col items-center gap-2">
          <Link href={nextHref(query, list.next)} onClick={loadMore} data-load-more aria-busy={isLoading} className={buttonClasses({ variant: "outline", className: "w-full sm:w-auto sm:min-w-48" })}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            আরও দেখুন
          </Link>
          {error && <p className="text-sm text-danger">আনা যায়নি। আবার চেষ্টা করুন।</p>}
        </div>
      )}
    </div>
  );
};

export default ListingResults;
