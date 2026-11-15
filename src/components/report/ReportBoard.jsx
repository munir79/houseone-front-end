"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Building2, Check, ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import ReportView from "./ReportView";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { bdDateInput } from "@/lib/bdTime";
import { monthLabel } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { downloadPdf } from "@/lib/pdf";
import { useGetReportQuery } from "@/redux/features/report/reportApi";

const PERIODS = { thisMonth: "এই মাস", lastMonth: "গত মাস", thisYear: "এই বছর", lastYear: "গত বছর", custom: "নিজে বাছুন" };

const pad = (number) => String(number).padStart(2, "0");
const lastDay = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// বাংলাদেশের আজকের তারিখ থেকে সময়ের শুরু ও শেষ
const rangeOf = (period) => {
  const [year, month] = bdDateInput().split("-").map(Number);
  if (period === "thisMonth") return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${lastDay(year, month)}` };
  if (period === "lastMonth") {
    const [y, m] = month === 1 ? [year - 1, 12] : [year, month - 1];
    return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${lastDay(y, m)}` };
  }
  if (period === "thisYear") return { from: `${year}-01-01`, to: `${year}-12-31` };
  return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
};

// সব বাড়ি, একটি, বা কয়েকটি — টিক দিয়ে
const HousePicker = ({ properties, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event) => !boxRef.current?.contains(event.target) && setIsOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  const label = selected.length === 0 ? "সব বাড়ি" : selected.length === 1 ? properties.find(({ _id }) => _id === selected[0])?.name ?? "১টি বাড়ি" : `${selected.length}টি বাড়ি`;
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);

  return (
    <div ref={boxRef} className="relative w-full sm:w-56">
      <button
        type="button"
        data-house-picker
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium md:min-h-10"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </button>
      {isOpen && (
        <div role="listbox" aria-multiselectable="true" className="absolute top-full left-0 z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-card">
          {[{ _id: "", name: "সব বাড়ি" }, ...properties].map(({ _id, name }) => {
            const isChecked = _id ? selected.includes(_id) : selected.length === 0;
            return (
              <button
                key={_id || "all"}
                type="button"
                role="option"
                aria-selected={isChecked}
                data-house-option={name}
                onClick={() => (_id ? toggle(_id) : onChange([]))}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-background"
              >
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border", isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                  {isChecked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 wrap-break-word">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// রিপোর্ট — সময় ও বাড়ি বেছে, পর্দায় দেখা, PDF ও Excel
const ReportBoard = ({ properties, initialHouse }) => {
  const viewRef = useRef(null);
  const [period, setPeriod] = useState("thisMonth");
  const [custom, setCustom] = useState(() => rangeOf("thisMonth"));
  const [selected, setSelected] = useState(initialHouse ? [initialHouse] : []);
  const [isWorking, setIsWorking] = useState(false);

  const range = period === "custom" ? custom : rangeOf(period);
  const isRangeValid = range.from && range.to && range.from <= range.to;
  const { data, error, isFetching } = useGetReportQuery({ ...range, ...(selected.length ? { propertyIds: selected.join(",") } : {}) }, { skip: !isRangeValid });

  const report = data?.data;
  const fileBase = report ? `Report-${report.isAll ? "All" : report.houses.map(({ name }) => name).join("-")}-${range.from}-to-${range.to}`.replace(/\s+/g, "-") : "Report";

  const handlePdf = async () => {
    setIsWorking(true);
    try {
      await downloadPdf(viewRef.current, `${fileBase}.pdf`);
    } catch {
      toast.error("PDF তৈরি হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsWorking(false);
    }
  };

  const handleExcel = () => {
    const { summary } = report;
    const blank = [""];
    downloadCsv(`${fileBase}.csv`, ["HouseOne Report", report.isAll ? "All houses" : report.houses.map(({ name }) => name).join(", "), `${range.from} to ${range.to}`], [
      blank,
      ["Profit and loss"],
      ...summary.incomeBreakdown.map(({ label, amount }) => ["Income", label, amount]),
      ["Income", "Total", summary.income],
      ...summary.byCategory.map(({ category, amount }) => ["Expense", category, -amount]),
      ["Expense", "Total", -summary.expenses],
      ["Net", summary.profit < 0 ? "Loss" : "Profit", summary.profit],
      blank,
      ["Due now", summary.dueNow],
      ["Advance held", summary.advanceHeld],
      ["Advance received in period", summary.advanceReceived],
      ["Advance refunded in period", summary.advanceRefunded],
      blank,
      ["Month", "Income", "Expenses", "Profit"],
      ...report.monthly.map((row) => [monthLabel(row.month), row.income, row.expenses, row.profit]),
      blank,
      ["House", "Income", "Expenses", "Profit", "Occupied", "Units", "Due"],
      ...report.byHouse.map((house) => [house.name, house.income, house.expenses, house.profit, house.occupied, house.units, house.due]),
      blank,
      ["Tenant", "Phone", "Flat", "House", "Paid", "Due", "Late bills", "Bills", "Status"],
      ...report.byTenant.map((row) => [row.tenantName, row.tenantPhone, row.unitName, row.propertyName, row.paid, row.due, row.late, row.bills, row.status]),
      blank,
      ["Person", "Rent collected", "Expenses paid"],
      ...report.collectedBy.map((person) => [person.name, person.collected, person.spent]),
    ]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SegmentedControl label="Report period" options={Object.values(PERIODS)} value={PERIODS[period]} onChange={(label) => setPeriod(Object.keys(PERIODS).find((key) => PERIODS[key] === label))} />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          {period === "custom" && (
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Input id="reportFrom" type="date" compact aria-label="From" value={custom.from} onChange={(e) => setCustom((prev) => ({ ...prev, from: e.target.value }))} className="sm:w-44" />
              <Input id="reportTo" type="date" compact aria-label="To" value={custom.to} onChange={(e) => setCustom((prev) => ({ ...prev, to: e.target.value }))} className="sm:w-44" />
            </div>
          )}
          <HousePicker properties={properties} selected={selected} onChange={setSelected} />
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" disabled={!report || isFetching} onClick={handleExcel} className="flex-1 sm:flex-none">
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              Excel
            </Button>
            <Button disabled={!report || isFetching} isLoading={isWorking} onClick={handlePdf} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4" aria-hidden="true" />
              PDF
            </Button>
          </div>
        </div>
        {!isRangeValid && <p className="text-sm text-danger">শুরুর তারিখ শেষের তারিখের আগে দিন</p>}
      </div>

      {error ? (
        <Card>
          <EmptyState icon={BarChart3} title="Report not ready" description={getErrorMessage(error, "রিপোর্ট আনা যায়নি। আবার চেষ্টা করুন।")} />
        </Card>
      ) : !report ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className={cn("transition-opacity", isFetching && "opacity-60")}>
          <ReportView ref={viewRef} report={report} />
        </div>
      )}
    </div>
  );
};

export default ReportBoard;
