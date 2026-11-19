import { toBanglaNumber } from "./toBanglaNumber";

// মার্কেটের দোকান — ব্যবসার ধরন, চুক্তির মেয়াদ, ভাড়া বৃদ্ধির নিয়ম
export const BUSINESS_TYPE_OPTIONS = [
  { value: "Clothing", label: "কাপড় / গার্মেন্টস" },
  { value: "Shoes", label: "জুতা" },
  { value: "Electronics", label: "মোবাইল ও ইলেকট্রনিক্স" },
  { value: "Jewellery", label: "স্বর্ণ / জুয়েলারি" },
  { value: "Cosmetics", label: "কসমেটিকস" },
  { value: "Food", label: "খাবার / রেস্টুরেন্ট" },
  { value: "Grocery", label: "মুদি / সুপারশপ" },
  { value: "Pharmacy", label: "ফার্মেসি" },
  { value: "Office", label: "অফিস" },
  { value: "Other", label: "অন্যান্য" },
];

export const businessTypeLabel = ({ businessType, businessTypeOther } = {}) =>
  businessType === "Other" ? businessTypeOther || "অন্যান্য" : BUSINESS_TYPE_OPTIONS.find(({ value }) => value === businessType)?.label || "";

export const CONTRACT_YEAR_OPTIONS = Array.from({ length: 11 }, (_, years) => ({ value: String(years), label: years === 0 ? "০ বছর" : `${toBanglaNumber(years)} বছর` }));
export const CONTRACT_MONTH_OPTIONS = Array.from({ length: 12 }, (_, months) => ({ value: String(months), label: `${toBanglaNumber(months)} মাস` }));
export const INCREASE_YEAR_OPTIONS = [1, 2, 3].map((years) => ({ value: String(years), label: years === 1 ? "প্রতি বছর" : `প্রতি ${toBanglaNumber(years)} বছরে` }));
export const RENEW_OPTIONS = [12, 24, 36, 60].map((months) => ({ value: String(months), label: `${toBanglaNumber(months / 12)} বছর` }));

// ৩৬ মাস → ৩ বছর, ৩০ মাস → ২ বছর ৬ মাস
export const formatMonths = (months) => {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years > 0 && `${toBanglaNumber(years)} বছর`, rest > 0 && `${toBanglaNumber(rest)} মাস`].filter(Boolean).join(" ") || "০ মাস";
};

export const DEPOSIT_LABELS = {
  Advance: "অগ্রিম ভাড়া",
  Security: "সিকিউরিটি মানি",
  Position: "পজিশন মানি",
};

// কিস্তির অবস্থা
export const INSTALLMENT_STATUS = {
  Paid: { label: "পেয়েছেন", variant: "success" },
  Partial: { label: "কিছু বাকি", variant: "warning" },
  Due: { label: "বাকি", variant: "danger" },
};

// চুক্তির ফর্মের শুরুর অবস্থা — নতুন দোকান, অথবা আগের চুক্তি Edit
export const emptyContract = (unit) => ({
  startDate: "",
  years: "3",
  months: "0",
  rent: unit?.rent === null || unit?.rent === undefined ? "" : String(unit.rent),
  dueDay: "10",
  serviceCharge: unit?.serviceCharge ? String(unit.serviceCharge) : "",
  advanceMonths: "3",
  advance: null,
  security: "",
  positionTotal: "",
  positionMode: "Once",
  installments: [],
  increaseAmount: "",
  increaseYears: "2",
  contractPhotos: [],
});

export const contractFromTenancy = (tenancy) => {
  const { market } = tenancy;
  return {
    startDate: new Date(tenancy.startDate).toISOString().slice(0, 10),
    years: String(Math.min(10, Math.floor(market.contractMonths / 12))),
    months: String(market.contractMonths % 12),
    rent: String(tenancy.rent),
    dueDay: String(tenancy.dueDay),
    serviceCharge: String(market.serviceCharge || ""),
    advanceMonths: String(market.advanceMonths ?? 0),
    advance: String(tenancy.advance),
    security: String(market.security || ""),
    positionTotal: String(market.position?.total || ""),
    positionMode: market.position?.installments?.length ? "Installments" : "Once",
    installments: (market.position?.installments ?? []).map(({ amount, dueDate }) => ({ amount: String(amount), dueDate: new Date(dueDate).toISOString().slice(0, 10) })),
    increaseAmount: String(market.increase?.amount || ""),
    increaseYears: String(market.increase?.everyYears ?? 2),
    contractPhotos: market.contractPhotos ?? [],
  };
};

