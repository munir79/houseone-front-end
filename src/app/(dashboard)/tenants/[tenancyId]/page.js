"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Banknote, CalendarClock, CalendarDays, Clock, KeyRound, LogOut, MessageCircle, Pencil, Phone, SearchX, User, Users } from "lucide-react";
import { toast } from "sonner";
import TenancyBills from "@/components/bill/TenancyBills";
import DateActionModal from "@/components/tenant/DateActionModal";
import DocumentsPanel from "@/components/tenant/DocumentsPanel";
import EditTenancyModal from "@/components/tenant/EditTenancyModal";
import EditableList from "@/components/tenant/EditableList";
import MembersPanel from "@/components/tenant/MembersPanel";
import TermsCard from "@/components/tenantForm/TermsCard";
import NidField from "@/components/tenant/NidField";
import Badge from "@/components/ui/Badge";
import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DetailHeader from "@/components/ui/DetailHeader";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import Tabs from "@/components/ui/Tabs";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate, formatStay, todayInput } from "@/lib/tenancyOptions";
import { GENDERS } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import {
  useCancelNoticeMutation,
  useEndTenancyMutation,
  useGetTenancyQuery,
  useGiveNoticeMutation,
  useRevealNidMutation,
} from "@/redux/features/tenancy/tenancyApi";

const ITEM_FIELDS = [
  { key: "name", label: "Item", placeholder: "বিদ্যুৎ কার্ড, গ্যাস কার্ড, চাবি", required: true, requiredMessage: "জিনিসের নাম লিখুন" },
  { key: "note", label: "Note (optional)", placeholder: "যেমন: কার্ড নম্বর" },
];

const InfoRow = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm wrap-break-word">{children || <span className="text-muted">দেওয়া হয়নি</span>}</dd>
  </div>
);

