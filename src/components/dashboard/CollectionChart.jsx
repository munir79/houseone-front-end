"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Table2 } from "lucide-react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { monthLabel } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { formatMoney, formatMoneyShort } from "@/lib/formatMoney";

const RANGES = { "৬ মাস": 6, "১২ মাস": 12 };
const GRID_STEPS = [1, 0.5, 0];

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortMonth = (month) => MONTH_SHORT[Number(month.slice(5, 7)) - 1];
const percentOf = ({ expected, collected }) => (expected ? Math.round((collected / expected) * 100) : 0);

// মাসে মাসে বিল বনাম আদায় — বিল হালকা ট্র্যাক, আদায় একই সবুজের গাঢ় অংশ (লক্ষ্য বনাম আসল)
// রঙ ছাড়াও Legend, Tooltip ও Table — কম কনট্রাস্টের ট্র্যাক একা কিছু বোঝায় না
const CollectionChart = ({ chart }) => {
  const router = useRouter();
  const [range, setRange] = useState("৬ মাস");
  const [isTable, setIsTable] = useState(false);
  const [active, setActive] = useState(null);

  const months = chart.slice(-RANGES[range]);
  const max = Math.max(...months.map(({ expected, collected }) => Math.max(expected, collected)), 0);
  const hovered = months.find(({ month }) => month === active);

  return (
    <Card data-collection-chart className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">মাসে মাসে আদায়</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted" aria-hidden={isTable}>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-chart-track" />
              বিল
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
              আদায়
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl label="Chart range" options={Object.keys(RANGES)} value={range} onChange={setRange} />
          <button
            type="button"
            onClick={() => setIsTable(!isTable)}
            aria-pressed={isTable}
            aria-label={isTable ? "Show chart" : "Show table"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground md:h-9 md:w-9"
          >
            {isTable ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {max === 0 ? (
        <EmptyState icon={BarChart3} title="No bills yet" description="বিল তৈরি হলে এখানে মাসে মাসে বিল আর আদায় দেখাবে।" />
      ) : isTable ? (
        <div className="overflow-x-auto">
          <table data-chart-table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-2 font-medium">মাস</th>
                <th className="py-2 text-right font-medium">বিল</th>
                <th className="py-2 text-right font-medium">আদায়</th>
                <th className="py-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((row) => (
                <tr key={row.month} className="border-b border-border last:border-0">
                  <td className="py-2">{monthLabel(row.month)}</td>
                  <td className="py-2 text-right tabular-nums">{formatMoney(row.expected)}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{formatMoney(row.collected)}</td>
                  <td className="py-2 text-right tabular-nums">{percentOf(row)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p data-chart-readout className="min-h-5 text-sm" aria-live="polite">
            {hovered ? (
              <>
                <span className="font-semibold">{monthLabel(hovered.month)}</span> · বিল {formatMoney(hovered.expected)} · আদায়{" "}
                <span className="font-semibold">{formatMoney(hovered.collected)}</span> ({percentOf(hovered)}%)
              </>
            ) : (
              <span className="text-muted">কোনো মাসে চাপুন বা মাউস রাখুন</span>
            )}
          </p>

          <div className="flex gap-2">
            {/* অক্ষ — হালকা, পরিষ্কার সংখ্যা */}
            <div className="flex h-44 flex-col justify-between text-right text-xs text-muted tabular-nums" aria-hidden="true">
              {GRID_STEPS.map((step) => (
                <span key={step} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
                  {formatMoneyShort(max * step)}
                </span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-44" aria-hidden="true">
                {GRID_STEPS.map((step) => (
                  <span key={step} className="absolute inset-x-0 border-t border-border" style={{ top: `${(1 - step) * 100}%` }} />
                ))}
              </div>
              <ul className="relative flex h-44 items-end" role="list">
                {months.map((row) => {
                  const trackHeight = max ? (row.expected / max) * 100 : 0;
                  const fillHeight = max ? (Math.min(row.collected, Math.max(row.expected, row.collected)) / max) * 100 : 0;
                  const isActive = active === row.month;
                  return (
                    <li key={row.month} className="flex h-full min-w-0 flex-1 justify-center">
                      {/* পুরো কলামই চাপার জায়গা — দাগের চেয়ে বড় */}
                      <button
                        type="button"
                        data-chart-month={row.month}
                        onMouseEnter={() => setActive(row.month)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(row.month)}
                        onBlur={() => setActive(null)}
                        onClick={() => (isActive ? router.push(`/billing?month=${row.month}`) : setActive(row.month))}
                        aria-label={`${monthLabel(row.month)}: bill ${formatMoney(row.expected)}, collected ${formatMoney(row.collected)}`}
                        className={cn("relative flex h-full w-full max-w-12 items-end justify-center rounded-md", isActive && "bg-background")}
                      >
                        <span className="relative w-3/5 max-w-6 rounded-t bg-chart-track" style={{ height: `${Math.max(trackHeight, fillHeight)}%` }}>
                          <span className="absolute inset-x-0 bottom-0 rounded-t bg-primary" style={{ height: `${trackHeight ? (fillHeight / Math.max(trackHeight, fillHeight)) * 100 : 0}%` }} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <ul className="mt-1 flex" aria-hidden="true">
                {months.map((row, index) => (
                  <li
                    key={row.month}
                    className={cn(
                      "min-w-0 flex-1 text-center text-xs",
                      active === row.month ? "font-semibold text-foreground" : "text-muted",
                      // ছোট পর্দায় ১২ মাসে একটা পরপর নাম — এই মাসের নাম সবসময় থাকে, বাছা মাস উপরের লেখায়
                      months.length > 6 && index % 2 !== (months.length - 1) % 2 && "max-md:invisible"
                    )}
                  >
                    {shortMonth(row.month)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted">মাসে দুবার চাপলে সেই মাসের Billing খুলবে।</p>
        </div>
      )}
    </Card>
  );
};

export default CollectionChart;
