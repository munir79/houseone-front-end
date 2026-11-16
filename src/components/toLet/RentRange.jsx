"use client";

import { formatMoney } from "@/lib/formatMoney";

export const RENT_MIN = 0;
export const RENT_MAX = 100000;
const STEP = 1000;

const thumbClass =
  "pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent outline-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-surface [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-card focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-primary-soft";

export const rentLabel = (min, max) => {
  if (min <= RENT_MIN && max >= RENT_MAX) return "যেকোনো ভাড়া";
  if (max >= RENT_MAX) return `${formatMoney(min)}+`;
  if (min <= RENT_MIN) return `${formatMoney(max)} পর্যন্ত`;
  return `${formatMoney(min)} – ${formatMoney(max)}`;
};

// ভাড়ার সীমা — দুই মাথা টেনে; শেষ মাথা মানে কোনো সীমা নেই
const RentRange = ({ min, max, onChange, labelClassName }) => {
  const left = ((min - RENT_MIN) / (RENT_MAX - RENT_MIN)) * 100;
  const right = ((max - RENT_MIN) / (RENT_MAX - RENT_MIN)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={labelClassName}>ভাড়া</span>
        <span data-rent-label className="text-sm font-semibold tabular-nums">
          {rentLabel(min, max)}
        </span>
      </div>
      <div className="relative h-11 md:h-10">
        <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-chart-track" aria-hidden="true" />
        <span className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${left}%`, right: `${100 - right}%` }} aria-hidden="true" />
        <input
          type="range"
          aria-label="সর্বনিম্ন ভাড়া"
          aria-valuetext={formatMoney(min)}
          min={RENT_MIN}
          max={RENT_MAX}
          step={STEP}
          value={min}
          onChange={(event) => onChange({ min: Math.min(Number(event.target.value), max - STEP), max })}
          // দুই মাথা ডানে মিললে নিচের মাথাটা উপরে, যাতে টেনে ফেরানো যায়
          style={{ zIndex: min > RENT_MAX - 5 * STEP ? 2 : 1 }}
          className={thumbClass}
        />
        <input
          type="range"
          aria-label="সর্বোচ্চ ভাড়া"
          aria-valuetext={max >= RENT_MAX ? "সীমা নেই" : formatMoney(max)}
          min={RENT_MIN}
          max={RENT_MAX}
          step={STEP}
          value={max}
          onChange={(event) => onChange({ min, max: Math.max(Number(event.target.value), min + STEP) })}
          className={thumbClass}
        />
      </div>
    </div>
  );
};

export default RentRange;
