const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

// বাংলা বাক্যের মধ্যে সংখ্যা: 14 → ১৪
export const toBanglaNumber = (value) => String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[digit]);
