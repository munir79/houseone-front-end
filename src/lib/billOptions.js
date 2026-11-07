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

// Monthly rent কার্ডের নিচের লেখা — এই মাসের অবস্থা ও মোট বাকি
export const rentStatusLine = (bills) => {
  const month = currentMonth();
  const monthName = monthLabel(month).split(" ")[0];
  const open = bills.filter(({ balance }) => balance > 0);

  if (open.length > 0) {
    const due = open.reduce((sum, { balance }) => sum + balance, 0);
    const carried = bills.filter(({ status, total, paid }) => status === "Carried" && total > paid).length;
    return `বাকি ${formatMoney(due)} · ${toBanglaNumber(open.length + carried)} মাসের বিল`;
  }

  return bills.some((bill) => bill.month === month) ? `${monthName}: Paid` : `${monthName}-এর বিল হয়নি`;
};

// শেষ সময় ভাড়ার দিনের রাত ১২টা, তাই এক মুহূর্ত আগের তারিখটাই ভাড়ার দিন
export const billLastDay = (bill) => new Date(new Date(bill.dueDate).getTime() - 1);

export const billLink = (token) => `${window.location.origin}/bill/${token}`;

// WhatsApp এর বিল — হিসাবসহ, আর ভাড়াটিয়া লিংকে পুরো বিল দেখেন
export const billReminderLink = (bill) => {
  const lines = bill.lines.map(({ name, amount }) => `${name}: ${formatMoney(amount)}`).join("\n");
  const paid = bill.paid > 0 ? `\nদিয়েছেন: ${formatMoney(bill.paid)}` : "";
  const link = bill.token ? `\nবিল দেখুন: ${billLink(bill.token)}` : "";
  const message = `${bill.tenantName}, ${bill.propertyName}, ${bill.unitName}-এর ${monthLabel(bill.month)} মাসের বিল:\n${lines}\nমোট: ${formatMoney(bill.total)}${paid}\nবাকি: ${formatMoney(bill.balance)}\n${toBanglaNumber(billLastDay(bill).getDate())} তারিখের মধ্যে দিন। ধন্যবাদ।${link}`;
  return `https://wa.me/88${bill.tenantPhone}?text=${encodeURIComponent(message)}`;
};
