"use client";

import Checkbox from "@/components/ui/Checkbox";
import FormSection from "@/components/ui/FormSection";
import Select from "@/components/ui/Select";
import { formatMoney } from "@/lib/formatMoney";
import { DEPOSIT_LABELS, advanceOf } from "@/lib/marketOptions";
import { PAYMENT_METHODS } from "@/lib/paymentOptions";
import { todayInput } from "@/lib/tenancyOptions";

// চুক্তির দিনে যা নেওয়ার কথা — সিকিউরিটি, অগ্রিম, পজিশন মানি (কিস্তিতে হলে প্রথম কিস্তি)
export const receivableOf = (contract) => {
  const position = Number(contract.positionTotal || 0);
  const firstInstallment = contract.positionMode === "Installments" ? Number(contract.installments[0]?.amount || 0) : position;
  return [
    { kind: "Security", amount: Number(contract.security || 0) },
    { kind: "Advance", amount: advanceOf(contract) },
    { kind: "Position", amount: position > 0 ? firstInstallment : 0, hint: contract.positionMode === "Installments" ? "প্রথম কিস্তি" : "" },
  ].filter(({ amount }) => amount > 0);
};

// টিক দেওয়া প্রতিটির আলাদা রসিদ — দোকান ভাড়ার সাথে একই অনুরোধে Server এ যায়
// (ভাড়া হলেই পাতা বদলে যায়, তাই আলাদা অনুরোধ পাঠানোর আগে Modal বন্ধ হয়ে যেতে পারে)
export const receiptsBody = ({ contract, received, method }) => {
  const today = todayInput();
  return {
    receipts: receivableOf(contract).filter(({ kind }) => received[kind]).map(({ kind, amount }) => ({ kind, amount })),
    receiptMethod: method,
    receiptDate: contract.startDate && contract.startDate <= today ? contract.startDate : today,
  };
};

// একটা রসিদ না হলেও দোকান ভাড়া হয়ে থাকে — পরে চুক্তির পাতা থেকে নেওয়া যায়
export const rentedMessage = (receipts) => {
  const failed = receipts?.failed ?? [];
  if (failed.length > 0) return { type: "warning", text: `দোকান ভাড়া হয়েছে, কিন্তু ${failed.map(({ kind }) => DEPOSIT_LABELS[kind]).join(", ")}-এর রসিদ হয়নি। চুক্তির পাতা থেকে আবার নিন।` };
  const taken = receipts?.taken?.length ?? 0;
  return { type: "success", text: taken > 0 ? `দোকান ভাড়া হয়েছে, ${taken}টি রসিদ তৈরি হয়েছে` : "দোকান ভাড়া হয়েছে" };
};

const ReceiveToday = ({ contract, received, onReceivedChange, method, onMethodChange }) => {
  const receivable = receivableOf(contract);
  if (receivable.length === 0) return null;

  return (
    <FormSection title="আজ যা হাতে পেলেন">
      <div data-receive-today className="flex flex-col">
        {receivable.map(({ kind, amount, hint }) => (
          <Checkbox
            key={kind}
            id={`receive-${kind}`}
            label={`${DEPOSIT_LABELS[kind]}${hint ? ` (${hint})` : ""} · ${formatMoney(amount)}`}
            checked={Boolean(received[kind])}
            onChange={(e) => onReceivedChange({ ...received, [kind]: e.target.checked })}
          />
        ))}
      </div>
      {Object.values(received).some(Boolean) && <Select id="receiveMethod" label="কীভাবে পেলেন" options={PAYMENT_METHODS} value={method} onChange={(e) => onMethodChange(e.target.value)} />}
      <p className="text-xs text-muted">টিক দেওয়া প্রতিটির আলাদা রসিদ হবে। যা এখনো পাননি, চুক্তির পাতায় &quot;বাকি&quot; দেখাবে।</p>
    </FormSection>
  );
};

export default ReceiveToday;
