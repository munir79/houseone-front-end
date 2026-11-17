"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const SegmentedControl = ({ options, value, onChange, label }) => {
  const groupRef = useRef(null);

  // ছোট পর্দায় বাছা অপশন পাশে লুকিয়ে থাকলে সেটা দেখা যায় — পেজ নিচে-উপরে নড়ে না
  useEffect(() => {
    const group = groupRef.current;
    const active = group?.querySelector("[aria-pressed=true]");
    if (!active || group.scrollWidth <= group.clientWidth) return;

    const isHidden = active.offsetLeft < group.scrollLeft || active.offsetLeft + active.offsetWidth > group.scrollLeft + group.clientWidth;
    if (isHidden) group.scrollLeft = active.offsetLeft - (group.clientWidth - active.offsetWidth) / 2;
  }, [value]);

  return (
    <div ref={groupRef} role="group" aria-label={label} className="relative inline-flex max-w-full overflow-x-auto rounded-xl border border-border bg-surface p-0.5 [scrollbar-width:none]">
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
