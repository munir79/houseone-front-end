"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGenerateBillsMutation, useGetBillPreviewQuery } from "@/redux/features/bill/billApi";

const sumLines = (lines) => lines.reduce((sum, { amount }) => sum + amount, 0);

// সেভ করার আগে সব বিল দেখে নেওয়া — শুধু মাসে মাসে বদলানো টাকা এখানে লেখা হয়
// tenancyId — ইউনিটের পেজ থেকে শুধু ওই ভাড়াটিয়ার বিল
const GenerateBillsModal = ({ month, propertyId, tenancyId, onClose }) => {
  const [inputs, setInputs] = useState({});
  const { data, isLoading } = useGetBillPreviewQuery({ month, ...(propertyId ? { propertyId } : {}), ...(tenancyId ? { tenancyId } : {}) });
  const [generateBills, { isLoading: isSaving }] = useGenerateBillsMutation();

  const rows = data?.data?.rows || [];
  const inputOf = (row) => ({ include: true, electricity: "", extraName: "", extraAmount: "", advance: String(row.suggestedAdvance || ""), ...inputs[row.tenancyId] });
  const change = (row, update) => setInputs((prev) => ({ ...prev, [row.tenancyId]: { ...inputOf(row), ...update } }));

  const rowTotal = (row) => {
    const input = inputOf(row);
    return sumLines(row.lines) + Number(input.electricity || 0) + Number(input.extraAmount || 0) - Number(input.advance || 0);
  };

  const chosen = rows.filter((row) => inputOf(row).include);

  const handleCreate = async () => {
    const missing = chosen.find((row) => inputOf(row).extraAmount !== "" && !inputOf(row).extraName.trim());
    if (missing) {
      toast.error(`${missing.unitName}: বাড়তি টাকার নাম লিখুন`);
      return;
    }

    const body = chosen.map((row) => {
      const input = inputOf(row);
      return {
        tenancyId: row.tenancyId,
        electricity: input.electricity,
        advance: input.advance === "" ? 0 : input.advance,
        extras: input.extraAmount === "" ? [] : [{ name: input.extraName, amount: input.extraAmount }],
      };
    });

    try {
      await generateBills({ month, ...(propertyId ? { propertyId } : {}), rows: body }).unwrap();
      toast.success(`${toBanglaNumber(body.length)}টি বিল তৈরি হয়েছে`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "বিল তৈরি হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={`Create Bills · ${monthLabel(month)}`} onClose={onClose} size="lg">
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All bills are ready" description="এই মাসে সবার বিল আগেই তৈরি হয়েছে।" />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">দেখে নিন, দরকার হলে বদলান। Create Bills চাপার আগে কিছু সেভ হবে না।</p>

          {rows.map((row) => {
            const input = inputOf(row);
            return (
              <div key={row.tenancyId} data-preview-row={row.unitName} className="flex flex-col gap-3 rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <Checkbox
                    id={`bill-${row.tenancyId}`}
                    label={row.tenantName}
                    description={`${row.unitName}, ${row.propertyName}`}
                    checked={input.include}
                    onChange={(e) => change(row, { include: e.target.checked })}
                  />
                  <p data-preview-total className="shrink-0 pt-2 text-base font-bold tabular-nums">
                    {formatMoney(rowTotal(row))}
                  </p>
                </div>

                {input.include && (
                  <>
                    <ul className="flex flex-col gap-0.5 text-sm text-muted">
                      {row.lines.map(({ name, amount }, index) => (
                        <li key={index} className="flex justify-between gap-3">
                          <span className="min-w-0 wrap-break-word">{name}</span>
                          <span className="shrink-0 tabular-nums">{formatMoney(amount)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {row.needsElectricity && (
                        <Input id={`electricity-${row.tenancyId}`} type="number" inputMode="numeric" min="0" label="বিদ্যুৎ বিল (৳)" value={input.electricity} onChange={(e) => change(row, { electricity: e.target.value })} />
                      )}
                      {row.advanceLeft > 0 && (
                        <Input
                          id={`advance-${row.tenancyId}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          label={`Advance থেকে কাটুন (হাতে আছে ${formatMoney(row.advanceLeft)})`}
                          value={input.advance}
                          onChange={(e) => change(row, { advance: e.target.value })}
                        />
                      )}
                      <Input id={`extraName-${row.tenancyId}`} label="বাড়তি বা ছাড় (ঐচ্ছিক)" placeholder="যেমন: মেরামত" value={input.extraName} onChange={(e) => change(row, { extraName: e.target.value })} />
                      <Input id={`extraAmount-${row.tenancyId}`} type="number" inputMode="numeric" label="টাকা (ছাড় হলে − দিন)" value={input.extraAmount} onChange={(e) => change(row, { extraAmount: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isSaving} disabled={chosen.length === 0} onClick={handleCreate}>
              Create Bills ({chosen.length})
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default GenerateBillsModal;
