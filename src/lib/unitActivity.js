import { FORM_STATUS } from "./tenantFormOptions";

const FORM_NEEDS_ACTION = ["Submitted", "SentBack"];

const shortDate = (date) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// ইউনিটে এখন কী চলছে — Vacant/Occupied এর পাশের দ্বিতীয় Badge
export const unitActivity = ({ openForm, tenancy }) => {
  if (openForm) {
    const href = `/tenants/forms/${openForm._id}`;
    if (openForm.isExpired) return { label: "Link expired", variant: "danger", href, needsAction: true };

    const { label, variant } = FORM_STATUS[openForm.status];
    return { label, variant, href, needsAction: FORM_NEEDS_ACTION.includes(openForm.status) };
  }

  if (tenancy?.notice) {
    return { label: `Leaving ${shortDate(tenancy.notice.leavingDate)}`, variant: "warning", href: `/tenants/${tenancy._id}`, needsAction: true };
  }

  return null;
};
