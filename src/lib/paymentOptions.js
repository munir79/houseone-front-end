import { monthLabel } from "./billOptions";
import { formatMoney } from "./formatMoney";
import { formatDate } from "./tenancyOptions";

// বাংলাদেশে বেশিরভাগ ভাড়া হাতে নগদ, তাই Hand Cash আগে
export const PAYMENT_METHODS = [
  { value: "Cash", label: "Hand Cash" },
  { value: "bKash", label: "bKash" },
  { value: "Nagad", label: "Nagad" },
  { value: "Bank", label: "Bank" },
  { value: "Other", label: "Other" },
];

export const methodLabel = (method) => PAYMENT_METHODS.find(({ value }) => value === method)?.label ?? method;

export const receiptLink = (token) => `${window.location.origin}/receipt/${token}`;

export const receiptFileName = (payment) => `Receipt-${payment.receiptNo}.pdf`;

// WhatsApp এর ধন্যবাদ বার্তা — রসিদের সাথে যায়
export const receiptMessage = (payment) => {
  const purpose = payment.kind === "Advance" ? "Advance বাবদ" : `${monthLabel(payment.month)} মাসের ভাড়া বাবদ`;
  const due = payment.dueAfter > 0 ? ` এখনো বাকি ${formatMoney(payment.dueAfter)}।` : "";
  return `${payment.tenantName}, ধন্যবাদ! ${payment.unitName}, ${payment.propertyName}-এর ${purpose} ${formatMoney(payment.amount)} বুঝে পেয়েছি (${formatDate(payment.paidAt)})।${due} রসিদ নং ${payment.receiptNo}। রসিদ দেখুন: ${receiptLink(payment.token)}`;
};

// বিলের তালিকায় ছোট লেখা: bKash · 7 Nov · Slip sent
export const lastPaymentLine = ({ lastPayment }) =>
  lastPayment ? `${methodLabel(lastPayment.method)} · ${formatDate(lastPayment.paidAt)} · ${lastPayment.slipSentAt ? "Slip sent ✓" : "Slip not sent"}` : "";
