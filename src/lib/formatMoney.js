// বাংলাদেশের নিয়মে কমা: ৳2,80,000
export const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return "Not set";
  return `৳${Number(amount).toLocaleString("en-IN")}`;
};
