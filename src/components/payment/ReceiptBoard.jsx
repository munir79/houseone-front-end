"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Download, FileText, Search, Send, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import ReceiptModal from "./ReceiptModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { monthLabel, monthOptions } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";
import { formatMoney } from "@/lib/formatMoney";
import { PAYMENT_METHODS, methodLabel } from "@/lib/paymentOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetReceiptsQuery, useLazyGetReceiptsQuery } from "@/redux/features/payment/paymentApi";

const KINDS = [
  { value: "", label: "All" },
  { value: "Bill", label: "Rent" },
  { value: "Advance", label: "Advance" },
  { value: "Refund", label: "Refund" },
];
const STATUS_OPTIONS = [
  { value: "", label: "Active" },
  { value: "Unsent", label: "Slip not sent" },
  { value: "Void", label: "Cancelled" },
];
const METHOD_OPTIONS = [{ value: "", label: "Any method" }, ...PAYMENT_METHODS];
const PERIODS = { current: "এই মাস", last: "গত মাস", older: "পুরনো" };
const SEARCH_DELAY_MS = 350;

// কোন বাবদ — ভাড়া হলে কোন মাসের
const purposeOf = (row) => (row.kind === "Refund" ? "Advance ফেরত" : row.kind === "Advance" ? "Advance" : `${monthLabel(row.month)} ভাড়া`);

