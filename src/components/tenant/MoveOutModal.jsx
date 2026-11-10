"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import SettlementModal from "./SettlementModal";
import GenerateBillsModal from "@/components/bill/GenerateBillsModal";
import PayModal from "@/components/payment/PayModal";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { monthLabel } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { PAYMENT_METHODS } from "@/lib/paymentOptions";
import { todayInput } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetTenancyBillsQuery } from "@/redux/features/bill/billApi";
import { useEndTenancyMutation, useGetMoveOutPreviewQuery } from "@/redux/features/tenancy/tenancyApi";

const STEPS = ["তারিখ ও বিল", "টাকার হিসাব", "জিনিস ফেরত"];

const Row = ({ label, value, strong, tone }) => (
  <div className={cn("flex justify-between gap-3", strong ? "text-base font-bold" : "text-sm", tone)}>
    <dt className="min-w-0 wrap-break-word">{label}</dt>
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

const Choice = ({ isActive, onClick, children, name }) => (
  <button
    type="button"
    data-refund-method={name}
    aria-pressed={isActive}
    onClick={onClick}
    className={cn("min-h-11 rounded-xl border px-3 text-sm font-semibold", isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-primary-soft")}
  >
    {children}
  </button>
);

// বাসা ছাড়া — শেষ মাসের বিল, বকেয়া ও Advance এর হিসাব, জিনিস ফেরত, শেষে বিদায়ী রসিদ
// onMovedOut — ইউনিটের পেজ যেন এই ভাড়াটিয়াকেই দেখাতে থাকে, নইলে রসিদ দেখার আগেই বন্ধ হয়
const MoveOutModal = ({ tenancy, onMovedOut, onClose }) => {
  const [step, setStep] = useState(0);
  const [endDate, setEndDate] = useState(todayInput);
  const [skipLastBill, setSkipLastBill] = useState(false);
  const [isBilling, setIsBilling] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [refundTrxId, setRefundTrxId] = useState("");
  const [returned, setReturned] = useState(() => new Set(tenancy.handoverItems.map((item, index) => (item.isReturned ? index : null)).filter((index) => index !== null)));
  const [finished, setFinished] = useState(null);

  const { data, isFetching, error } = useGetMoveOutPreviewQuery({ id: tenancy._id, endDate }, { skip: !endDate });
  const { data: billsData } = useGetTenancyBillsQuery(tenancy._id);
  const [endTenancy, { isLoading: isEnding }] = useEndTenancyMutation();

  const preview = data?.data;
  const payingBill = (billsData?.data || []).find(({ _id }) => _id === payingId);
  const canContinue = step === 0 ? Boolean(preview) && (preview.hasLastBill || skipLastBill) : true;

  const toggleItem = (index) =>
    setReturned((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const handleConfirm = async () => {
    try {
      const response = await endTenancy({
        id: tenancy._id,
        endDate,
        skipLastBill: !preview.hasLastBill && skipLastBill,
        returnedItems: [...returned],
        refundMethod: preview.refund > 0 ? refundMethod : undefined,
        refundTrxId: preview.refund > 0 && refundMethod !== "Cash" ? refundTrxId : undefined,
      }).unwrap();
      toast.success("ভাড়াটিয়া বাসা ছেড়েছেন, ইউনিট এখন Vacant");
      onMovedOut?.(tenancy._id);
      setFinished(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (finished) return <SettlementModal tenancy={finished} title="Moved out · Settlement ready" onClose={onClose} />;
  if (isBilling && preview) return <GenerateBillsModal month={preview.endMonth} tenancyId={tenancy._id} onClose={() => setIsBilling(false)} />;
  if (payingBill) return <PayModal key={payingBill._id} bill={payingBill} onClose={() => setPayingId(null)} />;

  return (
    <Modal title={`Move Out · ${tenancy.tenantName}`} onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        <ol className="grid grid-cols-3 gap-2" aria-label="Steps">
          {STEPS.map((label, index) => (
            <li key={label} aria-current={index === step ? "step" : undefined} className="flex flex-col gap-1.5">
              <span className={cn("h-1.5 rounded-full", index <= step ? "bg-primary" : "bg-border")} />
              <span className={cn("text-xs", index === step ? "font-semibold text-foreground" : "text-muted")}>
                {toBanglaNumber(index + 1)}. {label}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Input id="moveOutDate" type="date" label="কবে বাসা ছেড়েছেন" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            {error ? (
              <p className="text-sm text-danger">{getErrorMessage(error, "হিসাব আনা যায়নি।")}</p>
            ) : !preview || isFetching ? (
              <Skeleton className="h-16 w-full" />
            ) : preview.hasLastBill ? (
              <p data-last-bill="done" className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {monthLabel(preview.endMonth)} মাসের বিল হয়েছে
              </p>
            ) : (
              <div data-last-bill="missing" className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3">
                <p className="flex items-start gap-2 text-sm font-semibold text-warning-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {monthLabel(preview.endMonth)} মাসের বিল এখনো হয়নি। নিয়ম অনুযায়ী পুরো মাসের ভাড়া, বিদ্যুৎ বা বাড়তি খরচও এখানে যোগ করুন।
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button size="sm" onClick={() => setIsBilling(true)}>
                    বিল তৈরি করুন
                  </Button>
                  <Checkbox id="skipLastBill" label="এই মাসের বিল লাগবে না" checked={skipLastBill} onChange={(e) => setSkipLastBill(e.target.checked)} />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && preview && (
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col gap-1.5 rounded-xl bg-background p-3">
              <Row label="মোট বকেয়া" value={formatMoney(preview.totalDue)} />
              <Row label="Advance পেয়েছেন" value={formatMoney(preview.advanceReceived)} />
              {preview.advanceUsedBefore > 0 && <Row label="আগেই বিলে কাটা হয়েছে" value={`−${formatMoney(preview.advanceUsedBefore)}`} />}
              {preview.advanceApplied > 0 && <Row label="Advance থেকে বকেয়া শোধ" value={`−${formatMoney(preview.advanceApplied)}`} />}
              <div className="mt-1 border-t border-border pt-2">
                {preview.refund > 0 ? (
                  <Row label="ভাড়াটিয়াকে ফেরত দেবেন" value={formatMoney(preview.refund)} strong tone="text-primary" />
                ) : preview.unpaid > 0 ? (
                  <Row label="ভাড়াটিয়া আরও দেবেন" value={formatMoney(preview.unpaid)} strong tone="text-danger" />
                ) : (
                  <Row label="সব হিসাব মিটে গেছে" value={formatMoney(0)} strong />
                )}
              </div>
            </dl>

            {preview.refund > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">কীভাবে ফেরত দিলেন</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(({ value, label }) => (
                    <Choice key={value} name={value} isActive={refundMethod === value} onClick={() => setRefundMethod(value)}>
                      {label}
                    </Choice>
                  ))}
                </div>
                {refundMethod !== "Cash" && <Input id="refundTrx" label="Transaction ID (ঐচ্ছিক)" value={refundTrxId} onChange={(e) => setRefundTrxId(e.target.value)} />}
              </div>
            )}

            {preview.unpaid > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">এখন টাকা দিলে নিচে থেকে নিন। না দিলে বাকিটা &quot;আদায় হয়নি&quot; হিসেবে থাকবে, পরে দিলেও নেওয়া যাবে।</p>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {preview.bills.map((bill) => (
                    <li key={bill._id} data-open-bill={bill.month} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm">
                        {monthLabel(bill.month)} · <span className="font-semibold tabular-nums">{formatMoney(bill.balance)}</span>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setPayingId(bill._id)}>
                        টাকা নিন
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 2 && preview && (
          <div className="flex flex-col gap-3">
            {preview.items.length === 0 ? (
              <p className="text-sm text-muted">এই ভাড়াটিয়াকে কোনো চাবি বা কার্ড দেওয়ার তথ্য নেই।</p>
            ) : (
              <>
                <p className="text-sm text-muted">যেগুলো ফেরত পেয়েছেন তাতে ✓ দিন। ফেরত না দিলেও বাসা ছাড়া যাবে, রসিদে লেখা থাকবে।</p>
                <div className="flex flex-col">
                  {preview.items.map((item) => (
                    <Checkbox key={item.index} id={`item-${item.index}`} label={item.name} description={item.note} checked={returned.has(item.index)} onChange={() => toggleItem(item.index)} />
                  ))}
                </div>
              </>
            )}
            <p className="rounded-xl bg-background px-3 py-2.5 text-sm">
              নিশ্চিত করলে {tenancy.unitName} খালি হবে, আর তাঁর সব তথ্য ইতিহাসে থেকে যাবে।
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={step === 0 ? onClose : () => setStep(step - 1)}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!canContinue || isFetching} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button isLoading={isEnding} onClick={handleConfirm}>
              Confirm Move Out
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MoveOutModal;
