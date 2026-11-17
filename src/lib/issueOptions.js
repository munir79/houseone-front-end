export const ISSUE_TYPES = [
  { value: "Complain", label: "অভিযোগ" },
  { value: "Need", label: "প্রয়োজন" },
];

export const ISSUE_CATEGORY_OPTIONS = ["পানি", "বিদ্যুৎ", "গ্যাস", "লিফট", "মেরামত", "নিরাপত্তা", "অন্যান্য"].map((value) => ({ value, label: value }));

export const ISSUE_STATUS = {
  Open: { label: "Open", variant: "warning" },
  InProgress: { label: "In progress", variant: "info" },
  Done: { label: "Done", variant: "success" },
};

export const ISSUE_STATUS_OPTIONS = Object.entries(ISSUE_STATUS).map(([value, { label }]) => ({ value, label }));

export const issueTypeLabel = (type) => ISSUE_TYPES.find(({ value }) => value === type)?.label;
