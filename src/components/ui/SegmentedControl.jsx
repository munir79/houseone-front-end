"use client";

import { cn } from "@/lib/cn";

const SegmentedControl = ({ options, value, onChange, label }) => {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl border border-border bg-surface p-0.5 [scrollbar-width:none]">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors md:min-h-8",
            value === option ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
