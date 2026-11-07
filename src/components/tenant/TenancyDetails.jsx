"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, CalendarClock, CalendarDays, Clock, KeyRound, Link2, LogOut, MessageCircle, Pencil, Phone, SearchX, User, Users } from "lucide-react";
import { toast } from "sonner";
import TenancyBills from "@/components/bill/TenancyBills";
import IssuePanel from "@/components/issue/IssuePanel";
import DateActionModal from "@/components/tenant/DateActionModal";
import DocumentsPanel from "@/components/tenant/DocumentsPanel";
import EditSectionModal from "@/components/tenant/EditSectionModal";
import EditTenancyModal from "@/components/tenant/EditTenancyModal";
import EditableList from "@/components/tenant/EditableList";
import MembersPanel from "@/components/tenant/MembersPanel";
import ShareForm from "@/components/tenantForm/ShareForm";
import TermsCard from "@/components/tenantForm/TermsCard";
import ActionMenu from "@/components/ui/ActionMenu";
import NidField from "@/components/tenant/NidField";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DetailHeader from "@/components/ui/DetailHeader";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import Tabs from "@/components/ui/Tabs";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { rentStatusLine } from "@/lib/billOptions";
import { formatDate, formatSince, formatStay, toDateInput, todayInput } from "@/lib/tenancyOptions";
import { GENDERS } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import {
  useCancelNoticeMutation,
  useEndTenancyMutation,
  useGetTenancyQuery,
  useGiveNoticeMutation,
  useRevealNidMutation,
} from "@/redux/features/tenancy/tenancyApi";
import { useGetTenancyBillsQuery } from "@/redux/features/bill/billApi";
import { useGetIssuesQuery } from "@/redux/features/issue/issueApi";

const ITEM_FIELDS = [
  { key: "name", label: "Item", placeholder: "বিদ্যুৎ কার্ড, গ্যাস কার্ড, চাবি", required: true, requiredMessage: "জিনিসের নাম লিখুন" },
  { key: "note", label: "Note (optional)", placeholder: "যেমন: কার্ড নম্বর" },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (from, to) => Math.ceil((new Date(to) - new Date(from)) / DAY_MS);

const GENDER_OPTIONS = [{ value: "", label: "Not set" }, ...GENDERS];

// প্রতিটি অংশের নিজের Edit
const SECTIONS = {
  personal: {
    title: "ব্যক্তিগত তথ্য",
    fields: [
      { key: "name", label: "পুরো নাম", required: true },
      { key: "phone", label: "মোবাইল", type: "tel", isNumber: true, required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "gender", label: "লিঙ্গ", options: GENDER_OPTIONS },
      { key: "age", label: "বয়স", type: "number" },
      { key: "occupation", label: "পেশা" },
      { key: "workplace", label: "কর্মস্থল" },
      { key: "companyName", label: "প্রতিষ্ঠান" },
      { key: "tradeLicense", label: "Trade License" },
    ],
  },
  address: {
    title: "ঠিকানা ও NID",
    fields: [
      { key: "permanentAddress", label: "স্থায়ী ঠিকানা" },
      { key: "previousAddress", label: "আগের ঠিকানা" },
      { key: "nid", label: "NID নম্বর", isNumber: true, placeholder: (tenant) => (tenant.nidLast4 ? `শেষ ৪ সংখ্যা ${tenant.nidLast4}, বদলাতে নতুন লিখুন` : "১০ থেকে ১৭ সংখ্যা") },
    ],
  },
  emergency: {
    title: "জরুরি যোগাযোগ",
    fields: [
      { key: "emergencyName", label: "নাম" },
      { key: "emergencyPhone", label: "মোবাইল", type: "tel", isNumber: true },
    ],
  },
};

const SectionCard = ({ title, onEdit, children }) => (
  <Card className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-bold">{title}</h2>
      <button type="button" aria-label={`Edit ${title}`} onClick={onEdit} className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft">
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    <dl className="grid grid-cols-2 gap-3">{children}</dl>
  </Card>
);

const InfoRow = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm wrap-break-word">{children || <span className="text-muted">দেওয়া হয়নি</span>}</dd>
  </div>
);

