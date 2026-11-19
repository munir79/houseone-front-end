"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { DEPOSIT_LABELS } from "@/lib/marketOptions";
import { PAYMENT_METHODS } from "@/lib/paymentOptions";
import { todayInput } from "@/lib/tenancyOptions";
import { usePayDepositMutation } from "@/redux/features/payment/paymentApi";

// অগ্রিম, সিকিউরিটি বা পজিশন মানির টাকা — প্রতিবার আলাদা রসিদ
// suggested — পজিশন মানিতে পরের কিস্তির বাকিটা, অন্যগুলোতে পুরো বাকি
const ReceiveDepositModal = ({ tenancy, kind, due, suggested, onClose }) => {
  const [amount, setAmount] = useState(String(suggested ?? due));
  const [method, setMethod] = useState("Cash");
  const [paidAt, setPaidAt] = useState(todayInput());
  const [trxId, setTrxId] = useState("");
  const [error, setError] = useState("");
  const [payDeposit, { isLoading }] = usePayDepositMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value < 1) return setError("টাকার পরিমাণ লিখুন");
    if (value > due) return setError(`বাকি আছে ${formatMoney(due)}, এর বেশি নেওয়া যাবে না`);

    try {
      await payDeposit({ tenancyId: tenancy._id, kind, amount: value, method, paidAt, trxId }).unwrap();
      toast.success(`${DEPOSIT_LABELS[kind]} ${formatMoney(value)} পেয়েছেন, রসিদ তৈরি হয়েছে`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "রসিদ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={`${DEPOSIT_LABELS[kind]} নিন`} onClose={onClose}>
      <form data-receive-deposit={kind} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {tenancy.market.businessName} · {tenancy.unitName} · বাকি {formatMoney(due)}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="depositAmount"
            type="number"
            inputMode="numeric"
            min="1"
            label="টাকা (৳)"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            error={error}
            className="col-span-2"
          />
          <Select id="depositMethod" label="কীভাবে পেলেন" options={PAYMENT_METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
          <Input id="depositDate" type="date" label="তারিখ" max={todayInput()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          {method !== "Cash" && <Input id="depositTrx" label="Transaction ID (ঐচ্ছিক)" value={trxId} onChange={(e) => setTrxId(e.target.value)} className="col-span-2" />}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            টাকা নিন
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReceiveDepositModal;
