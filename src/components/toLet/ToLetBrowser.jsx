"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { BEDROOM_OPTIONS, SORT_OPTIONS } from "@/lib/listingOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const selectClass = "min-h-10 rounded-xl border border-border bg-surface px-2 text-sm font-medium md:min-h-9";

// ফলাফলের সারি — সংখ্যা, রুম, সাজানো; নিচে Server এর তৈরি বিজ্ঞাপন
const ToLetBrowser = ({ meta, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const go = (changes) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    next.delete("page");
    const search = next.toString();
    startTransition(() => router.push(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  };

  const near = params.get("near");
  const km = params.get("km");
  const place = params.get("place");

  return (
    <div id="results" className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p data-result-total className="mr-auto flex min-w-0 items-center gap-1.5 text-sm text-muted">
          {meta.total !== null && (
            <span className="font-semibold text-foreground">
              {toBanglaNumber(meta.total)}
              {meta.isCapped && "+"}টি বিজ্ঞাপন
            </span>
          )}
          {near && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {place || "লোকেশন"} {km ? `থেকে ${toBanglaNumber(km)} কিমির মধ্যে` : "থেকে কাছেরটা আগে"}
              </span>
            </span>
          )}
        </p>
        <select aria-label="রুম" value={params.get("bedrooms") || ""} onChange={(e) => go({ bedrooms: e.target.value })} className={selectClass}>
          <option value="">যেকোনো রুম</option>
          {BEDROOM_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {!near && (
          <select aria-label="সাজানো" value={params.get("sort") || "new"} onChange={(e) => go({ sort: e.target.value === "new" ? "" : e.target.value })} className={selectClass}>
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={cn("transition-opacity", isPending && "pointer-events-none opacity-50")} aria-busy={isPending}>
        {children}
      </div>
    </div>
  );
};

export default ToLetBrowser;
