"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import Button from "./Button";
import { cn } from "@/lib/cn";

// বড় পর্দায় বোতাম, মোবাইলে ⋮ মেনু — একই কাজের তালিকা
// alwaysMenu — জায়গা কম হলে বড় পর্দাতেও ⋮
const ActionMenu = ({ items, label = "More actions", alwaysMenu = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <div className={cn("hidden flex-wrap gap-2", alwaysMenu ? "2xl:flex" : "md:flex")}>
        {items.map(({ key, label: itemLabel, icon: Icon, onClick }) => (
          <Button key={key} variant="outline" size="sm" onClick={onClick}>
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {itemLabel}
          </Button>
        ))}
      </div>

      <div ref={containerRef} className={cn("relative", alwaysMenu ? "2xl:hidden" : "md:hidden")}>
        <button
          type="button"
          aria-label={label}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-card"
        >
          <MoreVertical className="h-5 w-5" aria-hidden="true" />
        </button>

        {isOpen && (
          <ul role="menu" className="absolute top-full right-0 z-30 mt-2 w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-card">
            {items.map(({ key, label: itemLabel, icon: Icon, onClick }) => (
              <li key={key} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onClick();
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold hover:bg-primary-soft"
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
                  {itemLabel}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ActionMenu;
