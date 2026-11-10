"use client";

import { useState } from "react";
import { ArrowRight, CircleAlert, DoorOpen, KeyRound, LayoutGrid, PartyPopper, ReceiptText, Send, Wallet } from "lucide-react";
import GenerateBillsModal from "@/components/bill/GenerateBillsModal";
import Button from "@/components/ui/Button";
import StatStrip from "@/components/ui/StatStrip";
import { currentMonth, monthLabel } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetBillsQuery } from "@/redux/features/bill/billApi";

const TONES = {
  warning: "border-warning/40 bg-warning-soft text-warning-foreground",
  danger: "border-danger/40 bg-danger-soft text-danger-foreground",
};

// এই মাসে কী বাকি — বিল তৈরি, পাঠানো, নাকি শেষ তারিখ পার
const nextStep = ({ notBilled, unsent, overdue, monthName }) => {
  const bn = toBanglaNumber;
  if (notBilled > 0 && unsent > 0) {
    return { tone: "warning", icon: ReceiptText, text: `${bn(notBilled)}টি ফ্ল্যাটের বিল তৈরি ও ${bn(unsent)}টি বিল পাঠানো বাকি`, action: "Create & Send" };
  }
  if (notBilled > 0) {
    return { tone: "warning", icon: ReceiptText, text: `${bn(notBilled)}টি ফ্ল্যাটের ${monthName}-এর বিল তৈরি ও পাঠানো বাকি`, action: "Create & Send" };
  }
  if (unsent > 0) {
    return { tone: "warning", icon: Send, text: `${bn(unsent)}টি বিল ভাড়াটিয়াকে এখনো পাঠানো হয়নি`, action: "Send Bills" };
  }
  if (overdue > 0) {
    return { tone: "danger", icon: CircleAlert, text: `${bn(overdue)}টি ফ্ল্যাটের ভাড়ার শেষ তারিখ পার হয়েছে`, action: "View" };
  }
  return null;
};

const Collection = ({ paid, total, collected, target, isEstimate, isComplete }) => {
  const percent = total ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div role="progressbar" aria-label="Flats paid" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-border/70">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      {isComplete ? (
        <p data-congrats className="flex items-center gap-1 text-xs font-semibold text-primary sm:text-sm">
          <PartyPopper className="h-4 w-4 shrink-0" aria-hidden="true" />
          সব আদায় · {formatMoney(collected)}
        </p>
      ) : (
        <p data-collection-money className="text-xs text-muted sm:text-sm">
          <span data-collected className="font-semibold whitespace-nowrap text-foreground tabular-nums">
            {formatMoney(collected)}
          </span>{" "}
          <span className="whitespace-nowrap tabular-nums">/ {formatMoney(target)}</span>
          {isEstimate && " (আনুমানিক)"}
        </p>
      )}
    </div>
  );
};

// বাড়ির সংখ্যা ও এই মাসের আদায় এক সারিতে — নিচে পরের কাজের পরামর্শ
// onOpenRent — আদায় কার্ড চাপলে, onOpenPending — পরামর্শ চাপলে (Units tab, Rent Pending)
const HouseStats = ({ property, onOpenRent, onOpenPending }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const month = currentMonth();
  const monthName = monthLabel(month).split(" ")[0];
  const { data, isLoading } = useGetBillsQuery({ month, propertyId: property._id });

  const occupied = property.unitCount - property.vacantCount;
  const occupancy = property.unitCount ? Math.round((occupied / property.unitCount) * 100) : 0;

  const summary = data?.data?.summary;
  const notBilled = data?.data?.notBilled || 0;
  const estimate = data?.data?.notBilledEstimate || 0;
  // মাসের মাঝে কেউ চলে গেলেও তাঁর বিল গোনা হয়, তাই ফ্ল্যাট গোনা বিল থেকে
  const total = (summary?.bills || 0) + notBilled;
  const isComplete = total > 0 && summary?.paid === total;
  const showCollection = isLoading || occupied > 0 || total > 0;
  const step = isLoading ? null : nextStep({ notBilled, unsent: summary?.unsent || 0, overdue: summary?.overdue || 0, monthName });

  const items = [
    { key: "units", label: "Total Units", value: property.unitCount, icon: LayoutGrid },
    { key: "occupied", label: "Occupied", value: occupied, hint: `${occupancy}%`, icon: KeyRound, tone: "blue" },
    { key: "vacant", label: "Vacant", value: property.vacantCount, icon: DoorOpen, tone: "amber" },
    ...(showCollection
      ? [
          {
            key: "collection",
            label: `${monthName} Rent`,
            value: `${summary?.paid || 0} / ${total}`,
            hint: "paid",
            icon: Wallet,
            tone: "violet",
            isLoading,
            highlight: isComplete,
            onClick: onOpenRent,
            extra: (
              <Collection
                paid={summary?.paid || 0}
                total={total}
                collected={summary?.collected || 0}
                target={(summary?.expected || 0) + estimate}
                isEstimate={estimate > 0}
                isComplete={isComplete}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      <StatStrip items={items} />

      {step && (
        <div data-next-step className={cn("flex flex-col gap-3 rounded-xl border px-4 py-3 lg:flex-row lg:items-center lg:justify-between", TONES[step.tone])}>
          <p className="flex items-start gap-2 text-sm font-semibold">
            <step.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {step.text}
          </p>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            {notBilled > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIsGenerating(true)} className="flex-1 whitespace-nowrap sm:flex-none">
                Create All Bills
              </Button>
            )}
            <Button size="sm" onClick={onOpenPending} className="flex-1 whitespace-nowrap sm:flex-none">
              {step.action}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {isGenerating && <GenerateBillsModal month={month} propertyId={property._id} onClose={() => setIsGenerating(false)} />}
    </div>
  );
};

export default HouseStats;