// স্লিপ পাঠানো হয়েছে কি না — লেখা নয়, বোতাম; চাপলে রসিদ খোলে, পাঠানো হয় রসিদ দেখে
const SlipButton = ({ row, onOpen }) => {
  const isSent = Boolean(row.slipSentAt);
  return (
    <button
      type="button"
      data-slip-button={isSent ? "sent" : "not-sent"}
      onClick={onOpen}
      aria-label={`${isSent ? "Slip sent" : "Send slip"} to ${row.tenantName}`}
      title={isSent ? `${formatDate(row.slipSentAt)} তারিখে পাঠানো হয়েছে` : "রসিদ খুলে WhatsApp এ পাঠান"}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold whitespace-nowrap transition-colors",
        isSent ? "border-success/40 bg-success-soft text-success-foreground hover:border-success" : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      {isSent ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
      {isSent ? "Sent" : "Send Slip"}
    </button>
  );
};

const RowText = ({ row }) => (
  <span className="min-w-0 flex-1">
    <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
      <span className="wrap-break-word">{row.tenantName}</span>
      {row.receiptNo && <span className="text-xs font-medium text-muted">{row.receiptNo}</span>}
    </span>
    <span className="block text-sm wrap-break-word text-muted">
      {row.unitName}, {row.propertyName} · {purposeOf(row)}
    </span>
    <span className="block text-xs text-muted">
      {formatDate(row.paidAt)} · {[methodLabel(row.method), row.trxId].filter(Boolean).join(" · ")}
    </span>
  </span>
);

const ReceiptRow = ({ row, onOpen }) => {
  const isRefund = row.kind === "Refund";
  const isVoid = row.status === "Void";
  const amount = (
    <span className={cn("text-sm font-bold tabular-nums", isRefund && "text-danger", isVoid && "text-muted line-through")}>
      {isRefund ? `−${formatMoney(row.amount)}` : formatMoney(row.amount)}
    </span>
  );

  return (
    <li data-receipt-row={row.receiptNo || row._id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background">
      {isRefund ? (
        <Link href={`/tenants/${row.tenancy}`} className="flex min-w-0 flex-1 items-center">
          <RowText row={row} />
        </Link>
      ) : (
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center text-left">
          <RowText row={row} />
        </button>
      )}
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        {amount}
        {isRefund ? <Badge variant="warning">Refund</Badge> : isVoid ? <Badge variant="danger">Cancelled</Badge> : <SlipButton row={row} onOpen={onOpen} />}
      </span>
    </li>
  );
};

// সব রসিদ এক জায়গায় — সাধারণত এই মাস ও গত মাস, পুরনো মাস বেছে নিয়ে বা রসিদ নম্বরে খুঁজে
// propertyId — একটা সম্পদের ভেতরে; তখন বাড়ি বাছাই দেখায় না
const ReceiptBoard = ({ properties = [], propertyId: fixedPropertyId }) => {
  const months = useMemo(() => monthOptions(), []);
  // monthOptions: আগামী মাস, এই মাস, গত মাস, তারপর পুরনো
  const [currentOption, lastOption, ...olderOptions] = months.slice(1);

  const [period, setPeriod] = useState("current");
  const [olderMonth, setOlderMonth] = useState(olderOptions[0]?.value);
  const [propertyId, setPropertyId] = useState(fixedPropertyId ?? "");
  const [kind, setKind] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);

  const month = period === "current" ? currentOption.value : period === "last" ? lastOption.value : olderMonth;

  // লেখা থামলে খোঁজা — প্রতিটি অক্ষরে Request যায় না
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  // RTK Query মান দেখে মেলায়, তাই নতুন Object এ আবার Request যায় না
  const filters = Object.fromEntries(Object.entries({ month, propertyId, kind, method, status, search }).filter(([, value]) => value));
  const { data, isLoading, isFetching } = useGetReceiptsQuery({ ...filters, page });
  const [loadAll, { isFetching: isExporting }] = useLazyGetReceiptsQuery();

  const result = data?.data;
  const rows = result?.rows || [];
  const summary = result?.summary;
  const houseOptions = [{ value: "", label: "All houses" }, ...properties.map(({ _id, name }) => ({ value: _id, label: name }))];
  const openRow = rows.find(({ _id }) => _id === openId);

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const all = (await loadAll({ ...filters, all: "true" }).unwrap()).data.rows;
      if (all.length === 0) {
        toast.error("এই ফিল্টারে কোনো রসিদ নেই");
        return;
      }
      downloadCsv(
        `Receipts-${result?.month || "search"}.csv`,
        ["Receipt No", "Date", "Tenant", "Phone", "Flat", "House", "For", "Method", "Transaction ID", "Amount", "Status", "Slip sent"],
        all.map((row) => [
          row.receiptNo || "",
          formatDate(row.paidAt),
          row.tenantName,
          row.tenantPhone,
          row.unitName,
          row.propertyName,
          purposeOf(row),
          methodLabel(row.method),
          row.trxId || "",
          row.kind === "Refund" ? -row.amount : row.amount,
          row.kind === "Refund" ? "Refund" : row.status === "Void" ? "Cancelled" : "Active",
          row.kind === "Refund" ? "" : row.slipSentAt ? "Yes" : "No",
        ])
      );
    } catch {
      toast.error("ডাউনলোড হয়নি। আবার চেষ্টা করুন।");
    }
  };

  const mobile = (summary?.byMethod?.bKash || 0) + (summary?.byMethod?.Nagad || 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SegmentedControl
          label="Receipt month"
          options={Object.values(PERIODS)}
          value={PERIODS[period]}
          onChange={(label) => change(setPeriod)(Object.keys(PERIODS).find((key) => PERIODS[key] === label))}
        />
        {period === "older" && (
          <Select id="receiptMonth" compact aria-label="Older month" options={olderOptions} value={olderMonth} onChange={(e) => change(setOlderMonth)(e.target.value)} className="w-full sm:w-44" />
        )}
        {!fixedPropertyId && <Select id="receiptHouse" compact aria-label="House" options={houseOptions} value={propertyId} onChange={(e) => change(setPropertyId)(e.target.value)} className="w-full sm:w-48" />}
        <Button variant="outline" isLoading={isExporting} onClick={handleExport} className="sm:ml-auto">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download Excel
        </Button>
      </div>

      <StatStrip
        isLoading={isLoading}
        items={[
          { key: "received", label: "Received", value: formatMoney(summary?.received || 0), hint: `${summary?.count || 0} receipts`, icon: Wallet },
          { key: "cash", label: "Hand Cash", value: formatMoney(summary?.byMethod?.Cash || 0), icon: FileText, tone: "blue" },
          { key: "mobile", label: "bKash / Nagad", value: formatMoney(mobile), icon: Smartphone, tone: "violet" },
          {
            key: "unsent",
            label: "Slip not sent",
            value: summary?.unsent || 0,
            icon: Send,
            tone: "amber",
            onClick: summary?.unsent ? () => change(setStatus)("Unsent") : undefined,
          },
        ]}
      />

      <Card flush className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
          <SegmentedControl
            label="Receipt type"
            options={KINDS.map(({ label }) => label)}
            value={KINDS.find(({ value }) => value === kind).label}
            onChange={(label) => change(setKind)(KINDS.find((item) => item.label === label).value)}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Input
              id="receiptSearch"
              compact
              type="search"
              aria-label="Search receipts"
              placeholder="নাম, ফ্ল্যাট বা রসিদ নং"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
              className="w-full sm:w-72"
            />
            <Select id="receiptMethod" compact aria-label="Method" options={METHOD_OPTIONS} value={method} onChange={(e) => change(setMethod)(e.target.value)} className="w-full sm:w-40" />
            <Select id="receiptStatus" compact aria-label="Status" options={STATUS_OPTIONS} value={status} onChange={(e) => change(setStatus)(e.target.value)} className="w-full sm:w-44" />
          </div>
          {result && (
            <p data-receipt-month className="text-sm text-muted">
              {result.month ? <span className="font-semibold text-foreground">{monthLabel(result.month)}-এর রসিদ</span> : "রসিদ নম্বর দিয়ে সব মাসে খোঁজা হয়েছে"}
              {summary?.refunded > 0 && ` · Advance ফেরত দিয়েছেন ${formatMoney(summary.refunded)}`}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={FileText} title="No receipts" description="এই ফিল্টারে কোনো রসিদ নেই। মাস বা ফিল্টার বদলে দেখুন।" />
        ) : (
          <ul className={cn("divide-y divide-border transition-opacity", isFetching && "opacity-60")}>
            {rows.map((row) => (
              <ReceiptRow key={row._id} row={row} onOpen={() => setOpenId(row._id)} />
            ))}
          </ul>
        )}

        {result && result.pages > 1 && (
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span data-page className="text-sm text-muted">
              পাতা {toBanglaNumber(result.page)} / {toBanglaNumber(result.pages)} · মোট {toBanglaNumber(result.total)}টি
            </span>
            <Button variant="outline" size="sm" disabled={page >= result.pages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </Card>

      {openRow && <ReceiptModal key={openRow._id} payment={openRow} onClose={() => setOpenId(null)} />}
    </div>
  );
};

export default ReceiptBoard;
