"use client";

import { useState } from "react";
import { toast } from "sonner";
import ReceiptModal from "./ReceiptModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { monthLabel } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { PAYMENT_METHODS } from "@/lib/paymentOptions";
import { todayInput } from "@/lib/tenancyOptions";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { usePayAdvanceMutation, usePayBillMutation } from "@/redux/features/payment/paymentApi";

const Choice = ({ isActive, onClick, children, name }) => (
  <button
    type="button"
    data-choice={name}
    aria-pressed={isActive}
    onClick={onClick}
    className={cn("min-h-11 rounded-xl border px-3 text-sm font-semibold", isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-primary-soft")}
  >
    {children}
  </button>
);

// bill দিলে মাসের ভাড়া, advance দিলে Advance — Confirm এর পরে রসিদ
const PayModal = ({ bill, advance, onClose }) => {
  const rentLine = bill?.lines.find(({ kind }) => kind === "Rent")?.amount ?? 0;
  const due = bill ? bill.balance : advance.due;

  const [mode, setMode] = useState(bill ? "Full" : "Custom");
  const [amount, setAmount] = useState(bill ? "" : String(advance.due));
  const [method, setMethod] = useState("Cash");
  const [paidAt, setPaidAt] = useState(todayInput);
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);

  const [payBill, { isLoading: isPayingBill }] = usePayBillMutation();
  const [payAdvance, { isLoading: isPayingAdvance }] = usePayAdvanceMutation();

  const willPay = mode === "Full" ? due : mode === "Rent" ? Math.min(rentLine, due) : Number(amount || 0);

  const handleConfirm = async () => {
    if (willPay < 1 || willPay > due) {
      setError(`১ থেকে ${formatMoney(due)} এর মধ্যে লিখুন`);
      return;
    }

    const details = { method, paidAt, trxId, note };
    try {
      const response = bill
        ? await payBill({ billId: bill._id, mode, amount: willPay, ...details }).unwrap()
        : await payAdvance({ tenancyId: advance.tenancyId, amount: willPay, ...details }).unwrap();
      toast.success("টাকা নেওয়া হয়েছে, রসিদ তৈরি");
      setPayment(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (payment) return <ReceiptModal payment={payment} title="Paid · Receipt ready" onClose={onClose} />;

  return (
    <Modal title={bill ? `Mark as Paid · ${monthLabel(bill.month)}` : "Receive Advance"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          {bill ? `${bill.tenantName} · ${bill.unitName}` : advance.label} · বাকি <span className="font-bold">{formatMoney(due)}</span>
        </p>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">কত টাকা</p>
          <div className="flex flex-wrap gap-2">
            {bill && (
              <Choice name="Full" isActive={mode === "Full"} onClick={() => setMode("Full")}>
                পুরো {formatMoney(due)}
              </Choice>
            )}
            {bill && rentLine > 0 && rentLine < due && (
              <Choice name="Rent" isActive={mode === "Rent"} onClick={() => setMode("Rent")}>
                শুধু বাসা ভাড়া {formatMoney(rentLine)}
              </Choice>
            )}
            <Choice name="Custom" isActive={mode === "Custom"} onClick={() => setMode("Custom")}>
              অন্য অঙ্ক
            </Choice>
          </div>
          {mode === "Custom" && (
            <Input
              id="payAmount"
              type="number"
              inputMode="numeric"
              min="1"
              label="টাকা (৳)"
              value={amount}
              onChange={(e) => {
                setAmount(toEnglishNumber(e.target.value));
                setError("");
              }}
              error={error}
            />
          )}
          {mode !== "Custom" && error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">কীভাবে দিলেন</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map(({ value, label }) => (
              <Choice key={value} name={value} isActive={method === value} onClick={() => setMethod(value)}>
                {label}
              </Choice>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input id="payDate" type="date" label="তারিখ" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          {method !== "Cash" && <Input id="payTrx" label="Transaction ID (ঐচ্ছিক)" value={trxId} onChange={(e) => setTrxId(e.target.value)} />}
        </div>
        <Input id="payNote" label="নোট (ঐচ্ছিক)" value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-bold">
            এখন নেবেন <span data-will-pay className="tabular-nums">{formatMoney(willPay)}</span>
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isPayingBill || isPayingAdvance} onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PayModal;
