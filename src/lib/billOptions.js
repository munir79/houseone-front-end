import { formatMoney } from "./formatMoney";
import { toBanglaNumber } from "./toBanglaNumber";

const MONTHS_BACK = 11;

const LINE_FIXED = ["PreviousDue", "Advance"];

export const isFixedLine = ({ kind }) => LINE_FIXED.includes(kind);

export const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (month) => {
  const [year, number] = month.split("-").map(Number);
  return new Date(year, number - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

// আগামী মাস থেকে পেছনের এক বছর
export const monthOptions = () => {
  const now = new Date();
  return Array.from({ length: MONTHS_BACK + 2 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + 1 - index, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: monthLabel(value) };
  });
};

// Partial কখনো Overdue হয় না — কিছু টাকা দিয়েছেন
export const billStatus = (bill) => {
  if (bill.status === "Carried") return { key: "Carried", label: "Moved to next bill", variant: "primary" };
  if (bill.status === "Paid") return { key: "Paid", label: "Paid", variant: "success" };
  if (bill.status === "Partial") return { key: "Partial", label: `Partial, ${formatMoney(bill.balance)} due`, variant: "info" };
  return bill.isOverdue ? { key: "Overdue", label: "Overdue", variant: "danger" } : { key: "Unpaid", label: "Due", variant: "warning" };
};

// শেষ সময় ভাড়ার দিনের রাত ১২টা, তাই এক মুহূর্ত আগের তারিখটাই ভাড়ার দিন
export const billLastDay = (bill) => new Date(new Date(bill.dueDate).getTime() - 1);

export const billReminderLink = (bill) => {
  const message = `${bill.propertyName}, ${bill.unitName}: ${monthLabel(bill.month)} মাসের বিল ${formatMoney(bill.balance)}। ${toBanglaNumber(billLastDay(bill).getDate())} তারিখের মধ্যে দিন। ধন্যবাদ।`;
  return `https://wa.me/88${bill.tenantPhone}?text=${encodeURIComponent(message)}`;
};
