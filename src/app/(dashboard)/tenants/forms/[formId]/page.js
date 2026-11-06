"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, FileText, SearchX } from "lucide-react";
import { toast } from "sonner";
import NidField from "@/components/tenant/NidField";
import ShareForm from "@/components/tenantForm/ShareForm";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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
import { DEFAULT_RENT_DAY, RENT_DAY_OPTIONS, todayInput } from "@/lib/tenancyOptions";
import { FORM_STATUS } from "@/lib/tenantFormOptions";
import {
  useFormActionMutation,
  useGetFormDocumentLinksMutation,
  useGetTenantFormQuery,
  useRevealFormNidMutation,
} from "@/redux/features/tenantForm/tenantFormApi";
import { useGetUnitQuery } from "@/redux/features/unit/unitApi";

const Row = ({ label, value }) =>
  value ? (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm wrap-break-word">{value}</dd>
    </div>
  ) : null;

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
    if (rent === "") newErrors.rent = "মাসিক ভাড়া লিখুন";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await formAction({ id: form._id, action: "approve", ...values, rent, dueDay: Number(values.dueDay) }).unwrap();
      toast.success("ভাড়াটিয়া যোগ হয়েছে");
      router.replace(`/tenants/${response.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Approve হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Approve Tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">ফর্মের সব তথ্য এই ইউনিটে বসে যাবে, আর ইউনিট Occupied হবে।</p>
        <div className="grid grid-cols-2 gap-4">
          <Input id="startDate" type="date" label="Move-in date" value={values.startDate} onChange={change("startDate")} error={errors.startDate} />
          <Select id="dueDay" label="Rent day" options={RENT_DAY_OPTIONS} value={values.dueDay} onChange={change("dueDay")} />
          <Input
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
          />
          <Input id="approveAdvance" type="number" inputMode="numeric" min="0" label="Advance (৳)" value={values.advance} onChange={change("advance")} />
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
  const [links, setLinks] = useState(null);

  const { data, error, isLoading } = useGetTenantFormQuery(formId);
  const [formAction, { isLoading: isActing }] = useFormActionMutation();
  const [revealNid, { isLoading: isRevealing }] = useRevealFormNidMutation();
  const [getLinks, { isLoading: isOpening }] = useGetFormDocumentLinksMutation();

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

  const handleView = async () => {
    try {
      const response = await getLinks(formId).unwrap();
      setLinks(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি খোলা যায়নি।"));
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
                  <Button size="sm" onClick={() => setDialog("approve")}>
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDialog("back")}>
                    Send Back
                  </Button>
                </>
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

      {isWaiting && !isExpired && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Share with tenant</h2>
          <ShareForm form={form} />
        </Card>
      )}

      {form.submittedAt && (
        <>
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Tenant details</h2>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Row label="Name" value={form.name} />
              <Row label="Mobile" value={form.phone} />
              <div className="min-w-0">
                <dt className="text-xs text-muted">NID</dt>
                <dd>
                  <NidField last4={form.nidLast4} isLoading={isRevealing} onReveal={() => revealNid(formId).unwrap()} />
                </dd>
              </div>
              <Row label="Occupation" value={form.occupation} />
              <Row label="Workplace" value={form.workplace} />
              <Row label="Company" value={form.companyName} />
              <Row label="Permanent address" value={form.permanentAddress} />
              <Row label="Previous address" value={form.previousAddress} />
              <Row label="Emergency contact" value={[form.emergencyName, form.emergencyPhone].filter(Boolean).join(", ")} />
              {form.answers.map(({ question, answer }) => (
                <Row key={question} label={question} value={answer} />
              ))}
            </dl>
          </Card>

          {form.documents.length > 0 && (
            <Card>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Documents ({form.documents.length})</h2>
                <Button variant="outline" size="sm" isLoading={isOpening} onClick={handleView}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  View
                </Button>
              </div>
            </Card>
          )}

          {form.members.length > 0 && (
            <Card flush className="overflow-hidden">
              <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Members ({form.members.length})</h2>
              <ul className="divide-y divide-border">
                {form.members.map((member, index) => (
                  <li key={index} className="px-4 py-2.5">
                    <p className="text-sm font-medium wrap-break-word">{member.name}</p>
                    <p className="text-xs text-muted">{[member.relation, member.occupation, member.phone].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
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

      {links && (
        <Modal title="Documents" onClose={() => setLinks(null)} size="lg">
          <div className="flex flex-col gap-3">
            {links.map(({ publicId, url }, index) => (
              // Private ছবির স্বাক্ষরিত লিংক, CDN এর ভেতর দিয়ে যায় না
              // eslint-disable-next-line @next/next/no-img-element
              <img key={publicId} src={url} alt={`Document ${index + 1}`} className="w-full rounded-lg border border-border" />
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TenantFormPage;
