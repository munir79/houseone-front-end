import { toBanglaNumber } from "./toBanglaNumber";

export const OCCUPANT_TYPE_OPTIONS = ["Family", "Bachelor", "Sublet", "Office", "Shop"].map((type) => ({ value: type, label: type }));

export const RENT_DAY_OPTIONS = Array.from({ length: 28 }, (_, index) => ({
  value: String(index + 1),
  label: `Day ${index + 1}`,
}));

export const DEFAULT_RENT_DAY = "10";

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const toDateInput = (date) => new Date(date).toISOString().slice(0, 10);

export const todayInput = () => toDateInput(new Date());

// কতদিন ধরে আছেন: ২ বছর ৩ মাস
export const formatStay = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const months = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() - (end.getDate() < start.getDate() ? 1 : 0));

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years > 0) parts.push(`${toBanglaNumber(years)} বছর`);
  if (rest > 0) parts.push(`${toBanglaNumber(rest)} মাস`);

  return parts.join(" ") || "১ মাসের কম";
};
