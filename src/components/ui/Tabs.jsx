"use client";

import { cn } from "@/lib/cn";

const Tabs = ({ tabs, active, onChange, label }) => {
  return (
    <div role="tablist" aria-label={label} className="flex gap-5 overflow-x-auto border-b border-border [scrollbar-width:none]">
      {tabs.map(({ value, label: tabLabel, count }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          onClick={() => onChange(value)}
          className={cn(
            "-mb-px flex min-h-11 items-center gap-1.5 border-b-2 text-sm font-medium whitespace-nowrap transition-colors md:min-h-10",
            active === value ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {tabLabel}
          {count !== undefined && <span className="text-xs text-muted tabular-nums">{count}</span>}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
