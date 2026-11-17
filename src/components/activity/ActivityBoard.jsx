"use client";

import { useState } from "react";
import { History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { BD_TIME_ZONE } from "@/lib/bdTime";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useClearActivityMutation, useDeleteActivityEntryMutation, useGetActivityQuery } from "@/redux/features/activity/activityApi";

const GROUPS = [
  { value: "", label: "সব কাজ" },
  { value: "money", label: "টাকা নেওয়া" },
  { value: "bill", label: "বিল" },
  { value: "expense", label: "খরচ" },
  { value: "tenant", label: "ভাড়াটিয়া" },
  { value: "property", label: "সম্পদ ও ইউনিট" },
  { value: "people", label: "অংশীদার ও অ্যাক্সেস" },
  { value: "issue", label: "অভিযোগ" },
];
const RANGES = [
  { value: "", label: "সব" },
  { value: "today", label: "আজ" },
  { value: "week", label: "৭ দিন" },
  { value: "month", label: "৩০ দিন" },
];
const CLEAR_TEXT = { today: "আজকের", week: "শেষ ৭ দিনের", month: "শেষ ৩০ দিনের" };

const dayKey = (date) => new Date(date).toLocaleDateString("en-CA", { timeZone: BD_TIME_ZONE });
const dayLabel = (key) => {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (key === today) return "আজ";
  if (key === yesterday) return "গতকাল";
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const timeOf = (date) => new Date(date).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: BD_TIME_ZONE });

// সম্পদের কাজের হিসাব — কে, কী, কখন, কত টাকা; মূল মালিক মুছতে পারেন, ২ মাস পর নিজে থেকে মোছে
const ActivityBoard = ({ propertyId }) => {
  const [actor, setActor] = useState("");
  const [group, setGroup] = useState("");
  const [range, setRange] = useState("");
  const [page, setPage] = useState(1);
  const [clearing, setClearing] = useState(null);
  const [removing, setRemoving] = useState(null);

  const { data, isLoading, isFetching } = useGetActivityQuery({ propertyId, actor, group, range, page });
  const [deleteEntry, { isLoading: isDeleting }] = useDeleteActivityEntryMutation();
  const [clearActivity, { isLoading: isClearing }] = useClearActivityMutation();
  const result = data?.data;
  const entries = result?.entries || [];
  const canDelete = !!result?.canDelete;

  const days = [];
  entries.forEach((entry) => {
    const key = dayKey(entry.createdAt);
    const last = days.at(-1);
    if (last?.key === key) last.entries.push(entry);
    else days.push({ key, entries: [entry] });
  });

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleRemove = async () => {
    try {
      await deleteEntry({ propertyId, entryId: removing._id }).unwrap();
      toast.success("মুছে ফেলা হয়েছে");
      setRemoving(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const handleClear = async () => {
    try {
      const response = await clearActivity({ propertyId, range: clearing }).unwrap();
      toast.success(`${toBanglaNumber(response.data.deleted)}টা কাজের হিসাব মুছে ফেলা হয়েছে`);
      setClearing(null);
      setPage(1);
    } catch (err) {
      toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <div data-activity-board className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          কে কখন কী করেছেন — টাকা নেওয়া, বিল, খরচ, ভাড়াটিয়া। ২ মাস পর নিজে থেকে মুছে যায়।
          {result?.since && " আপনি যোগ দেওয়ার দিন থেকে দেখছেন।"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            id="activityActor"
            label="কে করেছেন"
            options={[{ value: "", label: "সবাই" }, ...(result?.people || []).map(({ _id, name }) => ({ value: _id, label: name }))]}
            value={actor}
            onChange={(e) => resetPage(setActor)(e.target.value)}
          />
          <Select id="activityGroup" label="কোন কাজ" options={GROUPS} value={group} onChange={(e) => resetPage(setGroup)(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs label="Time range" tabs={RANGES} active={range} onChange={resetPage(setRange)} />
          {canDelete && (
            <div data-activity-clear className="flex flex-wrap gap-2">
              {Object.entries(CLEAR_TEXT).map(([value, label]) => (
                <Button key={value} variant="outline" size="sm" onClick={() => setClearing(value)}>
                  <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                  {label} মুছুন
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState icon={History} title="কোনো কাজের হিসাব নেই" description="এই সময়ে বা এই filter এ কিছু হয়নি।" />
        </Card>
      ) : (
        <div className={isFetching ? "flex flex-col gap-4 opacity-70" : "flex flex-col gap-4"}>
          {days.map(({ key, entries: list }) => (
            <Card key={key} flush className="overflow-hidden">
              <h2 className="border-b border-border px-4 py-2.5 text-sm font-bold">{dayLabel(key)}</h2>
              <ul className="divide-y divide-border">
                {list.map((entry) => (
                  <li key={entry._id} data-activity-row={entry.action} className="flex items-start gap-3 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary" aria-hidden="true">
                      {entry.actorName?.trim()?.[0] ?? "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm wrap-break-word">
                        <span className="font-semibold">{entry.actorName}</span> {entry.text}
                      </p>
                      <p className="text-xs text-muted">{timeOf(entry.createdAt)}</p>
                    </div>
                    {entry.amount ? <span className="shrink-0 text-sm font-bold tabular-nums">{formatMoney(entry.amount)}</span> : null}
                    {canDelete && entry.action !== "Cleared" && (
                      <button type="button" aria-label={`Delete: ${entry.text}`} onClick={() => setRemoving(entry)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <Pagination page={page} totalPages={result?.meta?.totalPages || 1} onChange={setPage} />
        </div>
      )}

      {removing && (
        <ConfirmDialog
          title="এই লাইন মুছবেন?"
          message="মুছলে আর ফেরত আসবে না। অংশীদার ও পরিবারের সদস্যরা দেখবেন যে একটা হিসাব মোছা হয়েছে।"
          confirmLabel="মুছুন"
          isLoading={isDeleting}
          onConfirm={handleRemove}
          onClose={() => setRemoving(null)}
        />
      )}
      {clearing && (
        <ConfirmDialog
          title={`${CLEAR_TEXT[clearing]} সব হিসাব মুছবেন?`}
          message="মুছলে আর ফেরত আসবে না। অংশীদার ও পরিবারের সদস্যরা দেখবেন কতগুলো হিসাব মোছা হয়েছে।"
          confirmLabel="মুছুন"
          isLoading={isClearing}
          onConfirm={handleClear}
          onClose={() => setClearing(null)}
        />
      )}
    </div>
  );
};

export default ActivityBoard;
