import { forwardRef } from "react";
import Badge from "@/components/ui/Badge";
import { billLastDay, billStatus, monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { formatDate } from "@/lib/tenancyOptions";

const Row = ({ label, value, strong }) => (
  <div className={strong ? "flex justify-between gap-3 text-base font-bold" : "flex justify-between gap-3 text-sm"}>
    <dt className="min-w-0 wrap-break-word">{label}</dt>
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

// ভাড়াটিয়ার বিল — পর্দায় ও PDF এ একই
const BillView = forwardRef(({ bill }, ref) => {
  const status = billStatus(bill);

  return (
    <div ref={ref} data-public-bill className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-lg font-bold">
            House<span className="text-primary">One</span>
          </p>
          <h1 className="text-xl font-bold">{monthLabel(bill.month)} মাসের বিল</h1>
        </div>
        <Badge variant={status.variant}>{status.key === "Paid" ? "পরিশোধিত" : status.label}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">ভাড়াটিয়া</dt>
          <dd className="font-semibold wrap-break-word">{bill.tenantName}</dd>
        </div>
        <div>
          <dt className="text-muted">ফ্ল্যাট</dt>
          <dd className="font-semibold wrap-break-word">
            {bill.unitName}, {bill.propertyName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">শেষ তারিখ</dt>
          <dd className="font-semibold">{formatDate(billLastDay(bill))}</dd>
        </div>
        {(bill.ownerName || bill.ownerPhone) && (
          <div>
            <dt className="text-muted">বাড়িওয়ালা</dt>
            <dd className="font-semibold wrap-break-word">{[bill.ownerName, bill.ownerPhone].filter(Boolean).join(", ")}</dd>
          </div>
        )}
      </dl>

      <dl className="flex flex-col gap-1.5 rounded-xl bg-background p-3">
        {bill.lines.map(({ name, amount }, index) => (
          <Row key={index} label={name} value={formatMoney(amount)} />
        ))}
        <div className="mt-1 border-t border-border pt-2">
          <Row label="মোট বিল" value={formatMoney(bill.total)} strong />
        </div>
        {bill.paid > 0 && <Row label="দিয়েছেন" value={formatMoney(bill.paid)} />}
      </dl>

      <div className="flex justify-between gap-3 rounded-xl bg-primary-soft px-3 py-2.5 text-lg font-bold text-primary">
        <span>{bill.balance > 0 ? "দিতে হবে" : "সব পরিশোধ হয়েছে"}</span>
        <span data-bill-balance className="tabular-nums">
          {formatMoney(bill.balance)}
        </span>
      </div>

      <p className="border-t border-border pt-3 text-center text-sm text-muted">ধন্যবাদ · HouseOne থেকে তৈরি</p>
    </div>
  );
});

BillView.displayName = "BillView";

export default BillView;
