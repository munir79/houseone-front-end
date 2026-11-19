"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, Clock, Wallet } from "lucide-react";
import ReceiveDepositModal from "./ReceiveDepositModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { formatMoney } from "@/lib/formatMoney";
import { INSTALLMENT_STATUS } from "@/lib/marketOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetPaymentsQuery } from "@/redux/features/payment/paymentApi";

// কোন রসিদের কত টাকা কোন কিস্তিতে — আগের কিস্তি আগে শোধ হয়, Server এর হিসাবের মতোই
const allocate = (installments, payments) => {
  const queue = payments.map(({ _id, amount, paidAt, receiptNo }) => ({ _id, left: amount, paidAt, receiptNo }));
  return installments.map((item) => {
    let need = item.amount;
    const parts = [];
    while (need > 0 && queue.length > 0) {
      const payment = queue[0];
      const used = Math.min(need, payment.left);
      parts.push({ key: `${payment._id}-${parts.length}`, amount: used, paidAt: payment.paidAt, receiptNo: payment.receiptNo });
      need -= used;
      payment.left -= used;
      if (payment.left === 0) queue.shift();
    }
    return { ...item, parts };
  });
};

// পজিশন মানির (সালামি) কিস্তি — কোনটা কবে, কত পেয়েছেন, কোন রসিদে
const InstallmentsPanel = ({ tenancy }) => {
  const [receiving, setReceiving] = useState(null);
  const { data, isLoading } = useGetPaymentsQuery({ tenancyId: tenancy._id });
  const position = tenancy.deposits.position;
  const isActive = tenancy.status === "Active";

  const rows = useMemo(() => {
    const payments = (data?.data || []).filter(({ kind, status }) => kind === "Position" && status === "Active").sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt));
    return allocate(position.installments, payments);
  }, [data, position.installments]);

  const paidCount = position.installments.filter(({ status }) => status === "Paid").length;
  const now = new Date();

  return (
    <div data-installments-panel className="flex flex-col gap-4">
      <StatStrip
        items={[
          { key: "total", label: "মোট পজিশন মানি", value: formatMoney(position.total), hint: `${toBanglaNumber(position.installments.length)}টি কিস্তি`, icon: Banknote },
          { key: "received", label: "পেয়েছেন", value: formatMoney(position.received), hint: `${toBanglaNumber(paidCount)}টি কিস্তি পুরো`, icon: CheckCircle2, tone: "blue" },
          { key: "due", label: "বাকি", value: formatMoney(position.due), hint: position.next?.dueDate ? `পরের কিস্তি ${formatDate(position.next.dueDate)}` : undefined, icon: Clock, tone: "amber" },
        ]}
      />

      <Card flush className="overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-base font-bold">কিস্তির তালিকা</h2>
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {rows.map((item, index) => {
              const status = INSTALLMENT_STATUS[item.status];
              const isLate = item.status !== "Paid" && item.dueDate && new Date(item.dueDate) < now;
              const isNext = position.next && index === position.installments.findIndex(({ status: s }) => s !== "Paid");
              return (
                <li key={index} data-installment={index} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        কিস্তি {toBanglaNumber(index + 1)} · {formatMoney(item.amount)}
                      </p>
                      <p className="text-sm text-muted">{item.dueDate ? `দেওয়ার তারিখ ${formatDate(item.dueDate)}` : "চুক্তির দিন"}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {isLate && <Badge variant="danger">তারিখ পেরিয়েছে</Badge>}
                      <Badge variant={status.variant}>{item.status === "Partial" ? `${formatMoney(item.amount - item.paid)} বাকি` : status.label}</Badge>
                      {isActive && isNext && (
                        <Button size="sm" variant="outline" onClick={() => setReceiving({ due: position.due, suggested: item.amount - item.paid })}>
                          <Wallet className="h-4 w-4" aria-hidden="true" />
                          টাকা নিন
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.parts.length > 0 && (
                    <ul className="flex flex-col gap-1 rounded-lg bg-background px-3 py-2 text-xs text-muted">
                      {item.parts.map((part) => (
                        <li key={part.key} className="flex flex-wrap justify-between gap-2">
                          <span>
                            {formatDate(part.paidAt)} · রসিদ {part.receiptNo}
                          </span>
                          <span className="font-semibold text-foreground tabular-nums">{formatMoney(part.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {receiving && <ReceiveDepositModal tenancy={tenancy} kind="Position" {...receiving} onClose={() => setReceiving(null)} />}
    </div>
  );
};

export default InstallmentsPanel;
