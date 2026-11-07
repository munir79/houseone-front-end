"use client";

import { useState } from "react";
import { ChevronRight, ReceiptText } from "lucide-react";
import BillDetailsModal from "./BillDetailsModal";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { billStatus, monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { useGetTenancyBillsQuery } from "@/redux/features/bill/billApi";

// এক ভাড়াটিয়ার সব মাসের বিল
const TenancyBills = ({ tenancyId }) => {
  const [openId, setOpenId] = useState(null);
  const { data, isLoading } = useGetTenancyBillsQuery(tenancyId);

  const bills = data?.data || [];
  const openBill = bills.find(({ _id }) => _id === openId);

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;

  return (
    <Card flush className="overflow-hidden">
      {bills.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No bills yet" description="Billing থেকে বিল তৈরি হলে এখানে দেখা যাবে।" />
      ) : (
        <ul className="divide-y divide-border">
          {bills.map((bill) => {
            const status = billStatus(bill);
            return (
              <li key={bill._id}>
                <button type="button" onClick={() => setOpenId(bill._id)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-background">
                  <span className="min-w-0 text-sm font-semibold">{monthLabel(bill.month)}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold tabular-nums">{formatMoney(bill.total)}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {openBill && <BillDetailsModal key={openBill._id} bill={openBill} onClose={() => setOpenId(null)} />}
    </Card>
  );
};

export default TenancyBills;
