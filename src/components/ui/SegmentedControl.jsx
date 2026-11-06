"use client";

import { cn } from "@/lib/cn";

const SegmentedControl = ({ options, value, onChange, label }) => {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-primary-soft p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "min-h-10 rounded-md px-3 text-sm font-medium transition-colors md:min-h-8",
            value === option ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