const TenancyDetailsPage = () => {
  const { tenancyId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isMoveOutOpen, setIsMoveOutOpen] = useState(false);

  const { data, error, isLoading } = useGetTenancyQuery(tenancyId);
  const [giveNotice, { isLoading: isSavingNotice }] = useGiveNoticeMutation();
  const [cancelNotice, { isLoading: isCancelling }] = useCancelNoticeMutation();
  const [endTenancy, { isLoading: isEnding }] = useEndTenancyMutation();
  const [revealNid, { isLoading: isRevealing }] = useRevealNidMutation();

  const tenancy = data?.data;

  const handleNotice = async (leavingDate) => {
    try {
      await giveNotice({ id: tenancyId, leavingDate }).unwrap();
      toast.success("নোটিশ সেভ হয়েছে");
      setIsNoticeOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "নোটিশ সেভ হয়নি।"));
    }
  };

  const handleMoveOut = async (endDate) => {
    try {
      await endTenancy({ id: tenancyId, endDate }).unwrap();
      toast.success("ভাড়াটিয়া বাসা ছেড়েছেন, ইউনিট এখন Vacant");
      setIsMoveOutOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const handleCancelNotice = async () => {
    try {
      await cancelNotice(tenancyId).unwrap();
      toast.success("নোটিশ বাতিল হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "বাতিল হয়নি।"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-1/2 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !tenancy) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="Tenant not found"
          description="এই ভাড়াটিয়াকে পাওয়া যায়নি।"
          action={<LinkButton href="/tenants">Back to Tenants</LinkButton>}
        />
      </Card>
    );
  }

  const { tenant } = tenancy;
  const isActive = tenancy.status === "Active";
  const whatsappNumber = `88${tenant.phone}`;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/tenants" className="-mb-2 inline-flex min-h-9 w-fit items-center gap-1 text-sm text-muted hover:text-foreground md:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tenants
      </Link>

      <DetailHeader
        title={tenancy.tenantName}
        subtitle={`${tenancy.unitName}, ${tenancy.propertyName}`}
        icon={User}
        badge={isActive ? <Badge variant="success">{tenancy.occupantType}</Badge> : <Badge>Former</Badge>}
        actions={
          <div className="flex flex-wrap gap-2">
            {tenancy.copyToken && (
              <a href={`/form/${tenancy.copyToken}`} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "outline", size: "sm" })}>
                Tenant Copy
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            {isActive && (
              <Button variant="outline" size="sm" onClick={() => setIsMoveOutOpen(true)}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Move Out
              </Button>
            )}
          </div>
        }
      />

      {isActive &&
        (tenancy.notice ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-warning-foreground">
              <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {formatDate(tenancy.notice.leavingDate)} তারিখে বাসা ছাড়বেন
            </p>
            <Button variant="ghost" size="sm" isLoading={isCancelling} onClick={handleCancelNotice}>
              Cancel Notice
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsNoticeOpen(true)}
            className="flex min-h-11 w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            ভাড়াটিয়া বাসা ছাড়ার কথা জানিয়েছেন?
          </button>
        ))}

      <StatStrip
        items={[
          { key: "rent", label: "Monthly rent", value: formatMoney(tenancy.rent), icon: Banknote },
          { key: "dueDay", label: "Rent day", value: `Day ${tenancy.dueDay}`, icon: CalendarDays, tone: "blue" },
          { key: "stay", label: "Staying for", value: formatStay(tenancy.startDate, tenancy.endDate), icon: Clock, tone: "amber" },
          { key: "people", label: "People", value: tenancy.peopleCount, icon: Users, tone: "violet" },
        ]}
      />

      <div className="flex flex-col gap-4">
        <Tabs
          label="Tenant sections"
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "members", label: "Members", count: tenancy.members.filter(({ leftAt }) => !leftAt).length },
            { value: "items", label: "Items given", count: tenancy.handoverItems.length },
            { value: "bills", label: "Bills" },
            { value: "documents", label: "Documents", count: tenant.documents?.length || 0 },
          ]}
        />

        {activeTab === "overview" && (
          <Card>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Mobile">
                <span className="flex flex-wrap items-center gap-3">
                  <a href={`tel:${tenant.phone}`} className="inline-flex items-center gap-1 font-medium">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {tenant.phone}
                  </a>
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-foreground">
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    WhatsApp
                  </a>
                </span>
              </InfoRow>
              <div className="min-w-0">
                <dt className="text-xs text-muted">NID</dt>
                <dd>
                  <NidField last4={tenant.nidLast4} isLoading={isRevealing} onReveal={() => revealNid(tenant._id).unwrap()} />
                </dd>
              </div>
              <InfoRow label="Occupation">{tenant.occupation}</InfoRow>
              {tenant.gender && <InfoRow label="Gender">{GENDERS.find(({ value }) => value === tenant.gender)?.label}</InfoRow>}
              {tenant.age !== null && tenant.age !== undefined && <InfoRow label="Age">{tenant.age}</InfoRow>}
              <InfoRow label="Email">{tenant.email}</InfoRow>
              {tenant.workplace && <InfoRow label="Workplace">{tenant.workplace}</InfoRow>}
              {tenant.companyName && <InfoRow label="Company">{tenant.companyName}</InfoRow>}
              {tenant.tradeLicense && <InfoRow label="Trade License">{tenant.tradeLicense}</InfoRow>}
              {tenant.previousAddress && <InfoRow label="Previous address">{tenant.previousAddress}</InfoRow>}
              {tenant.formAnswers?.map(({ question, answer }) => answer && <InfoRow key={question} label={question}>{answer}</InfoRow>)}
              <InfoRow label="Permanent address">{tenant.permanentAddress}</InfoRow>
              <InfoRow label="Emergency contact">{[tenant.emergencyName, tenant.emergencyPhone].filter(Boolean).join(", ")}</InfoRow>
              <InfoRow label="Moved in">{formatDate(tenancy.startDate)}</InfoRow>
              {tenancy.endDate && <InfoRow label="Moved out">{formatDate(tenancy.endDate)}</InfoRow>}
              <InfoRow label="Advance">{formatMoney(tenancy.advance)}</InfoRow>
              {tenancy.hasSublet && (
                <InfoRow label="Sublet">
                  {tenancy.subletNote || "সাবলেট আছে"} ({toBanglaNumber(tenancy.subletPeople)} জন)
                </InfoRow>
              )}
            </dl>
          </Card>
        )}

        {activeTab === "overview" && tenancy.terms && <TermsCard terms={tenancy.terms} />}

        {activeTab === "overview" && tenancy.rules?.length > 0 && (
          <Card>
            <h2 className="text-base font-bold">House rules</h2>
            {tenancy.rulesAcceptedAt && <p className="mb-2 text-sm text-muted">{formatDate(tenancy.rulesAcceptedAt)} তারিখে সম্মতি দিয়েছেন</p>}
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
              {tenancy.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ol>
          </Card>
        )}

        {activeTab === "members" && <MembersPanel tenancy={tenancy} />}

        {activeTab === "items" && (
          <EditableList
            tenancyId={tenancyId}
            field="handoverItems"
            items={tenancy.handoverItems}
            fields={ITEM_FIELDS}
            addLabel="Add Item"
            emptyIcon={KeyRound}
            emptyTitle="No items yet"
            emptyText="বিদ্যুৎ কার্ড, গ্যাস কার্ড, চাবির মতো যা দিয়েছেন লিখে রাখুন।"
            renderRow={(item) => (
              <>
                <p className="text-sm font-medium wrap-break-word">{item.name}</p>
                {item.note && <p className="text-xs text-muted">{item.note}</p>}
              </>
            )}
            renderActions={(item, index, save) => (
              <button
                type="button"
                aria-pressed={item.isReturned}
                onClick={() =>
                  save(tenancy.handoverItems.map((entry, entryIndex) => (entryIndex === index ? { ...entry, isReturned: !entry.isReturned } : entry))).catch(
                    (err) => toast.error(getErrorMessage(err, "সেভ হয়নি।"))
                  )
                }
                className="min-h-11 shrink-0 rounded-lg px-2"
              >
                <Badge variant={item.isReturned ? "success" : "warning"}>{item.isReturned ? "Returned" : "With tenant"}</Badge>
              </button>
            )}
          />
        )}

        {activeTab === "bills" && <TenancyBills tenancyId={tenancyId} />}
        {activeTab === "documents" && <DocumentsPanel tenant={tenant} />}
      </div>

      {isEditing && <EditTenancyModal tenancy={tenancy} onClose={() => setIsEditing(false)} />}

      {isNoticeOpen && (
        <DateActionModal
          title="Moving Out Notice"
          description="কবে বাসা ছাড়বেন লিখে রাখলে ড্যাশবোর্ডে দেখাবে কোন ফ্ল্যাট খালি হচ্ছে।"
          label="Leaving date"
          initialDate=""
          confirmLabel="Save Notice"
          isLoading={isSavingNotice}
          onConfirm={handleNotice}
          onClose={() => setIsNoticeOpen(false)}
        />
      )}

      {isMoveOutOpen && (
        <DateActionModal
          title="Move Out"
          description="ভাড়াটিয়া বাসা ছাড়লে ইউনিট নিজে থেকেই Vacant হবে। তাঁর সব তথ্য ইতিহাসে থেকে যাবে।"
          label="Move-out date"
          initialDate={todayInput()}
          confirmLabel="Confirm Move Out"
          isLoading={isEnding}
          onConfirm={handleMoveOut}
          onClose={() => setIsMoveOutOpen(false)}
        />
      )}
    </div>
  );
};

export default TenancyDetailsPage;
