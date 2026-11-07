"use client";

import { ChevronRight, PartyPopper } from "lucide-react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { currentMonth, monthLabel } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetBillsQuery } from "@/redux/features/bill/billApi";

const Chip = ({ label, count, tone }) =>
  count > 0 ? (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", tone)}>
      {label} {toBanglaNumber(count)}
    </span>
  ) : null;

// এই মাসে বাড়ির ভাড়া কতটা উঠল — এই মাসের বিল ধরে, সব উঠলে অভিনন্দন
// মাসের মাঝে কেউ চলে গেলেও তাঁর বিল গোনা হয়, তাই দুই সংখ্যাই বিল থেকে
const MonthCollectionCard = ({ propertyId, occupied, onOpen }) => {
  const month = currentMonth();
  const { data, isLoading } = useGetBillsQuery({ month, propertyId });

  if (isLoading) return <Skeleton className="h-36 w-full rounded-2xl" />;
  const summary = data?.data?.summary;
  const notBilled = data?.data?.notBilled || 0;
  const totalBills = (summary?.bills || 0) + notBilled;
  if (occupied === 0 && totalBills === 0) return null;

  const percent = summary?.expected ? Math.min(100, Math.round((summary.collected / summary.expected) * 100)) : 0;
  const isComplete = summary && summary.bills > 0 && notBilled === 0 && summary.due === 0;

  return (
    <Card data-month-collection className={cn("flex flex-col gap-3", isComplete && "border-primary bg-primary-soft")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">{monthLabel(month)} · ভাড়া আদায়</h2>
        <button type="button" onClick={onOpen} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary">
          বিস্তারিত
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {isComplete ? (
        <p data-congrats className="flex items-center gap-2 text-base font-bold text-primary">
          <PartyPopper className="h-6 w-6 shrink-0" aria-hidden="true" />
          অভিনন্দন! {monthLabel(month).split(" ")[0]}-এর সব ভাড়া আদায় হয়েছে।
        </p>
      ) : null}

      {summary?.bills > 0 ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <p className="text-2xl font-bold tabular-nums">
              <span data-collected>{formatMoney(summary.collected)}</span>
              <span className="text-base font-semibold text-muted"> / {formatMoney(summary.expected)}</span>
            </p>
            <p data-paid-flats className="text-sm font-semibold">
              {toBanglaNumber(summary.paid)} / {toBanglaNumber(totalBills)} বিল পুরো দেওয়া
            </p>
          </div>

          <div role="progressbar" aria-label="Rent collected" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2.5 overflow-hidden rounded-full bg-primary-soft">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{toBanglaNumber(percent)}% আদায় · বাকি {formatMoney(summary.due)}</span>
            <Chip label="Paid" count={summary.paid} tone="bg-success-soft text-success-foreground" />
            <Chip label="Partial" count={summary.partial} tone="bg-info-soft text-info-foreground" />
            <Chip label="Due" count={summary.unpaid - summary.overdue} tone="bg-warning-soft text-warning-foreground" />
            <Chip label="Overdue" count={summary.overdue} tone="bg-danger-soft text-danger-foreground" />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">এই মাসের বিল এখনো তৈরি হয়নি। বিস্তারিত-এ গিয়ে Create Bills চাপুন।</p>
      )}

      {notBilled > 0 && summary?.bills > 0 && <p className="text-sm font-semibold text-warning-foreground">{toBanglaNumber(notBilled)}টি ফ্ল্যাটের বিল এখনো তৈরি হয়নি</p>}
    </Card>
  );
};

export default MonthCollectionCard;
