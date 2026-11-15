"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ReceiptModal from "@/components/payment/ReceiptModal";
import Card from "@/components/ui/Card";
import { monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { methodLabel } from "@/lib/paymentOptions";
import { formatDate } from "@/lib/tenancyOptions";

// সর্বশেষ টাকা নেওয়া — চাপলে রসিদ খোলে
const RecentReceipts = ({ payments }) => {
  const [openId, setOpenId] = useState(null);
  const opened = payments.find(({ _id }) => _id === openId);

  return (
    <Card flush data-recent-receipts className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-base font-bold">সাম্প্রতিক টাকা নেওয়া</h2>
        <Link href="/receipts" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary">
          সব রসিদ
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {payments.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">এখনো কোনো টাকা নেওয়া হয়নি।</p>
      ) : (
        <ul className="divide-y divide-border">
          {payments.map((payment) => (
            <li key={payment._id}>
              <button type="button" onClick={() => setOpenId(payment._id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-background">
                <span className="min-w-0">
                  <span className="block text-sm font-medium wrap-break-word">{payment.tenantName}</span>
                  <span className="block text-xs text-muted">
                    {payment.unitName} · {payment.kind === "Advance" ? "Advance" : monthLabel(payment.month)} · {methodLabel(payment.method)} · {formatDate(payment.paidAt)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums">{formatMoney(payment.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {opened && <ReceiptModal key={opened._id} payment={opened} onClose={() => setOpenId(null)} />}
    </Card>
  );
};

export default RecentReceipts;
