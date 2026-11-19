import { forwardRef } from "react";
import { formatMoney } from "@/lib/formatMoney";
import { depositName, isDeposit, methodLabel, paymentPurpose } from "@/lib/paymentOptions";
import { formatDate } from "@/lib/tenancyOptions";

const Row = ({ label, value, strong }) => (
  <div className={strong ? "flex justify-between gap-3 text-base font-bold" : "flex justify-between gap-3 text-sm"}>
    <dt className="min-w-0 wrap-break-word">{label}</dt>
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

// রসিদ — পর্দায়, PDF এ ও ভাড়াটিয়ার লিংকে একই
const ReceiptView = forwardRef(({ payment }, ref) => {
  const isVoid = payment.status === "Void";

  return (
    <div ref={ref} data-receipt className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5">
      {isVoid && (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-center text-base font-bold text-danger-foreground">
          এই রসিদ বাতিল করা হয়েছে{payment.voidReason ? `: ${payment.voidReason}` : ""}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-lg font-bold">
            House<span className="text-primary">One</span>
          </p>
          <h1 className="text-xl font-bold">টাকা প্রাপ্তির রসিদ</h1>
          {(payment.issuerName || payment.issuerPhone) && (
            <p data-receipt-issuer className="text-sm wrap-break-word text-muted">
              বাড়িওয়ালা: <span className="font-semibold text-foreground">{[payment.issuerName, payment.issuerPhone].filter(Boolean).join(", ")}</span>
            </p>
          )}
        </div>
        <div className="text-right text-sm">
          <p className="font-bold">{payment.receiptNo}</p>
          <p className="text-muted">{formatDate(payment.paidAt)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">ভাড়াটিয়া</dt>
          <dd className="font-semibold">{payment.tenantName}</dd>
        </div>
        <div>
          <dt className="text-muted">ফ্ল্যাট</dt>
          <dd className="font-semibold">
            {payment.unitName}, {payment.propertyName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">বাবদ</dt>
          <dd className="font-semibold">{paymentPurpose(payment)}</dd>
        </div>
        <div>
          <dt className="text-muted">মাধ্যম</dt>
          <dd className="font-semibold">
            {methodLabel(payment.method)}
            {payment.trxId && ` · ${payment.trxId}`}
          </dd>
        </div>
      </dl>

      {payment.kind === "Bill" && (
        <dl className="flex flex-col gap-1.5 rounded-xl bg-background p-3">
          {payment.lines.map(({ name, amount }, index) => (
            <Row key={index} label={name} value={formatMoney(amount)} />
          ))}
          <Row label="মোট বিল" value={formatMoney(payment.billTotal)} />
          {payment.paidBefore > 0 && <Row label="আগে দিয়েছেন" value={formatMoney(payment.paidBefore)} />}
        </dl>
      )}

      <dl className="flex flex-col gap-1.5">
        <div className="flex justify-between gap-3 rounded-xl bg-primary-soft px-3 py-2.5 text-lg font-bold text-primary">
          <dt>এবার পেয়েছি</dt>
          <dd data-receipt-amount className="tabular-nums">
            {formatMoney(payment.amount)}
          </dd>
        </div>
        <Row label={isDeposit(payment.kind) ? `${depositName(payment)} বাকি` : "এখনো বাকি"} value={formatMoney(payment.dueAfter)} strong />
      </dl>

      {payment.note && <p className="text-sm">নোট: {payment.note}</p>}

      <div className="border-t border-border pt-3 text-center">
        <p className="text-base font-bold">ধন্যবাদ!</p>
        <p className="text-sm text-muted">গ্রহণকারী: {payment.collectorName} · HouseOne থেকে তৈরি</p>
      </div>
    </div>
  );
});

ReceiptView.displayName = "ReceiptView";

export default ReceiptView;
