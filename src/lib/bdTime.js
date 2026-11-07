// সব হিসাব বাংলাদেশের সময়ে — ফোন বা কম্পিউটার যে দেশের সময়েই থাকুক, Server এর সাথে মিলে
export const BD_TIME_ZONE = "Asia/Dhaka";

const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: BD_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

// যেমন 2026-11-07 — date input ও মাসের হিসাবে
export const bdDateInput = (date = new Date()) => ymd.format(new Date(date));

// মাসের কত তারিখ
export const bdDayOfMonth = (date) => Number(bdDateInput(date).slice(8, 10));
