"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { CalendarClock, ChevronLeft, ChevronRight, CircleDollarSign, Download, Paperclip, Plus, Receipt, Trash2, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import ExpenseFormModal from "./ExpenseFormModal";
import PayExpenseModal from "./PayExpenseModal";
import RecurringModal from "./RecurringModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { monthLabel, monthOptions } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { methodLabel } from "@/lib/paymentOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useDeleteExpenseMutation, useGetExpensesQuery, useLazyGetExpensesQuery } from "@/redux/features/expense/expenseApi";

const PERIODS = { current: "এই মাস", last: "গত মাস", older: "পুরনো" };
const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Due", label: "দিতে হবে" },
  { value: "Paid", label: "দেওয়া হয়েছে" },
];
const MAX_CATEGORY_BARS = 4;

const placeOf = (row) => [row.propertyName || "সব বাড়ি", row.unitName].filter(Boolean).join(" · ");

const ExpenseRow = ({ row, onEdit, onPay, onDelete }) => {
  const isDue = row.status === "Due";
  return (
    <li data-expense-row={row.category} data-expense-status={row.status} className="flex items-center gap-2 py-3 pr-2 pl-4 transition-colors hover:bg-background">
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-center text-left">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
            <span className="wrap-break-word">{row.category}</span>
            {row.recurring && <Badge variant="info">প্রতি মাসে</Badge>}
          </span>
          <span className="block text-sm wrap-break-word text-muted">
            {placeOf(row)}
            {row.paidTo && ` · ${row.paidTo}`}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            {isDue ? "এখনো দেওয়া হয়নি" : `${formatDate(row.paidAt)} · ${methodLabel(row.method)}`}
            {row.photos.length > 0 && (
              <span className="inline-flex items-center gap-0.5" aria-label={`${row.photos.length} photos`}>
                · <Paperclip className="h-3 w-3" aria-hidden="true" /> {toBanglaNumber(row.photos.length)}
              </span>
            )}
          </span>
        </span>
      </button>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={cn("text-sm font-bold tabular-nums", isDue && "text-muted")}>{formatMoney(row.amount)}</span>
        {isDue ? (
          <button
            type="button"
            onClick={onPay}
            aria-label={`Mark ${row.category} as paid`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 text-xs font-semibold whitespace-nowrap text-primary-foreground hover:bg-primary/90"
          >
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            Mark Paid
          </button>
        ) : (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${row.category}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </span>
    </li>
  );
};

// ধরন অনুযায়ী খরচ — সবচেয়ে বড়গুলো, বাকিগুলো একসাথে
const CategoryBreakdown = ({ byCategory, total }) => {
  if (byCategory.length === 0) return null;
  const top = byCategory.slice(0, MAX_CATEGORY_BARS);
  const rest = byCategory.slice(MAX_CATEGORY_BARS).reduce((sum, { amount }) => sum + amount, 0);
  const rows = rest > 0 ? [...top, { category: "অন্য সব", amount: rest }] : top;

  return (
    <Card data-category-breakdown className="flex flex-col gap-3">
      <h2 className="text-base font-bold">ধরন অনুযায়ী খরচ</h2>
      <ul className="flex flex-col gap-2.5">
        {rows.map(({ category, amount }) => (
          <li key={category} className="flex flex-col gap-1">
            <span className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 wrap-break-word">{category}</span>
              <span className="shrink-0 font-semibold tabular-nums">{formatMoney(amount)}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-border/70" aria-hidden="true">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${total ? Math.max(2, (amount / total) * 100) : 0}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

// খরচের তালিকা — Expenses পাতা ও বাড়ির Expenses tab এ একই; propertyId দিলে শুধু ওই বাড়ি
const ExpenseBoard = ({ properties, propertyId: fixedPropertyId }) => {
  const months = useMemo(() => monthOptions(), []);
  const [currentOption, lastOption, ...olderOptions] = months.slice(1);

  const [period, setPeriod] = useState("current");
  const [olderMonth, setOlderMonth] = useState(olderOptions[0]?.value);
  const [house, setHouse] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [paying, setPaying] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);

  const month = period === "current" ? currentOption.value : period === "last" ? lastOption.value : olderMonth;
  const propertyId = fixedPropertyId || house;
  // RTK Query মান দেখে মেলায়, তাই নতুন Object এ আবার Request যায় না
  const { world } = useWorkspace();
  const filters = Object.fromEntries(Object.entries({ month, propertyId, category, status, world: propertyId ? "" : world }).filter(([, value]) => value));

  const { data, isLoading, isFetching } = useGetExpensesQuery({ ...filters, page });
  const [loadAll, { isFetching: isExporting }] = useLazyGetExpensesQuery();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const result = data?.data;
  const rows = result?.rows || [];
  const summary = result?.summary;
  const categories = result?.categories || [];
  // সাধারণ খরচ (কোনো সম্পদের নয়) বাড়ির জগতে থাকে
  const houseOptions = [
    { value: "", label: world === "market" ? "সব মার্কেট" : "All houses" },
    ...properties.map(({ _id, name }) => ({ value: _id, label: name })),
    ...(world === "market" ? [] : [{ value: "general", label: "সাধারণ খরচ" }]),
  ];
  const categoryOptions = [{ value: "", label: "সব ধরন" }, ...categories.map((item) => ({ value: item, label: item }))];

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleDelete = async () => {
    try {
      await deleteExpense(deleting._id).unwrap();
      toast.success("খরচ মুছে গেছে");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "মোছা যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  const handleExport = async () => {
    try {
      const all = (await loadAll({ ...filters, all: "true" }).unwrap()).data.rows;
      if (all.length === 0) {
        toast.error("এই ফিল্টারে কোনো খরচ নেই");
        return;
      }
      downloadCsv(
        `Expenses-${month}.csv`,
        ["Date", "Category", "House", "Flat", "Paid to", "Method", "Amount", "Status", "Note"],
        all.map((row) => [row.paidAt ? formatDate(row.paidAt) : "", row.category, row.propertyName || "All houses", row.unitName, row.paidTo, methodLabel(row.method), row.amount, row.status === "Paid" ? "Paid" : "Due", row.note])
      );
    } catch {
      toast.error("ডাউনলোড হয়নি। আবার চেষ্টা করুন।");
    }
  };

  const formProps = { properties, categories, fixedPropertyId };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SegmentedControl
          label="Expense month"
          options={Object.values(PERIODS)}
          value={PERIODS[period]}
          onChange={(label) => change(setPeriod)(Object.keys(PERIODS).find((key) => PERIODS[key] === label))}
        />
        {period === "older" && (
          <Select id="expenseMonth" compact aria-label="Older month" options={olderOptions} value={olderMonth} onChange={(e) => change(setOlderMonth)(e.target.value)} className="w-full sm:w-44" />
        )}
        {!fixedPropertyId && <Select id="expenseHouseFilter" compact aria-label="House" options={houseOptions} value={house} onChange={(e) => change(setHouse)(e.target.value)} className="w-full sm:w-48" />}
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button variant="outline" onClick={() => setIsMonthlyOpen(true)} className="flex-1 sm:flex-none">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Monthly
          </Button>
          <Button onClick={() => setForm({ item: null })} className="flex-1 sm:flex-none" disabled={!result}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Expense
          </Button>
        </div>
      </div>

      <StatStrip
        isLoading={isLoading}
        items={[
          { key: "income", label: "আদায়", value: formatMoney(summary?.income || 0), icon: Wallet },
          { key: "expense", label: "খরচ", value: formatMoney(summary?.total || 0), hint: summary?.count ? `${summary.count} items` : undefined, icon: Receipt, tone: "amber" },
          {
            key: "profit",
            label: "লাভ",
            value: formatMoney(summary?.profit || 0),
            icon: TrendingUp,
            tone: (summary?.profit || 0) < 0 ? "red" : "green",
          },
          {
            key: "dueExpense",
            label: "দিতে হবে",
            value: formatMoney(summary?.dueAmount || 0),
            hint: summary?.dueCount ? `${summary.dueCount} items` : undefined,
            icon: CircleDollarSign,
            tone: "violet",
            onClick: summary?.dueCount ? () => change(setStatus)("Due") : undefined,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card flush className="overflow-hidden lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <SegmentedControl
                label="Expense status"
                options={STATUS_OPTIONS.map(({ label }) => label)}
                value={STATUS_OPTIONS.find(({ value }) => value === status).label}
                onChange={(label) => change(setStatus)(STATUS_OPTIONS.find((item) => item.label === label).value)}
              />
              <Select id="expenseCategoryFilter" compact aria-label="Category" options={categoryOptions} value={category} onChange={(e) => change(setCategory)(e.target.value)} className="w-full sm:w-52" />
              <Button variant="ghost" size="sm" isLoading={isExporting} onClick={handleExport} className="sm:ml-auto">
                <Download className="h-4 w-4" aria-hidden="true" />
                Excel
              </Button>
            </div>
            {result && <p data-expense-month className="text-sm font-semibold">{monthLabel(result.month)}-এর খরচ</p>}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses" description="এই মাসে কোনো খরচ নেই। Add Expense চেপে মেরামত, বেতন বা বিলের খরচ লিখে রাখুন।" />
          ) : (
            <ul className={cn("divide-y divide-border transition-opacity", isFetching && "opacity-60")}>
              {rows.map((row) => (
                <ExpenseRow key={row._id} row={row} onEdit={() => setForm({ item: row })} onPay={() => setPaying(row)} onDelete={() => setDeleting(row)} />
              ))}
            </ul>
          )}

          {result && result.pages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-muted">
                পাতা {toBanglaNumber(result.page)} / {toBanglaNumber(result.pages)}
              </span>
              <Button variant="outline" size="sm" disabled={page >= result.pages} onClick={() => setPage(page + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-4">{summary && <CategoryBreakdown byCategory={summary.byCategory} total={summary.total} />}</div>
      </div>

      {form && <ExpenseFormModal key={form.item?._id ?? "new"} item={form.item} {...formProps} onClose={() => setForm(null)} />}
      {paying && <PayExpenseModal key={paying._id} expense={paying} onClose={() => setPaying(null)} />}
      {isMonthlyOpen && <RecurringModal {...formProps} onClose={() => setIsMonthlyOpen(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete expense?"
          message={`${deleting.category} · ${formatMoney(deleting.amount)} মুছে যাবে, ছবিও।`}
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

export default ExpenseBoard;
