"use client";

import { useState } from "react";
import { ReceiptText } from "lucide-react";
import ReceiptModal from "./ReceiptModal";
import Badge from "@/components/ui/Badge";
import { formatMoney } from "@/lib/formatMoney";
import { methodLabel } from "@/lib/paymentOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { useGetPaymentsQuery } from "@/redux/features/payment/paymentApi";

// একটি বিল বা Advance এর সব রসিদ — চাপলে রসিদ খোলে
const PaymentList = ({ query, kind }) => {
  const [openId, setOpenId] = useState(null);
  const { data } = useGetPaymentsQuery(query);

  const payments = (data?.data || []).filter((payment) => !kind || payment.kind === kind);
  const open = payments.find(({ _id }) => _id === openId);

  if (payments.length === 0) return null;

  return (
    <>
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {payments.map((payment) => (
          <li key={payment._id}>
            <button type="button" data-payment-row={payment.receiptNo} onClick={() => setOpenId(payment._id)} className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-background">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <ReceiptText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {formatMoney(payment.amount)} · {methodLabel(payment.method)}
                  </span>
                  <span className="block text-xs text-muted">
                    {payment.receiptNo} · {formatDate(payment.paidAt)}
                    {payment.status === "Active" && (payment.slipSentAt ? " · Slip sent ✓" : " · Slip not sent")}
                  </span>
                </span>
              </span>
              {payment.status === "Void" && <Badge variant="danger">Cancelled</Badge>}
            </button>
          </li>
        ))}
      </ul>
      {open && <ReceiptModal key={open._id} payment={open} onClose={() => setOpenId(null)} />}
    </>
  );
};

export default PaymentList;
