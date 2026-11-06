export const FORM_TYPE_OPTIONS = ["Family", "Bachelor", "Office"].map((type) => ({ value: type, label: type }));

export const FORM_TYPE_LABELS = { Family: "পরিবার", Bachelor: "ব্যাচেলর", Office: "অফিস" };

export const FIELD_STATE_OPTIONS = ["Required", "Optional", "Off"].map((state) => ({ value: state, label: state }));

// ফর্মের ঘর — বাড়িওয়ালার সেটিং ও ভাড়াটিয়ার ফর্ম দুটোতেই একই নাম
export const FORM_FIELDS = [
  { key: "nid", label: "NID নম্বর" },
  { key: "nidPhoto", label: "NID-এর ছবি" },
  { key: "occupation", label: "পেশা" },
  { key: "workplace", label: "কর্মস্থলের নাম" },
  { key: "companyName", label: "প্রতিষ্ঠানের নাম" },
  { key: "permanentAddress", label: "স্থায়ী ঠিকানা" },
  { key: "previousAddress", label: "আগের ঠিকানা" },
  { key: "emergency", label: "জরুরি যোগাযোগ" },
];

export const FORM_STATUS = {
  Sent: { label: "Waiting for tenant", variant: "info" },
  SentBack: { label: "Sent back", variant: "warning" },
  Submitted: { label: "Ready to review", variant: "success" },
  Approved: { label: "Approved", variant: "primary" },
  Cancelled: { label: "Cancelled", variant: "primary" },
};

export const formLink = (token) => `${window.location.origin}/form/${token}`;