export const contractMonthsOf = (contract) => Number(contract.years) * 12 + Number(contract.months);
export const autoAdvance = (contract) => Number(contract.rent || 0) * Number(contract.advanceMonths || 0);
export const advanceOf = (contract) => (contract.advance === null ? autoAdvance(contract) : Number(contract.advance || 0));
export const installmentSum = (contract) => contract.installments.reduce((sum, { amount }) => sum + Number(amount || 0), 0);

// ঘরে ভুল থাকলে কোন ঘরে কী লিখতে হবে
export const validateContract = (contract) => {
  const errors = {};
  if (!contract.startDate) errors.startDate = "শুরুর তারিখ দিন";
  if (contract.rent === "") errors.rent = "মাসিক ভাড়া লিখুন";
  if (contractMonthsOf(contract) < 1) errors.duration = "চুক্তির মেয়াদ দিন";
  const total = Number(contract.positionTotal || 0);
  if (total > 0 && contract.positionMode === "Installments") {
    if (contract.installments.length === 0) errors.installments = "কিস্তি যোগ করুন";
    else if (contract.installments.some(({ amount, dueDate }) => !Number(amount) || !dueDate)) errors.installments = "প্রতিটি কিস্তির টাকা ও তারিখ দিন";
    else if (installmentSum(contract) !== total) errors.installments = "কিস্তিগুলোর যোগফল মোট পজিশন মানির সমান হতে হবে";
  }
  return errors;
};

// Server এ যা যায়
export const contractBody = (contract) => {
  const total = Number(contract.positionTotal || 0);
  return {
    startDate: contract.startDate,
    rent: Number(contract.rent),
    dueDay: Number(contract.dueDay),
    advance: advanceOf(contract),
    market: {
      contractMonths: contractMonthsOf(contract),
      serviceCharge: Number(contract.serviceCharge || 0),
      advanceMonths: Number(contract.advanceMonths || 0),
      security: Number(contract.security || 0),
      position: {
        total,
        installments: total > 0 && contract.positionMode === "Installments" ? contract.installments.map(({ amount, dueDate }) => ({ amount: Number(amount), dueDate })) : [],
      },
      increase: { amount: Number(contract.increaseAmount || 0), everyYears: Number(contract.increaseYears) },
      contractPhotos: contract.contractPhotos.map(({ publicId, format, version, signature }) => ({ publicId, format, version, signature })),
    },
  };
};

// ============================================================
// ব্যবসায়ীকে WhatsApp এ জানানো — লেখা তৈরি থাকে, মালিক চাপলে পাঠান
// ============================================================
const BD_ZONE = "Asia/Dhaka";
const taka = (amount) => `৳${Number(amount).toLocaleString("en-IN")}`;
const shortDate = (date) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: BD_ZONE });
const monthText = (month) => {
  const [year, number] = month.split("-").map(Number);
  return new Date(year, number - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

export const whatsappLink = (phone, text) => `https://wa.me/88${phone}?text=${encodeURIComponent(text)}`;

export const installmentMessage = ({ businessName, unitName, propertyName, index, amount, dueDate, isLate }) =>
  `${businessName || "জনাব"}, আপনার দোকান ${unitName}-এর পজিশন মানির ${toBanglaNumber(index + 1)}নং কিস্তি ${taka(amount)} ${shortDate(dueDate)} তারিখে দেওয়ার কথা${isLate ? " (তারিখ পেরিয়ে গেছে)" : ""}। অনুগ্রহ করে সময়মতো দিন। — ${propertyName}`;

export const increaseMessage = ({ businessName, unitName, propertyName, oldRent, newRent, fromMonth }) =>
  `${businessName || "জনাব"}, চুক্তি অনুযায়ী ${monthText(fromMonth)} থেকে দোকান ${unitName}-এর মাসিক ভাড়া ${taka(oldRent)} থেকে ${taka(newRent)} হবে। — ${propertyName}`;

export const serviceChargeMessage = ({ businessName, unitName, propertyName, current, next }) =>
  `${businessName || "জনাব"}, পরের বিল থেকে দোকান ${unitName}-এর সার্ভিস চার্জ ${taka(current)} থেকে ${taka(next)} হবে। — ${propertyName}`;

export const fromMonthLabel = monthText;
