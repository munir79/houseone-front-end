"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText, SearchX } from "lucide-react";
import { toast } from "sonner";
import PersonDetailsModal from "@/components/tenantForm/PersonDetailsModal";
import TermsCard from "@/components/tenantForm/TermsCard";
import ShareForm from "@/components/tenantForm/ShareForm";
import Badge from "@/components/ui/Badge";
import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DetailHeader from "@/components/ui/DetailHeader";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import LinkButton from "@/components/ui/LinkButton";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { DEFAULT_RENT_DAY, RENT_DAY_OPTIONS, formatDate, todayInput } from "@/lib/tenancyOptions";
import { FORM_STATUS } from "@/lib/tenantFormOptions";
import {
  useFormActionMutation,
  useGetFormDocumentLinksMutation,
  useGetTenantFormQuery,
  useRevealFormNidMutation,
} from "@/redux/features/tenantForm/tenantFormApi";
import { useGetUnitQuery } from "@/redux/features/unit/unitApi";

const ApproveModal = ({ form, onClose }) => {
  const router = useRouter();
  const { data: unit } = useGetUnitQuery(form.unit);
  const [values, setValues] = useState({ startDate: todayInput(), rent: "", advance: "", dueDay: DEFAULT_RENT_DAY });
  const [rentTouched, setRentTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [formAction, { isLoading }] = useFormActionMutation();

  const unitRent = unit?.data?.rent;
  const rent = rentTouched ? values.rent : unitRent === null || unitRent === undefined ? "" : String(unitRent);

  const change = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors(({ [field]: removed, ...rest }) => rest);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!values.startDate) newErrors.startDate = "ওঠার তারিখ দিন";
    if (!form.terms && rent === "") newErrors.rent = "মাসিক ভাড়া লিখুন";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await formAction({ id: form._id, action: "approve", ...values, rent, dueDay: Number(values.dueDay) }).unwrap();
      toast.success("ভাড়াটিয়া যোগ হয়েছে");
      router.replace(`/properties/${form.property}/units/${form.unit}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Approve হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Approve Tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {form.terms ? "ভাড়াটিয়া যে হিসাবে রাজি হয়েছেন সেটাই বসবে। বদলাতে হলে Send Back করুন।" : "ফর্মের সব তথ্য এই ইউনিটে বসে যাবে, আর ইউনিট Occupied হবে।"}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input id="startDate" type="date" label="Move-in date" value={values.startDate} onChange={change("startDate")} error={errors.startDate} />
          {!form.terms && <Select id="dueDay" label="Rent day" options={RENT_DAY_OPTIONS} value={values.dueDay} onChange={change("dueDay")} />}
          {!form.terms && <Input
            id="approveRent"
            type="number"
            inputMode="numeric"
            min="0"
            label="Monthly rent (৳)"
            value={rent}
            onChange={(e) => {
              setRentTouched(true);
              change("rent")(e);
            }}
            error={errors.rent}
          />}
          {!form.terms && <Input id="approveAdvance" type="number" inputMode="numeric" min="0" label="Advance (৳)" value={values.advance} onChange={change("advance")} />}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Approve
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const SendBackModal = ({ form, onClose }) => {
  const [note, setNote] = useState("");
  const [formAction, { isLoading }] = useFormActionMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await formAction({ id: form._id, action: "send-back", note }).unwrap();
      toast.success("ফর্ম আবার খুলে দেওয়া হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "পাঠানো যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Send Back for Changes" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">একই লিংকে ফর্মটি আবার খুলবে, আগের লেখা থাকবে, আর নতুন ৭ দিন সময় পাবেন।</p>
        <Input id="backNote" label="What to change (optional)" placeholder="যেমন: স্থায়ী ঠিকানা ঠিক করুন" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Send Back
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const TenantFormPage = () => {
  const { formId } = useParams();
  const router = useRouter();
  const [dialog, setDialog] = useState(null);
  const [openPersonId, setOpenPersonId] = useState(null);

  const { data, error, isLoading } = useGetTenantFormQuery(formId);
  const [formAction, { isLoading: isActing }] = useFormActionMutation();
  const [revealNid, { isLoading: isRevealing }] = useRevealFormNidMutation();
  const [getLinks] = useGetFormDocumentLinksMutation();

  const form = data?.data;

  const handleExtend = async () => {
    try {
      await formAction({ id: formId, action: "extend" }).unwrap();
      toast.success("লিংকের মেয়াদ ৭ দিন বেড়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "মেয়াদ বাড়েনি। আবার চেষ্টা করুন।"));
    }
  };

  const handleCancel = async () => {
    try {
      await formAction({ id: formId, action: "cancel" }).unwrap();
      toast.success("ফর্ম বাতিল হয়েছে");
      router.replace("/tenants");
    } catch (err) {
      toast.error(getErrorMessage(err, "বাতিল হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-1/2 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <Card>
        <EmptyState icon={SearchX} title="Form not found" description="এই ফর্মটি পাওয়া যায়নি।" action={<LinkButton href="/tenants">Back to Tenants</LinkButton>} />
      </Card>
    );
  }

  const status = FORM_STATUS[form.status];
  const openPerson = form.people.find(({ _id }) => _id === openPersonId);
  const isSubmitted = form.status === "Submitted";
  const isWaiting = ["Sent", "SentBack"].includes(form.status);
  const isExpired = isWaiting && new Date(form.expiresAt) <= new Date();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/tenants" className="-mb-2 inline-flex min-h-9 w-fit items-center gap-1 text-sm text-muted hover:text-foreground md:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tenants
      </Link>

      <DetailHeader
        title={form.name || "Tenant Form"}
        subtitle={`${form.unitName}, ${form.propertyName} · ${form.occupantType}`}
        icon={FileText}
        badge={<Badge variant={isExpired ? "danger" : status.variant}>{isExpired ? "Link expired" : status.label}</Badge>}
        actions={
          form.isOpen && (
            <div className="flex flex-wrap gap-2">
              {isSubmitted && (
                <>
                  <Button size="sm" disabled={Boolean(form.currentTenant)} onClick={() => setDialog("approve")}>
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDialog("back")}>
                    Send Back
                  </Button>
                </>
              )}
              {isSubmitted && (
                <a href={`/form/${form.token}`} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "outline", size: "sm" })}>
                  Tenant Copy
                </a>
              )}
              {isExpired && (
                <Button size="sm" isLoading={isActing} onClick={handleExtend}>
                  Extend 7 Days
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setDialog("cancel")}>
                Cancel Form
              </Button>
            </div>
          )
        }
      />

      {form.isOpen && form.currentTenant && (
        <div data-current-tenant className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-warning-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">
            এই ফ্ল্যাটে এখনো {form.currentTenant.tenantName} আছেন
            {form.currentTenant.leavingDate ? `, ${formatDate(form.currentTenant.leavingDate)} তারিখে ছাড়বেন` : ""}। তিনি বাসা ছাড়লে আগে Move Out করুন, তারপর Approve করা যাবে।
          </p>
          <LinkButton href={`/properties/${form.property}/units/${form.unit}`} variant="outline" size="sm" className="shrink-0">
            ফ্ল্যাটে যান
          </LinkButton>
        </div>
      )}

      {isWaiting && !isExpired && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Share with tenant</h2>
          <ShareForm form={form} />
        </Card>
      )}

      {form.submittedAt && (
        <>
          <p className="text-sm text-muted">
            মোট {toBanglaNumber(form.totalPeople)} জন থাকবেন, {toBanglaNumber(form.people.length)} জনের তথ্য দেওয়া হয়েছে।
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {form.people.map((person) => (
              <button
                key={person._id}
                type="button"
                data-review-person
                onClick={() => setOpenPersonId(person._id)}
                className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-left shadow-card hover:bg-background"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium wrap-break-word">{person.name}</span>
                  <span className="block text-xs text-muted">{[person.relation, person.occupation, person.phone].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {person.isMain && <Badge variant="info">প্রধান</Badge>}
                  <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>

          {(form.companyName || form.tradeLicense || form.emergencyName || form.answers.some(({ answer }) => answer)) && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold">Other details</h2>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Company", form.companyName],
                  ["Trade License", form.tradeLicense],
                  ["Emergency contact", [form.emergencyName, form.emergencyPhone].filter(Boolean).join(", ")],
                  ...form.answers.map(({ question, answer }) => [question, answer]),
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="text-sm wrap-break-word">{value}</dd>
                    </div>
                  ))}
              </dl>
            </Card>
          )}
        </>
      )}

      {form.terms && <TermsCard terms={form.terms} title={form.termsAcceptedAt ? "ভাড়ার হিসাব (ভাড়াটিয়া রাজি)" : "ভাড়ার হিসাব"} />}

      {form.rulesAcceptedAt && (
        <Card>
          <h2 className="text-sm font-semibold">House rules</h2>
          <p className="mb-2 text-sm text-muted">{formatDate(form.rulesAcceptedAt)} তারিখে সম্মতি দিয়েছেন</p>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
            {form.config.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ol>
        </Card>
      )}

      {openPerson && (
        <PersonDetailsModal
          key={openPerson._id}
          person={openPerson}
          isMain={openPerson.isMain}
          hasImages={Boolean(openPerson.nidFront || openPerson.nidBack || openPerson.photo)}
          isRevealing={isRevealing}
          onReveal={() => revealNid({ id: formId, personId: openPerson._id }).unwrap()}
          loadImages={() => getLinks({ id: formId, personId: openPerson._id }).unwrap()}
          onClose={() => setOpenPersonId(null)}
        />
      )}

      {dialog === "approve" && <ApproveModal form={form} onClose={() => setDialog(null)} />}
      {dialog === "back" && <SendBackModal form={form} onClose={() => setDialog(null)} />}
      {dialog === "cancel" && (
        <ConfirmDialog
          title="Cancel form?"
          message="লিংকটি বন্ধ হয়ে যাবে, আর ভাড়াটিয়ার দেওয়া তথ্য ও ছবি মুছে যাবে।"
          confirmLabel="Cancel Form"
          isLoading={isActing}
          onConfirm={handleCancel}
          onClose={() => setDialog(null)}
        />
      )}

    </div>
  );
};

export default TenantFormPage;
