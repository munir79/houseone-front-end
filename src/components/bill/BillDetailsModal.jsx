"use client";

import { useState } from "react";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Button, { buttonClasses } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { billLastDay, billReminderLink, billStatus, isFixedLine, monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate } from "@/lib/tenancyOptions";
import { useAddBillAdjustmentMutation, useDeleteBillMutation, useUpdateBillMutation } from "@/redux/features/bill/billApi";

const BillDetailsModal = ({ bill, onClose }) => {
  const [editing, setEditing] = useState(null);
  const [adjust, setAdjust] = useState({ name: "", amount: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const [updateBill, { isLoading: isSaving }] = useUpdateBillMutation();
  const [addAdjustment, { isLoading: isAdjusting }] = useAddBillAdjustmentMutation();
  const [deleteBill, { isLoading: isRemoving }] = useDeleteBillMutation();

  const status = billStatus(bill);
  const isCarried = bill.status === "Carried";
  const canEdit = !isCarried && bill.paid === 0;
  const canAdjust = !isCarried && bill.paid > 0;
  const canRemind = !isCarried && bill.balance > 0;

  const handleSave = async () => {
    if (editing.some(({ name, amount }) => !name.trim() || amount === "")) {
      toast.error("প্রতিটি লাইনের নাম ও টাকা লিখুন");
      return;
    }

    try {
      await updateBill({ id: bill._id, lines: editing }).unwrap();
      toast.success("বিল সেভ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const handleAdjust = async () => {
    if (!adjust.name.trim() || adjust.amount === "") {
      toast.error("Adjustment-এর নাম ও টাকা লিখুন");
      return;
    }

    try {
      await addAdjustment({ id: bill._id, ...adjust }).unwrap();
      toast.success("Adjustment যোগ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBill(bill._id).unwrap();
      toast.success("বিল মুছে গেছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "মোছা যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  const changeLine = (index, update) => setEditing((prev) => prev.map((line, lineIndex) => (lineIndex === index ? { ...line, ...update } : line)));

  return (
    <>
      <Modal title={`${bill.unitName} · ${monthLabel(bill.month)}`} onClose={onClose} size="lg">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-semibold wrap-break-word">{bill.tenantName}</p>
              <p className="text-sm text-muted">শেষ তারিখ {formatDate(billLastDay(bill))}</p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          {editing ? (
            <div className="flex flex-col gap-2">
              {editing.map((line, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input id={`lineName-${index}`} aria-label={`Line ${index + 1} name`} value={line.name} onChange={(e) => changeLine(index, { name: e.target.value })} className="min-w-0 flex-1" />
                  <Input
                    id={`lineAmount-${index}`}
                    type="number"
                    inputMode="numeric"
                    aria-label={`Line ${index + 1} amount`}
                    value={line.amount}
                    onChange={(e) => changeLine(index, { amount: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="w-28 shrink-0"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setEditing((prev) => [...prev, { kind: "Extra", name: "", amount: 0 }])} className="w-fit">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Line
              </Button>
              <p className="text-sm text-muted">আগের বকেয়া ও Advance-এর লাইন এখানে বদলায় না।</p>
            </div>
          ) : (
            <dl className="flex flex-col gap-1.5">
              {bill.lines.map(({ name, amount }, index) => (
                <div key={index} className="flex justify-between gap-3 text-sm">
                  <dt className="min-w-0 wrap-break-word">{name}</dt>
                  <dd className="shrink-0 tabular-nums">{formatMoney(amount)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-bold">
                <dt>মোট</dt>
                <dd data-bill-total className="tabular-nums">
                  {formatMoney(bill.total)}
                </dd>
              </div>
              {bill.paid > 0 && (
                <div className="flex justify-between gap-3 text-sm">
                  <dt>দিয়েছেন</dt>
                  <dd className="tabular-nums">{formatMoney(bill.paid)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 text-sm font-semibold">
                <dt>বাকি</dt>
                <dd className="tabular-nums">{formatMoney(bill.balance)}</dd>
              </div>
            </dl>
          )}

          {isCarried && <p className="text-sm text-muted">এই বাকি পরের মাসের বিলে যোগ হয়েছে। বদলাতে হলে পরের বিলটি বদলান।</p>}

          {canAdjust && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-sm font-medium">টাকা নেওয়া শুরু হয়েছে, তাই শুধু Adjustment করা যাবে</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto] sm:items-end">
                <Input id="adjustName" label="নাম" placeholder="যেমন: ছাড়" value={adjust.name} onChange={(e) => setAdjust((prev) => ({ ...prev, name: e.target.value }))} />
                <Input id="adjustAmount" type="number" inputMode="numeric" label="টাকা (ছাড় হলে −)" value={adjust.amount} onChange={(e) => setAdjust((prev) => ({ ...prev, amount: e.target.value }))} />
                <Button variant="outline" isLoading={isAdjusting} onClick={handleAdjust}>
                  Add
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            {canEdit && !editing && (
              <Button variant="ghost" onClick={() => setIsDeleting(true)} className="mr-auto text-danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            )}
            {canRemind && !editing && (
              <a href={billReminderLink(bill)} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "outline" })}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {canEdit && !editing && <Button onClick={() => setEditing(bill.lines.filter((line) => !isFixedLine(line)).map(({ kind, name, amount }) => ({ kind, name, amount })))}>Edit Bill</Button>}
            {editing && (
              <>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button isLoading={isSaving} onClick={handleSave}>
                  Save Bill
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {isDeleting && (
        <ConfirmDialog
          title="Delete bill?"
          message="এই বিল মুছে যাবে। আগের বকেয়া আর Advance আগের জায়গায় ফিরবে।"
          confirmLabel="Delete Bill"
          isLoading={isRemoving}
          onConfirm={handleDelete}
          onClose={() => setIsDeleting(false)}
        />
      )}
    </>
  );
};

export default BillDetailsModal;
