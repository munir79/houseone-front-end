// বাংলাদেশের নিয়মে কমা: ৳2,80,000
export const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return "Not set";
  return `${amount < 0 ? "-" : ""}৳${Math.abs(Number(amount)).toLocaleString("en-IN")}`;
};

// Chart এর অক্ষে ছোট করে: ৳50K, ৳1.2L — লাখের হিসাব বাংলাদেশের মতো
export const formatMoneyShort = (amount) => {
  const value = Math.abs(Number(amount) || 0);
  const trim = (number) => String(Number(number.toFixed(1)));
  if (value >= 100000) return `৳${trim(value / 100000)}L`;
  if (value >= 1000) return `৳${trim(value / 1000)}K`;
  return `৳${value}`;
};