// ভাড়াটিয়ার পুরো হিসাব — Tenants পেজ ও ইউনিটের পেজ দুটোতেই এটাই
// embedded — ইউনিটের পেজের ভেতরে, extraTabs — সেই পেজের নিজের tab
// leading — ইউনিটের শিরোনাম, ভাড়াটিয়ার পাশেই বসে
const TenancyDetails = ({ tenancyId, embedded = false, extraTabs = [], leading = null, initialTab = "overview" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isMoveOutOpen, setIsMoveOutOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  const { data, error, isLoading } = useGetTenancyQuery(tenancyId);
  const { data: billsData } = useGetTenancyBillsQuery(tenancyId);
  const { data: issuesData } = useGetIssuesQuery({ tenancyId });
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

  const actions = [
    ...(tenancy.copyToken ? [{ key: "link", label: "Form Link", icon: Link2, onClick: () => setIsLinkOpen(true) }] : []),
    { key: "edit", label: embedded ? "Edit Tenant" : "Edit", icon: Pencil, onClick: () => setIsEditing(true) },
    ...(isActive ? [{ key: "moveOut", label: "Move Out", icon: LogOut, onClick: () => setIsMoveOutOpen(true) }] : []),
  ];

  const tenantHeader = (
    <DetailHeader
      compact={embedded}
      title={tenancy.tenantName}
      subtitle={embedded ? `মূল ভাড়াটিয়া · ${tenancy.tenantPhone}` : `${tenancy.unitName}, ${tenancy.propertyName}`}
      icon={User}
      badge={isActive ? <Badge variant="success">{tenancy.occupantType}</Badge> : <Badge>Former</Badge>}
      actions={<ActionMenu items={actions} alwaysMenu={embedded} />}
    />
  );

  const daysLeft = tenancy.notice ? daysBetween(new Date(), tenancy.notice.leavingDate) : 0;


  return (
    <div className="flex flex-col gap-5">
      {!embedded && (
        <Link href="/tenants" className="-mb-2 inline-flex min-h-9 w-fit items-center gap-1 text-sm text-muted hover:text-foreground md:hidden">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Tenants
        </Link>
      )}

      {leading ? (
        <div data-unit-header className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-center xl:gap-6">
          <div className="min-w-0 xl:flex-1">{leading}</div>
          <div className="min-w-0 xl:flex-1 xl:border-l xl:border-border xl:pl-6">{tenantHeader}</div>
        </div>
      ) : (
        tenantHeader
      )}

      {isActive &&
        (tenancy.notice ? (
          <div data-leaving className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3">
            <div className="flex min-w-0 items-start gap-2 text-warning-foreground">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-base font-bold">
                  {formatDate(tenancy.notice.leavingDate)} তারিখে বাসা ছাড়বেন
                  {daysLeft > 0 ? `, আর ${toBanglaNumber(daysLeft)} দিন বাকি` : ""}
                </p>
                <p className="text-sm">
                  {daysLeft > 0
                    ? `${toBanglaNumber(daysBetween(tenancy.notice.givenAt, tenancy.notice.leavingDate))} দিন আগে জানিয়েছেন`
                    : "তারিখ পার হয়ে গেছে। বাসা ছেড়ে থাকলে Move Out করুন।"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsNoticeOpen(true)}>
                Change Date
              </Button>
              <Button variant="ghost" size="sm" isLoading={isCancelling} onClick={handleCancelNotice}>
                Cancel Notice
              </Button>
            </div>
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
          { key: "rent", label: "Monthly rent", value: formatMoney(tenancy.rent), hint: isActive ? rentStatusLine(billsData?.data || []) : undefined, icon: Banknote, onClick: () => setActiveTab("bills") },
          { key: "dueDay", label: "Rent day", value: `Day ${tenancy.dueDay}`, icon: CalendarDays, tone: "blue" },
          { key: "stay", label: "Staying for", value: formatStay(tenancy.startDate, tenancy.endDate), hint: formatSince(tenancy.startDate), icon: Clock, tone: "amber" },
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
            { value: "members", label: "Members", count: tenancy.members.filter(({ leftAt }) => !leftAt).length + 1 },
            { value: "items", label: "Items given", count: tenancy.handoverItems.length },
            { value: "bills", label: "Bills" },
            { value: "documents", label: "Documents", count: tenant.documents?.length || 0 },
            { value: "issues", label: "Complain & Needs", count: (issuesData?.data || []).filter(({ status }) => status !== "Done").length },
            ...extraTabs.map(({ value, label, count }) => ({ value, label, count })),
          ]}
        />

        {activeTab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={SECTIONS.personal.title} onEdit={() => setEditingSection(SECTIONS.personal)}>
              <div className="col-span-2 min-w-0">
                <dt className="text-xs text-muted">Mobile</dt>
                <dd className="flex flex-wrap items-center gap-3 text-sm">
                  <a href={`tel:${tenant.phone}`} className="inline-flex min-h-9 items-center gap-1 font-medium">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {tenant.phone}
                  </a>
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 text-muted hover:text-foreground">
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    WhatsApp
                  </a>
                </dd>
              </div>
              <InfoRow label="Occupation">{tenant.occupation}</InfoRow>
              <InfoRow label="Email">{tenant.email}</InfoRow>
              {tenant.gender && <InfoRow label="Gender">{GENDERS.find(({ value }) => value === tenant.gender)?.label}</InfoRow>}
              {tenant.age !== null && tenant.age !== undefined && <InfoRow label="Age">{tenant.age}</InfoRow>}
              {tenant.workplace && <InfoRow label="Workplace">{tenant.workplace}</InfoRow>}
              {tenant.companyName && <InfoRow label="Company">{tenant.companyName}</InfoRow>}
              {tenant.tradeLicense && <InfoRow label="Trade License">{tenant.tradeLicense}</InfoRow>}
              {tenant.formAnswers?.map(({ question, answer }) => answer && <InfoRow key={question} label={question}>{answer}</InfoRow>)}
            </SectionCard>

            <SectionCard title={SECTIONS.address.title} onEdit={() => setEditingSection(SECTIONS.address)}>
              <div className="col-span-2 min-w-0">
                <dt className="text-xs text-muted">NID</dt>
                <dd>
                  <NidField last4={tenant.nidLast4} isLoading={isRevealing} onReveal={() => revealNid(tenant._id).unwrap()} />
                </dd>
              </div>
              <InfoRow label="Permanent address">{tenant.permanentAddress}</InfoRow>
              {tenant.previousAddress && <InfoRow label="Previous address">{tenant.previousAddress}</InfoRow>}
            </SectionCard>

            <SectionCard title={SECTIONS.emergency.title} onEdit={() => setEditingSection(SECTIONS.emergency)}>
              <InfoRow label="Name">{tenant.emergencyName}</InfoRow>
              <InfoRow label="Mobile">{tenant.emergencyPhone}</InfoRow>
            </SectionCard>

            <SectionCard title="ভাড়ার তথ্য" onEdit={() => setIsEditing(true)}>
              <InfoRow label="Moved in">{formatDate(tenancy.startDate)}</InfoRow>
              {tenancy.endDate && <InfoRow label="Moved out">{formatDate(tenancy.endDate)}</InfoRow>}
              <InfoRow label="Advance">{formatMoney(tenancy.advance)}</InfoRow>
              {tenancy.hasSublet && (
                <InfoRow label="Sublet">
                  {tenancy.subletNote || "সাবলেট আছে"} ({toBanglaNumber(tenancy.subletPeople)} জন)
                </InfoRow>
              )}
            </SectionCard>
          </div>
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

        {activeTab === "bills" && <TenancyBills tenancyId={tenancyId} canCreate={isActive} />}
        {activeTab === "documents" && <DocumentsPanel tenant={tenant} />}
        {activeTab === "issues" && <IssuePanel tenancyId={tenancyId} canAdd={isActive} />}
        {extraTabs.find(({ value }) => value === activeTab)?.content}
      </div>

      {isEditing && <EditTenancyModal tenancy={tenancy} onClose={() => setIsEditing(false)} />}
      {editingSection && <EditSectionModal tenant={tenant} section={editingSection} onClose={() => setEditingSection(null)} />}

      {isLinkOpen && (
        <Modal title="Form Link" onClose={() => setIsLinkOpen(false)} size="lg">
          <div className="flex flex-col gap-3">
            <ShareForm
              form={{ token: tenancy.copyToken, propertyName: tenancy.propertyName, unitName: tenancy.unitName }}
              message={`${tenancy.propertyName}, ${tenancy.unitName} এর ফর্মের কপি:`}
              note="ভাড়াটিয়া এই লিংকে নিজের কপি দেখতে ও PDF নামাতে পারবেন।"
            />
            <a href={`/form/${tenancy.copyToken}`} target="_blank" rel="noreferrer" className="w-fit text-sm font-semibold text-primary underline-offset-2 hover:underline">
              Tenant Copy
            </a>
          </div>
        </Modal>
      )}

      {isNoticeOpen && (
        <DateActionModal
          title="Moving Out Notice"
          description="কবে বাসা ছাড়বেন লিখে রাখলে ড্যাশবোর্ডে দেখাবে কোন ফ্ল্যাট খালি হচ্ছে।"
          label="Leaving date"
          initialDate={tenancy.notice ? toDateInput(tenancy.notice.leavingDate) : ""}
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

export default TenancyDetails;
