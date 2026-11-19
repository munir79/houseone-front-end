"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, CalendarClock, CalendarDays, ChevronRight, Clock, FileSignature, TrendingUp, KeyRound, Link2, LogOut, MessageCircle, Pencil, Phone, Receipt, SearchX, Store, User, Users } from "lucide-react";
import { toast } from "sonner";
import TenancyBills from "@/components/bill/TenancyBills";
import EditContractModal from "@/components/market/EditContractModal";
import IncreaseModal from "@/components/market/IncreaseModal";
import RenewContractModal from "@/components/market/RenewContractModal";
import InstallmentsPanel from "@/components/market/InstallmentsPanel";
import ShopContractPanel from "@/components/market/ShopContractPanel";
import IssuePanel from "@/components/issue/IssuePanel";
import DateActionModal from "@/components/tenant/DateActionModal";
import MoveOutModal from "@/components/tenant/MoveOutModal";
import SettlementModal from "@/components/tenant/SettlementModal";
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
import { businessTypeLabel } from "@/lib/marketOptions";
import { formatDate, formatSince, formatStay, toDateInput } from "@/lib/tenancyOptions";
import { GENDERS } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import {
  useCancelNoticeMutation,
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
// afterNotice — বাসা ছাড়ার নোটিশের নিচে বাড়তি অংশ (ইউনিটের পেজে পরের ভাড়াটিয়ার ফর্ম)
const TenancyDetails = ({ tenancyId, embedded = false, extraTabs = [], leading = null, initialTab = "overview", afterNotice = null, onMovedOut }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isMoveOutOpen, setIsMoveOutOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isIncreaseOpen, setIsIncreaseOpen] = useState(false);

  const { data, error, isLoading } = useGetTenancyQuery(tenancyId);
  const { data: billsData } = useGetTenancyBillsQuery(tenancyId);
  const { data: issuesData } = useGetIssuesQuery({ tenancyId });
  const [giveNotice, { isLoading: isSavingNotice }] = useGiveNoticeMutation();
  const [cancelNotice, { isLoading: isCancelling }] = useCancelNoticeMutation();
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

  const { tenant, market } = tenancy;
  const isActive = tenancy.status === "Active";
  const whatsappNumber = `88${tenant.phone}`;
  // মার্কেটের দোকান — ব্যবসার নাম আগে, চুক্তি ও জমার আলাদা tab
  const isShop = Boolean(market);
  const place = isShop ? "দোকান" : "বাসা";
  const hasInstallments = isShop && tenancy.deposits.position.installments.length > 1;
  const depositDue = isShop ? tenancy.deposits.security.due + tenancy.deposits.advance.due + tenancy.deposits.position.due : 0;

  const actions = [
    ...(tenancy.copyToken ? [{ key: "link", label: "Form Link", icon: Link2, onClick: () => setIsLinkOpen(true) }] : []),
    { key: "edit", label: isShop ? "চুক্তি Edit" : embedded ? "Edit Tenant" : "Edit", icon: Pencil, onClick: () => setIsEditing(true) },
    ...(isShop && isActive ? [{ key: "renew", label: "নবায়ন করুন", icon: FileSignature, onClick: () => setIsRenewOpen(true) }] : []),
    ...(isActive ? [{ key: "moveOut", label: "Move Out", icon: LogOut, onClick: () => setIsMoveOutOpen(true) }] : []),
  ];

  const tenantHeader = (
    <DetailHeader
      compact={embedded}
      title={isShop ? market.businessName : tenancy.tenantName}
      subtitle={
        isShop
          ? embedded
            ? `${tenancy.tenantName} · ${tenancy.tenantPhone}`
            : `${tenancy.tenantName} · ${tenancy.unitName}, ${tenancy.propertyName}`
          : embedded
            ? `মূল ভাড়াটিয়া · ${tenancy.tenantPhone}`
            : `${tenancy.unitName}, ${tenancy.propertyName}`
      }
      icon={isShop ? Store : User}
      badge={isActive ? <Badge variant="success">{isShop ? businessTypeLabel(market) || "দোকান" : tenancy.occupantType}</Badge> : <Badge>Former</Badge>}
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
                  {formatDate(tenancy.notice.leavingDate)} তারিখে {place} ছাড়বেন
                  {daysLeft > 0 ? `, আর ${toBanglaNumber(daysLeft)} দিন বাকি` : ""}
                </p>
                <p className="text-sm">
                  {daysLeft > 0
                    ? `${toBanglaNumber(daysBetween(tenancy.notice.givenAt, tenancy.notice.leavingDate))} দিন আগে জানিয়েছেন`
                    : `তারিখ পার হয়ে গেছে। ${place} ছেড়ে থাকলে Move Out করুন।`}
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
            {isShop ? "ব্যবসায়ী দোকান ছাড়ার কথা জানিয়েছেন?" : "ভাড়াটিয়া বাসা ছাড়ার কথা জানিয়েছেন?"}
          </button>
        ))}

      {isShop && isActive && tenancy.renewDue && (
        <div data-renew-due className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3">
          <div className="flex min-w-0 items-start gap-2 text-warning-foreground">
            <FileSignature className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-base font-bold">
                {new Date(market.contractEnd) < new Date() ? `চুক্তি ${formatDate(market.contractEnd)} তারিখে শেষ হয়ে গেছে` : `চুক্তি ${formatDate(market.contractEnd)} তারিখে শেষ হবে`}
              </p>
              <p className="text-sm">থাকতে চাইলে নবায়ন করুন, না চাইলে নোটিশ লিখে রাখুন।</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setIsRenewOpen(true)}>
            নবায়ন করুন
          </Button>
        </div>
      )}

      {/* চুক্তির নিয়মে ভাড়া বাড়ার সময় — মালিক না বললে বাড়ে না */}
      {isShop && isActive && tenancy.increaseDue && (
        <div data-increase-due className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-info/30 bg-info-soft px-4 py-3">
          <div className="flex min-w-0 items-start gap-2 text-info-foreground">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-base font-bold">
                ভাড়া বৃদ্ধির সময় · {formatDate(tenancy.increaseDue.dueOn)}
              </p>
              <p className="text-sm">
                নিয়ম অনুযায়ী {formatMoney(tenancy.increaseDue.currentRent)} থেকে {formatMoney(tenancy.increaseDue.suggestedRent)}। আপনি রাজি হলে তবেই বাড়বে।
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setIsIncreaseOpen(true)}>
            সিদ্ধান্ত নিন
          </Button>
        </div>
      )}

      {isActive && tenancy.notice && afterNotice}

      {!isActive && tenancy.settlement && (
        <div data-settlement-card className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="block font-semibold">{formatDate(tenancy.endDate)} তারিখে {place} ছেড়েছেন</span>
            <span className="text-muted">
              {[
                tenancy.settlement.refund > 0 && `Advance ফেরত ${formatMoney(tenancy.settlement.refund)}`,
                tenancy.settlement.unpaid > 0 && `আদায় হয়নি ${formatMoney(tenancy.settlement.unpaid)}`,
                tenancy.settlement.itemsNotReturned.length > 0 && `ফেরত দেননি: ${tenancy.settlement.itemsNotReturned.join(", ")}`,
              ]
                .filter(Boolean)
                .join(" · ") || "সব হিসাব মিটে গেছে"}
            </span>
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsSettlementOpen(true)} className="shrink-0">
            বিদায়ী হিসাব
          </Button>
        </div>
      )}

      <StatStrip
        items={
          isShop
            ? [
                { key: "rent", label: "মাসিক ভাড়া", value: formatMoney(tenancy.rent), hint: isActive ? rentStatusLine(billsData?.data || []) : undefined, icon: Banknote, onClick: () => setActiveTab("bills") },
                { key: "service", label: "সার্ভিস চার্জ", value: formatMoney(market.serviceCharge), hint: `প্রতি মাসের ${toBanglaNumber(tenancy.dueDay)} তারিখ`, icon: CalendarDays, tone: "blue" },
                { key: "contract", label: "চুক্তি শেষ", value: market.contractEnd ? formatDate(market.contractEnd) : "—", hint: formatSince(tenancy.startDate), icon: FileSignature, tone: "amber", onClick: () => setActiveTab("contract") },
                { key: "deposit", label: "জমা বাকি", value: formatMoney(depositDue), hint: depositDue > 0 ? "সিকিউরিটি, অগ্রিম, পজিশন" : "সব পেয়েছেন", icon: Receipt, tone: "violet", onClick: () => setActiveTab("contract") },
              ]
            : [
                { key: "rent", label: "Monthly rent", value: formatMoney(tenancy.rent), hint: isActive ? rentStatusLine(billsData?.data || []) : undefined, icon: Banknote, onClick: () => setActiveTab("bills") },
                { key: "dueDay", label: "Rent day", value: `Day ${tenancy.dueDay}`, icon: CalendarDays, tone: "blue" },
                { key: "stay", label: "Staying for", value: formatStay(tenancy.startDate, tenancy.endDate), hint: formatSince(tenancy.startDate), icon: Clock, tone: "amber" },
                { key: "people", label: "People", value: tenancy.peopleCount, icon: Users, tone: "violet" },
              ]
        }
      />

      <div className="flex flex-col gap-4">
        <Tabs
          label="Tenant sections"
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: "overview", label: "Overview" },
            ...(isShop
              ? [
                  { value: "contract", label: "চুক্তি ও টাকা" },
                  // পজিশন মানি কিস্তিতে নিলে তবেই
                  ...(hasInstallments ? [{ value: "installments", label: "কিস্তি", count: tenancy.deposits.position.installments.filter(({ status }) => status !== "Paid").length }] : []),
                ]
              : [{ value: "members", label: "Members", count: tenancy.members.filter(({ leftAt }) => !leftAt).length + 1 }]),
            { value: "items", label: "Items given", count: tenancy.handoverItems.length },
            { value: "bills", label: "Bills" },
            { value: "documents", label: "Documents", count: tenant.documents?.length || 0 },
            { value: "issues", label: "Complain & Needs", count: (issuesData?.data || []).filter(({ status }) => status !== "Done").length },
            ...extraTabs.map(({ value, label, count }) => ({ value, label, count })),
          ]}
        />

        {activeTab === "overview" && isShop && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="ব্যবসা ও মালিক" onEdit={() => setEditingSection(SECTIONS.personal)}>
              <InfoRow label="ব্যবসা">{market.businessName}</InfoRow>
              <InfoRow label="ধরন">{businessTypeLabel(market)}</InfoRow>
              <InfoRow label="মালিক">{tenant.name}</InfoRow>
              <InfoRow label="Trade License">{market.tradeLicense}</InfoRow>
              <div className="col-span-2 min-w-0">
                <dt className="text-xs text-muted">মোবাইল</dt>
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
            </SectionCard>

            <SectionCard title={SECTIONS.address.title} onEdit={() => setEditingSection(SECTIONS.address)}>
              <div className="col-span-2 min-w-0">
                <dt className="text-xs text-muted">NID</dt>
                <dd>
                  <NidField last4={tenant.nidLast4} isLoading={isRevealing} onReveal={() => revealNid(tenant._id).unwrap()} />
                </dd>
              </div>
              <InfoRow label="ঠিকানা">{tenant.permanentAddress}</InfoRow>
            </SectionCard>

            <SectionCard title="পরিবারের সদস্য" onEdit={() => setIsEditing(true)}>
              {market.family.length === 0 ? (
                <p className="col-span-2 text-sm text-muted">কারও তথ্য দেওয়া হয়নি।</p>
              ) : (
                market.family.map((member) => (
                  <div key={`${member.name}-${member.phone}`} data-family-member className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-1">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium wrap-break-word">{member.name}</span>
                      <span className="block text-xs text-muted">{member.relation}</span>
                    </span>
                    <a href={`tel:${member.phone}`} className="inline-flex min-h-9 items-center gap-1 text-sm">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {member.phone}
                    </a>
                  </div>
                ))
              )}
            </SectionCard>

            <Card flush className="overflow-hidden">
              <h2 className="border-b border-border px-4 py-3 text-base font-bold">এই ব্যবসায়ীর অন্য দোকান</h2>
              {tenancy.otherShops.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">আর কোনো দোকান নেই।</p>
              ) : (
                <ul data-other-shops className="divide-y divide-border">
                  {tenancy.otherShops.map((shop) => (
                    <li key={shop._id}>
                      <Link href={`/tenants/${shop._id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium wrap-break-word">
                            {shop.unitName} · {shop.market?.businessName}
                          </span>
                          <span className="block text-xs text-muted">
                            {shop.propertyName} · {formatMoney(shop.rent)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge variant={shop.status === "Active" ? "success" : "primary"}>{shop.status === "Active" ? "চলছে" : "ছেড়েছেন"}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {activeTab === "contract" && isShop && <ShopContractPanel tenancy={tenancy} onOpenInstallments={hasInstallments ? () => setActiveTab("installments") : undefined} />}
        {activeTab === "installments" && hasInstallments && <InstallmentsPanel tenancy={tenancy} />}

        {activeTab === "overview" && !isShop && (
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
            <h2 className="text-base font-bold">{isShop ? "মার্কেটের নিয়ম" : "House rules"}</h2>
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

        {activeTab === "bills" && <TenancyBills tenancy={tenancy} canCreate={isActive} />}
        {activeTab === "documents" && <DocumentsPanel tenant={tenant} />}
        {activeTab === "issues" && <IssuePanel tenancyId={tenancyId} canAdd={isActive} />}
        {extraTabs.find(({ value }) => value === activeTab)?.content}
      </div>

      {isEditing && (isShop ? <EditContractModal tenancy={tenancy} onClose={() => setIsEditing(false)} /> : <EditTenancyModal tenancy={tenancy} onClose={() => setIsEditing(false)} />)}
      {isRenewOpen && <RenewContractModal tenancy={tenancy} onClose={() => setIsRenewOpen(false)} />}
      {isIncreaseOpen && <IncreaseModal tenancy={tenancy} onClose={() => setIsIncreaseOpen(false)} />}
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

      {isMoveOutOpen && <MoveOutModal tenancy={tenancy} onMovedOut={onMovedOut} onClose={() => setIsMoveOutOpen(false)} />}
      {isSettlementOpen && <SettlementModal tenancy={tenancy} onClose={() => setIsSettlementOpen(false)} />}
    </div>
  );
};

export default TenancyDetails;
