"use client";

import { useState } from "react";
import { CalendarClock, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import ExpenseFormModal from "./ExpenseFormModal";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { methodLabel } from "@/lib/paymentOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetRecurringExpensesQuery, useStopRecurringExpenseMutation } from "@/redux/features/expense/expenseApi";

// প্রতি মাসের নিয়মিত খরচ — যোগ, বদলানো, বন্ধ
const RecurringModal = ({ properties, categories, fixedPropertyId, onClose }) => {
  const [editing, setEditing] = useState(undefined);
  const [stopping, setStopping] = useState(null);
  const { data, isLoading } = useGetRecurringExpensesQuery();
  const [stopRecurring, { isLoading: isStopping }] = useStopRecurringExpenseMutation();

  const items = (data?.data || []).filter(({ property }) => !fixedPropertyId || property === fixedPropertyId);

  const handleStop = async () => {
    try {
      await stopRecurring(stopping._id).unwrap();
      toast.success("প্রতি মাসের খরচ বন্ধ হয়েছে");
      setStopping(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (editing !== undefined) {
    return <ExpenseFormModal item={editing} isMonthly properties={properties} categories={categories} fixedPropertyId={fixedPropertyId} onClose={() => setEditing(undefined)} />;
  }

  return (
    <Modal title="Monthly Expenses" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">দারোয়ানের বেতনের মতো যে খরচ প্রতি মাসে হয়, একবার যোগ করুন। প্রতি মাসে নিজে থেকে &quot;দিতে হবে&quot; তালিকায় আসবে।</p>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : items.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No monthly expenses" description="এখনো কোনো প্রতি মাসের খরচ যোগ করা হয়নি।" />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((item) => (
              <li key={item._id} data-recurring-row={item.category} className="flex items-center gap-2 py-2 pr-1 pl-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold wrap-break-word">
                    {item.category} · {formatMoney(item.amount)}
                  </span>
                  <span className="block text-xs text-muted">
                    {[item.propertyName || "সব বাড়ি", item.unitName, item.paidTo, `প্রতি মাসের ${toBanglaNumber(item.dayOfMonth)} তারিখ`, methodLabel(item.method)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <button type="button" onClick={() => setEditing(item)} aria-label={`Edit ${item.category}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setStopping(item)} aria-label={`Stop ${item.category}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button onClick={() => setEditing(null)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Monthly Expense
        </Button>
      </div>

      {stopping && (
        <ConfirmDialog
          title="Stop monthly expense?"
          message={`"${stopping.category}" আর প্রতি মাসে আসবে না। এই মাসের না-দেওয়া খসড়াও মুছে যাবে, আগে দেওয়া খরচ থাকবে।`}
          confirmLabel="Stop"
          isLoading={isStopping}
          onConfirm={handleStop}
          onClose={() => setStopping(null)}
        />
      )}
    </Modal>
  );
};

export default RecurringModal;
