import { forwardRef } from "react";
import { monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { methodLabel } from "@/lib/paymentOptions";
import { formatDate } from "@/lib/tenancyOptions";

const Row = ({ label, value, strong, tone }) => (
  <div className={`flex justify-between gap-3 ${strong ? "text-base font-bold" : "text-sm"} ${tone || ""}`}>
    <dt className="min-w-0 wrap-break-word">{label}</dt>
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

export const settlementFileName = (tenancy) => `Move-out-${tenancy.unitName}-${tenancy.settlement.endMonth}.pdf`.replace(/\s+/g, "-");

// WhatsApp এর বার্তা — PDF এর সাথে মূল কথাগুলো লেখায়
export const settlementMessage = (tenancy) => {
  const { refund, unpaid } = tenancy.settlement;
  const result = refund > 0 ? `Advance থেকে ${formatMoney(refund)} ফেরত দেওয়া হয়েছে।` : unpaid > 0 ? `এখনো ${formatMoney(unpaid)} বাকি আছে।` : "সব হিসাব মিটে গেছে।";
  return `${tenancy.tenantName}, ${tenancy.propertyName}, ${tenancy.unitName}-এর বিদায়ী হিসাব। ${result} এতদিন থাকার জন্য ধন্যবাদ।`;
};

// বিদায়ী হিসাবের রসিদ — বাসা ছাড়ার সময়ের কপি থেকে, পরে কিছু বদলালেও এটা বদলায় না
const SettlementView = forwardRef(({ tenancy }, ref) => {
  const settlement = tenancy.settlement;

  return (
    <div ref={ref} data-settlement className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-lg font-bold">
            House<span className="text-primary">One</span>
          </p>
          <h2 className="text-xl font-bold">বিদায়ী হিসাব</h2>
        </div>
        <p className="text-sm text-muted">{formatDate(settlement.settledAt)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">ভাড়াটিয়া</dt>
          <dd className="font-semibold wrap-break-word">{tenancy.tenantName}</dd>
        </div>
        <div>
          <dt className="text-muted">ফ্ল্যাট</dt>
          <dd className="font-semibold wrap-break-word">
            {tenancy.unitName}, {tenancy.propertyName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">উঠেছিলেন</dt>
          <dd className="font-semibold">{formatDate(tenancy.startDate)}</dd>
        </div>
        <div>
          <dt className="text-muted">ছেড়েছেন</dt>
          <dd className="font-semibold">{formatDate(tenancy.endDate)}</dd>
        </div>
      </dl>

      <dl className="flex flex-col gap-1.5 rounded-xl bg-background p-3">
        <Row label="মোট বকেয়া" value={formatMoney(settlement.totalDue)} />
        <Row label="Advance পেয়েছিলাম" value={formatMoney(settlement.advanceReceived)} />
        {settlement.advanceUsedBefore > 0 && <Row label="আগেই বিলে কাটা হয়েছে" value={formatMoney(settlement.advanceUsedBefore)} />}
        {settlement.advanceApplied > 0 && <Row label="Advance থেকে বকেয়া শোধ" value={formatMoney(settlement.advanceApplied)} />}
      </dl>

      <dl className="flex flex-col gap-1.5">
        <div className="flex justify-between gap-3 rounded-xl bg-primary-soft px-3 py-2.5 text-lg font-bold text-primary">
          <dt>Advance ফেরত</dt>
          <dd data-settlement-refund className="tabular-nums">
            {formatMoney(settlement.refund)}
          </dd>
        </div>
        {settlement.refund > 0 && (
          <Row label="কীভাবে ফেরত" value={[methodLabel(settlement.refundMethod), settlement.refundTrxId].filter(Boolean).join(" · ")} />
        )}
        {settlement.unpaid > 0 && <Row label="আদায় হয়নি" value={formatMoney(settlement.unpaid)} strong tone="text-danger" />}
      </dl>

      {(settlement.lastBillSkipped || settlement.itemsNotReturned.length > 0) && (
        <div className="flex flex-col gap-1 text-sm">
          {settlement.lastBillSkipped && <p>{monthLabel(settlement.endMonth)} মাসের বিল নেওয়া হয়নি।</p>}
          {settlement.itemsNotReturned.length > 0 && (
            <p data-items-not-returned className="text-danger">ফেরত দেননি: {settlement.itemsNotReturned.join(", ")}</p>
          )}
        </div>
      )}

      <div className="border-t border-border pt-3 text-center">
        <p className="text-base font-bold">এতদিন থাকার জন্য ধন্যবাদ!</p>
        <p className="text-sm text-muted">হিসাব করেছেন: {settlement.settledByName} · HouseOne থেকে তৈরি</p>
      </div>
    </div>
  );
});

SettlementView.displayName = "SettlementView";

export default SettlementView;
