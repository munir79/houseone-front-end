export const FORM_TYPES = ["Family", "Bachelor", "Office", "Shop"];

export const FORM_TYPE_LABELS = { Family: "পরিবার", Bachelor: "ব্যাচেলর", Office: "অফিস", Shop: "দোকান" };

export const FIELD_STATE_OPTIONS = ["Required", "Optional", "Off"].map((state) => ({ value: state, label: state }));

export const MAIN_COUNT_OPTIONS = [
  { value: "2", label: "২ জন" },
  { value: "1", label: "১ জন" },
];

// ফর্মের ঘর — বাড়িওয়ালার সেটিং ও ভাড়াটিয়ার ফর্ম দুটোতেই একই নাম
export const FORM_FIELDS = [
  { key: "gender", label: "লিঙ্গ" },
  { key: "occupation", label: "পেশা" },
  { key: "workplace", label: "কর্মস্থলের নাম" },
  { key: "permanentAddress", label: "স্থায়ী ঠিকানা" },
  { key: "previousAddress", label: "আগের ঠিকানা" },
  { key: "nid", label: "NID নম্বর" },
  { key: "nidPhoto", label: "NID-এর দুই পিঠের ছবি" },
  { key: "photo", label: "Passport size ছবি" },
  { key: "emergency", label: "জরুরি যোগাযোগ" },
  { key: "companyName", label: "প্রতিষ্ঠান বা দোকানের নাম" },
  { key: "tradeLicense", label: "Trade License নম্বর" },
  { key: "tradeLicensePhoto", label: "Trade License এর ছবি", marketOnly: true },
];

// মার্কেটের দোকানের ফর্মে যে ঘরগুলো কাজে লাগে
export const MARKET_FORM_FIELDS = ["companyName", "tradeLicense", "tradeLicensePhoto", "permanentAddress", "nid", "nidPhoto", "photo"];
export const MARKET_FIELD_LABELS = { companyName: "ব্যবসার নাম ও ধরন", permanentAddress: "ঠিকানা" };

export const GENDERS = [
  { value: "Male", label: "পুরুষ" },
  { value: "Female", label: "মহিলা" },
  { value: "Other", label: "অন্যান্য" },
];

export const FORM_STATUS = {
  Sent: { label: "Form sent", variant: "info" },
  SentBack: { label: "Sent back", variant: "warning" },
  Submitted: { label: "Needs approval", variant: "success" },
  Approved: { label: "Approved", variant: "primary" },
  Cancelled: { label: "Cancelled", variant: "primary" },
};

export const formLink = (token) => `${window.location.origin}/form/${token}`;
