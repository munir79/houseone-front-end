"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { PAYMENT_METHODS } from "@/lib/paymentOptions";
import { todayInput } from "@/lib/tenancyOptions";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { usePayExpenseMutation } from "@/redux/features/expense/expenseApi";

// প্রতি মাসের খরচ দেওয়া হলো — এই মাসে অঙ্ক আলাদা হলে এখানেই বদলানো যায়
const PayExpenseModal = ({ expense, onClose }) => {
  const [amount, setAmount] = useState(String(expense.amount));
  const [paidAt, setPaidAt] = useState(todayInput);
  const [method, setMethod] = useState(expense.method);
  const [payExpense, { isLoading }] = usePayExpenseMutation();

  const handleConfirm = async () => {
    if (!(Number(amount) >= 1)) {
      toast.error("টাকা লিখুন");
      return;
    }
    try {
      await payExpense({ id: expense._id, amount: Number(amount), paidAt, method }).unwrap();
      toast.success("খরচ দেওয়া হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={`Mark Paid · ${expense.category}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {[expense.propertyName || "সব বাড়ি", expense.unitName, expense.paidTo].filter(Boolean).join(" · ")} · সাধারণত {formatMoney(expense.amount)}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input id="payExpenseAmount" inputMode="numeric" label="টাকা (৳)" value={amount} onChange={(e) => setAmount(toEnglishNumber(e.target.value).replace(/\D/g, ""))} />
          <Input id="payExpenseDate" type="date" label="তারিখ" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={method === value}
              onClick={() => setMethod(value)}
              className={cn("min-h-11 rounded-xl border px-3 text-sm font-semibold", method === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-primary-soft")}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PayExpenseModal;
