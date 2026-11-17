"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const SCROLL_STEP = 160;

// মোবাইলে পাশে টানা যায় — ডানে আরও Tab থাকলে ছায়া ও তীর দেখায়
const Tabs = ({ tabs, active, onChange, label }) => {
  const listRef = useRef(null);
  const [hasMore, setHasMore] = useState(false);

  const updateMore = useCallback(() => {
    const list = listRef.current;
    if (list) setHasMore(list.scrollWidth - list.scrollLeft - list.clientWidth > 4);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(updateMore);
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [updateMore, tabs.length]);

  // চাপা Tab মাঝখানে আসে, পরেরটা দেখা যায়
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector('[aria-selected="true"]');
    if (tab) list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div className="relative">
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onScroll={updateMore}
        className="relative flex gap-2 overflow-x-auto [scrollbar-width:none] md:gap-5 md:border-b md:border-border"
      >
        {tabs.map(({ value, label: tabLabel, count }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active === value}
            onClick={() => onChange(value)}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
              "md:-mb-px md:rounded-none md:border-0 md:border-b-2 md:px-0",
              active === value
                ? "border-primary bg-primary text-primary-foreground md:border-primary md:bg-transparent md:text-primary"
                : "border-border bg-surface text-muted hover:text-foreground md:border-transparent md:bg-transparent"
            )}
          >
            {tabLabel}
            {count !== undefined && <span className={cn("text-xs tabular-nums", active === value ? "opacity-90" : "text-muted")}>{count}</span>}
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-linear-to-l from-background to-transparent">
          <button
            type="button"
            aria-label="More tabs"
            onClick={() => listRef.current?.scrollBy({ left: SCROLL_STEP, behavior: "smooth" })}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-card"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Tabs;
