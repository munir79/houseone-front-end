const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

// বাংলা বাক্যের মধ্যে সংখ্যা: 14 → ১৪
export const toBanglaNumber = (value) => String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[digit]);

// বাংলা কীবোর্ডে লেখা মোবাইল বা NID: ০১৭ → 017
export const toEnglishNumber = (value) => value.replace(/[০-৯]/g, (digit) => BANGLA_DIGITS.indexOf(digit));
