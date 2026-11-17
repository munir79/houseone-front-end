export const ACCESS_RELATIONS = ["ভাই", "বোন", "স্ত্রী", "স্বামী", "মা", "বাবা", "ছেলে", "মেয়ে", "অন্যান্য"];

export const ACCESS_LEVELS = [
  { value: "view", label: "শুধু দেখা", text: "সব হিসাব দেখতে পারবেন, কিছু বদলাতে পারবেন না" },
  { value: "work", label: "দেখা ও কাজ", text: "ভাড়া নেওয়া, বিল, খরচ, ভাড়াটিয়ার ফর্ম — সম্পদের সেটিং, ইউনিট বা অংশীদার নয়" },
];

export const levelLabel = (level) => ACCESS_LEVELS.find(({ value }) => value === level)?.label ?? level;
