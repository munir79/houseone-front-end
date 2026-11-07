"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ReceiptText } from "lucide-react";
import BillDetailsModal from "./BillDetailsModal";
import GenerateBillsModal from "./GenerateBillsModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { billStatus, currentMonth, monthLabel, monthOptions } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { useGetTenancyBillsQuery } from "@/redux/features/bill/billApi";

// এক ভাড়াটিয়ার সব মাসের বিল
const TenancyBills = ({ tenancyId, canCreate = false }) => {
  const [openId, setOpenId] = useState(null);
  const [month, setMonth] = useState(currentMonth);
  const [isGenerating, setIsGenerating] = useState(false);
  const options = useMemo(() => monthOptions(), []);
  const { data, isLoading } = useGetTenancyBillsQuery(tenancyId);

  const bills = data?.data || [];
  const openBill = bills.find(({ _id }) => _id === openId);

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;

  return (
    <Card flush className="overflow-hidden">
      {canCreate && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3 sm:p-4">
          <Select id="tenantBillMonth" compact aria-label="Bill month" options={options} value={month} onChange={(e) => setMonth(e.target.value)} className="w-full sm:w-52" />
          <Button size="sm" onClick={() => setIsGenerating(true)}>
            <ReceiptText className="h-4 w-4" aria-hidden="true" />
            Create Bill
          </Button>
        </div>
      )}

      {bills.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No bills yet" description={canCreate ? "মাস বেছে Create Bill চাপুন।" : "এই ভাড়াটিয়ার কোনো বিল নেই।"} />
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
      {isGenerating && <GenerateBillsModal month={month} tenancyId={tenancyId} onClose={() => setIsGenerating(false)} />}
    </Card>
  );
};

export default TenancyBills;
