import { formatMoney } from "./formatMoney";
import { toBanglaNumber } from "./toBanglaNumber";

// label — বাড়িওয়ালার তালিকায়, text — ভাড়াটিয়ার ফর্মে
export const ELECTRICITY_OPTIONS = [
  { value: "Prepaid", label: "প্রিপেইড মিটার", text: "প্রিপেইড মিটার, ভাড়াটিয়া নিজে রিচার্জ করবেন" },
  { value: "Postpaid", label: "আলাদা মিটার", text: "আলাদা মিটার, বিল ভাড়াটিয়া নিজে দেবেন" },
  { value: "OwnerBill", label: "বাড়িওয়ালার বিলে যোগ হবে", text: "মিটার অনুযায়ী, প্রতি মাসের বিলে যোগ হবে" },
  { value: "Included", label: "ভাড়ার মধ্যে", text: "ভাড়ার মধ্যে ধরা আছে" },
];

export const GAS_OPTIONS = [
  { value: "Line", label: "লাইনের গ্যাস", text: "লাইনের গ্যাস" },
  { value: "PrepaidCard", label: "প্রিপেইড কার্ড", text: "প্রিপেইড কার্ড, ভাড়াটিয়া নিজে রিচার্জ করবেন" },
  { value: "Cylinder", label: "সিলিন্ডার", text: "সিলিন্ডার, ভাড়াটিয়া নিজের খরচে ব্যবহার করবেন" },
  { value: "Included", label: "ভাড়ার মধ্যে", text: "ভাড়ার মধ্যে ধরা আছে" },
  { value: "None", label: "গ্যাস নেই", text: "গ্যাসের ব্যবস্থা নেই" },
];

export const ADVANCE_BASE_OPTIONS = [
  { value: "Rent", label: "শুধু বাসা ভাড়া" },
  { value: "Total", label: "মোট ভাড়া (চার্জসহ)" },
];

export const utilityText = (options, value) => options.find((option) => option.value === value)?.text;

export const termsTotal = (rent, charges) => Number(rent || 0) + charges.reduce((sum, { amount }) => sum + Number(amount || 0), 0);

export const expectedAdvance = ({ rent, charges, advanceMonths, advanceBase }) =>
  (advanceBase === "Total" ? termsTotal(rent, charges) : Number(rent || 0)) * Number(advanceMonths || 0);

// মাসের হিসাবে না মিললে "প্রায়" — প্রতিশ্রুতি যেন ঠিক থাকে
export const advanceNote = ({ advance, advanceMonths, advanceBase, isExactAdvance }) => {
  if (!advance) return "";

  const months = `শেষ ${toBanglaNumber(advanceMonths)} মাসের`;
  if (!isExactAdvance || !advanceMonths) return `বাসা ছাড়ার সময় ${formatMoney(advance)} শেষ বিল থেকে সমন্বয় হবে।`;
  return advanceBase === "Total" ? `${months} ভাড়া ও চার্জ Advance থেকে সমন্বয় হবে।` : `${months} বাসা ভাড়া Advance থেকে সমন্বয় হবে, চার্জগুলো দিতে হবে।`;
};
