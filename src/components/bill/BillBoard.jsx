"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  MessageCircle,
  ReceiptText,
  Wallet,
  WalletCards,
} from "lucide-react";
import BillDetailsModal from "./BillDetailsModal";
import GenerateBillsModal from "./GenerateBillsModal";
import PayModal from "@/components/payment/PayModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import {
  billReminderLink,
  billStatus,
  currentMonth,
  monthLabel,
  monthOptions,
} from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { lastPaymentLine } from "@/lib/paymentOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetBillsQuery } from "@/redux/features/bill/billApi";

const ALL = "All";
const STATUS_ORDER = ["Overdue", "Unpaid", "Partial", "Paid"];
const FILTER_LABELS = {
  Overdue: "Overdue",
  Unpaid: "Due",
  Partial: "Partial",
  Paid: "Paid",
};

const BillRow = ({ bill, onOpen, onPay }) => {
  const status = billStatus(bill);

  return (
    <li
      data-bill-row={bill.unitName}
      className="relative transition-colors hover:bg-background"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            className="block text-left text-sm font-semibold wrap-break-word after:absolute after:inset-0"
          >
            {bill.tenantName}
          </button>
          <span className="block text-sm text-muted">
            {bill.unitName}, {bill.propertyName}
          </span>
          {bill.lastPayment && (
            <span className="block text-xs text-muted">
              {lastPaymentLine(bill)}
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-sm font-bold tabular-nums">
            {formatMoney(bill.total)}
          </span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </span>
        {bill.balance > 0 && (
          <button
            type="button"
            onClick={onPay}
            aria-label={`Mark ${bill.tenantName} as paid`}
            className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-soft"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        {bill.balance > 0 ? (
          <a
            href={billReminderLink(bill)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Remind ${bill.tenantName} on WhatsApp`}
            className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </a>
        ) : (
          <ChevronRight
            className="mx-3.5 h-4 w-4 shrink-0 text-muted"
            aria-hidden="true"
          />
        )}
      </div>
    </li>
  );
};

// মাসের বিল, কে দিল কে দিল না — Billing পেজ ও বাড়ির Rent tab এ একই
const BillBoard = ({ propertyId }) => {
  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState(ALL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const options = useMemo(() => monthOptions(), []);
  const { data, isLoading } = useGetBillsQuery({
    month,
    ...(propertyId ? { propertyId } : {}),
  });

  const bills = useMemo(() => data?.data?.bills || [], [data]);
  const summary = data?.data?.summary;
  const notBilled = data?.data?.notBilled || 0;

  const counts = useMemo(
    () =>
      bills.reduce(
        (all, bill) => ({
          ...all,
          [billStatus(bill).key]: (all[billStatus(bill).key] || 0) + 1,
        }),
        {},
      ),
    [bills],
  );
  const shown = useMemo(
    () =>
      bills.filter((bill) => filter === ALL || billStatus(bill).key === filter),
    [bills, filter],
  );
  const filterOptions = [
    { value: ALL, label: ALL },
    ...STATUS_ORDER.filter((key) => counts[key]).map((key) => ({
      value: key,
      label: `${FILTER_LABELS[key]} ${counts[key]}`,
    })),
  ];
  const activeFilter =
    filterOptions.find(({ value }) => value === filter) ?? filterOptions[0];

  const openBill = bills.find(({ _id }) => _id === openId);
  const payingBill = bills.find(({ _id }) => _id === payingId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          id="billMonth"
          compact
          aria-label="Bill month"
          options={options}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full sm:w-52"
        />
        <Button onClick={() => setIsGenerating(true)}>
          <ReceiptText className="h-4 w-4" aria-hidden="true" />
          Create Bills
        </Button>
      </div>

      <StatStrip
        isLoading={isLoading}
        items={[
          {
            key: "expected",
            label: "Total Bill",
            value: formatMoney(summary?.expected || 0),
            icon: Banknote,
          },
          {
            key: "collected",
            label: "Collected",
            value: formatMoney(summary?.collected || 0),
            icon: Wallet,
            tone: "blue",
          },
          {
            key: "due",
            label: "Due",
            value: formatMoney(summary?.due || 0),
            icon: CircleAlert,
            tone: "red",
          },
          {
            key: "paidCount",
            label: "Paid Flats",
            value: `${summary?.paid || 0} / ${summary?.bills || 0}`,
            icon: WalletCards,
            tone: "violet",
          },
        ]}
      />

      {notBilled > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3">
          <p
            data-not-billed
            className="text-sm font-semibold text-warning-foreground"
          >
            {monthLabel(month)}: {toBanglaNumber(notBilled)}টি ফ্ল্যাটের বিল
            এখনো তৈরি হয়নি
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGenerating(true)}
          >
            এখনই তৈরি করুন
          </Button>
        </div>
      )}

      <Card flush className="overflow-hidden">
        {bills.length > 0 && (
          <div className="border-b border-border p-3 sm:p-4">
            <SegmentedControl
              label="Filter bills"
              options={filterOptions.map(({ label }) => label)}
              value={activeFilter.label}
              onChange={(next) =>
                setFilter(
                  filterOptions.find(({ label }) => label === next).value,
                )
              }
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No bills yet"
            description="Create Bills চাপলে এই মাসের সব ফ্ল্যাটের বিল তৈরি হবে।"
          />
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((bill) => (
              <BillRow
                key={bill._id}
                bill={bill}
                onOpen={() => setOpenId(bill._id)}
                onPay={() => setPayingId(bill._id)}
              />
            ))}
          </ul>
        )}
      </Card>

      {isGenerating && (
        <GenerateBillsModal
          month={month}
          propertyId={propertyId}
          onClose={() => setIsGenerating(false)}
        />
      )}
      {openBill && (
        <BillDetailsModal
          key={openBill._id}
          bill={openBill}
          onClose={() => setOpenId(null)}
        />
      )}
      {payingBill && (
        <PayModal
          key={payingBill._id}
          bill={payingBill}
          onClose={() => setPayingId(null)}
        />
      )}
    </div>
  );
};

export default BillBoard;
