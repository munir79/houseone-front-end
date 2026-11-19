"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import Link from "next/link";
import { Banknote, Briefcase, CalendarClock, ChevronRight, FileSignature, FileText, Home, KeyRound, Search, SearchX, Store, User, Users, UsersRound, WifiOff } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import LinkButton from "@/components/ui/LinkButton";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { businessTypeLabel } from "@/lib/marketOptions";
import { OCCUPANT_TYPE_OPTIONS, formatDate } from "@/lib/tenancyOptions";
import { FORM_STATUS } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetTenanciesQuery, useGetTenancySummaryQuery } from "@/redux/features/tenancy/tenancyApi";
import { useGetOpenFormsQuery } from "@/redux/features/tenantForm/tenantFormApi";

const SEARCH_DEBOUNCE_MS = 350;
const CURRENT = "Current";
const FORMER = "Former";

const TYPE_FILTERS = [{ value: "", label: "All types" }, ...OCCUPANT_TYPE_OPTIONS];

const ROW_COLUMNS = "xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_20px] xl:gap-4";

const RENEW_NOTICE_MS = 30 * 24 * 60 * 60 * 1000;
const isRenewDue = (tenancy) => tenancy.status === "Active" && tenancy.market?.contractEnd && new Date(tenancy.market.contractEnd).getTime() - Date.now() <= RENEW_NOTICE_MS;

const StatusBadge = ({ tenancy }) =>
  tenancy.notice ? (
    <Badge variant="warning">Leaving</Badge>
  ) : tenancy.status === "Ended" ? (
    <Badge>Former</Badge>
  ) : isRenewDue(tenancy) ? (
    <Badge variant="warning">নবায়ন বাকি</Badge>
  ) : (
    <Badge variant="success">Active</Badge>
  );

// মার্কেটের তালিকা — ব্যবসার নাম আগে, তারপর মালিক
const ShopRow = ({ tenancy }) => (
  <li>
    <Link href={`/tenants/${tenancy._id}`} data-shop-row className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background ${ROW_COLUMNS}`}>
      <span className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Store className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold wrap-break-word">{tenancy.market?.businessName || tenancy.tenantName}</span>
          <span className="block text-xs text-muted">
            {tenancy.tenantName} · {tenancy.tenantPhone}
          </span>
          <span className="block text-xs text-muted xl:hidden">
            {tenancy.unitName} দোকান · {formatMoney(tenancy.rent)}
          </span>
        </span>
      </span>
      <span className="hidden min-w-0 xl:block">
        <span className="block truncate text-sm">{tenancy.unitName}</span>
        {tenancy.market?.contractEnd && <span className="block truncate text-xs text-muted">চুক্তি {formatDate(tenancy.market.contractEnd)} পর্যন্ত</span>}
      </span>
      <span className="hidden truncate text-sm text-muted xl:block">{businessTypeLabel(tenancy.market) || "—"}</span>
      <span className="hidden text-sm tabular-nums xl:block">{formatMoney(tenancy.rent)}</span>
      <span className="shrink-0">
        <StatusBadge tenancy={tenancy} />
      </span>
      <ChevronRight className="hidden h-4 w-4 text-muted xl:block" aria-hidden="true" />
    </Link>
  </li>
);

const TenantRow = ({ tenancy }) => (
  <li>
    <Link href={`/tenants/${tenancy._id}`} className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background ${ROW_COLUMNS}`}>
      <span className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
          {tenancy.tenantName.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
        <span className="block text-sm font-semibold wrap-break-word">{tenancy.tenantName}</span>
        <span className="block text-xs text-muted">
          {tenancy.tenantPhone}
          {tenancy.peopleCount > 1 && ` · মোট ${toBanglaNumber(tenancy.peopleCount)} জন`}
        </span>
        <span className="block text-xs text-muted xl:hidden">
          {tenancy.unitName}, {tenancy.propertyName}
        </span>
        </span>
      </span>
      <span className="hidden min-w-0 xl:block">
        <span className="block truncate text-sm">{tenancy.unitName}</span>
        <span className="block truncate text-xs text-muted">{tenancy.propertyName}</span>
      </span>
      <span className="hidden text-sm text-muted xl:block">{tenancy.occupantType}</span>
      <span className="hidden text-sm tabular-nums xl:block">{formatMoney(tenancy.rent)}</span>
      <span className="shrink-0">
        {tenancy.notice ? (
          <Badge variant="warning">Leaving</Badge>
        ) : tenancy.status === "Ended" ? (
          <Badge>Former</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )}
      </span>
      <ChevronRight className="hidden h-4 w-4 text-muted xl:block" aria-hidden="true" />
    </Link>
  </li>
);

// propertyId — একটা সম্পদের ভেতরে শুধু সেই বাড়ির ভাড়াটিয়া
// isMarket — মার্কেটের ভেতরে "ব্যবসায়ী" তালিকা
const TenantsBoard = ({ propertyId, isMarket: inMarket = false }) => {
  const { world } = useWorkspace();
  // সব সম্পদের পাতায় মার্কেটের জগতে থাকলে ব্যবসায়ীর তালিকা
  const isMarket = inMarket || (!propertyId && world === "market");
  const view = CURRENT;
  const [occupantType, setOccupantType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, error, isLoading, refetch } = useGetTenanciesQuery({
    page,
    search,
    occupantType,
    status: "Active",
    ...(propertyId ? { propertyId } : { world }),
  });
  const { data: summaryData, isLoading: isSummaryLoading } = useGetTenancySummaryQuery(propertyId ? { propertyId } : { world });
  const { data: formsData } = useGetOpenFormsQuery(world);

  const tenancies = data?.data?.data || [];
  const meta = data?.data?.meta;
  const summary = summaryData?.data;
  const leavingSoon = summary?.leavingSoon || [];
  const openForms = (formsData?.data || []).filter((form) => !propertyId || String(form.property) === String(propertyId));
  const isFiltered = Boolean(search || occupantType);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isMarket ? "ব্যবসায়ী" : propertyId ? "ভাড়াটিয়া" : "Tenants"}
        description={isMarket ? "এই মার্কেটের সব ব্যবসায়ী ও তাঁদের দোকান" : propertyId ? "এই সম্পদের সব ভাড়াটিয়া" : "আপনার সব ভাড়াটিয়া এক জায়গায়"}
        action={<LinkButton href={propertyId ? `/properties/${propertyId}/units` : "/properties"}>{isMarket ? "দোকান থেকে ভাড়া দিন" : "Add from a Unit"}</LinkButton>}
      />

      <StatStrip
        isLoading={isSummaryLoading}
        items={isMarket ? [
          { key: "active", label: "ভাড়া দেওয়া দোকান", value: summary?.active, icon: Store },
          { key: "rent", label: "মাসিক ভাড়া", value: summary ? formatMoney(summary.monthlyRent) : undefined, icon: Banknote, tone: "blue" },
          { key: "renew", label: "নবায়ন বাকি", value: view === CURRENT ? tenancies.filter(isRenewDue).length : undefined, hint: "এই পাতায়", icon: FileSignature, tone: "amber" },
          { key: "leaving", label: "ছেড়ে যাচ্ছেন", value: summary?.leavingSoon?.length, icon: CalendarClock, tone: "red" },
        ] : [
          { key: "active", label: "Tenants", value: summary?.active, icon: Users },
          { key: "people", label: "Total People", value: summary?.people, icon: UsersRound, tone: "violet" },
          { key: "family", label: "Family", value: summary?.family, icon: Home, tone: "blue" },
          { key: "bachelor", label: "Bachelor", value: summary?.bachelor, icon: User, tone: "amber" },
          { key: "sublet", label: "Sublet", value: summary?.sublet, icon: KeyRound, tone: "red" },
          { key: "office", label: "Office & Shop", value: summary ? summary.office + summary.shop : undefined, icon: Briefcase },
        ]}
      />

      {openForms.length > 0 && (
        <Card flush className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <FileText className="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 className="text-sm font-semibold">{isMarket ? "ব্যবসায়ীর ফর্ম" : "Tenant forms"}</h2>
          </div>
          <ul className="divide-y divide-border">
            {openForms.map((form) => (
              <li key={form._id}>
                <Link href={`/tenants/forms/${form._id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background">
                  <span className="min-w-0">
                    <span className="block text-sm wrap-break-word">{form.name || form.unitName}</span>
                    <span className="block text-xs text-muted">
                      {form.unitName}, {form.propertyName}
                    </span>
                  </span>
                  <Badge variant={FORM_STATUS[form.status].variant}>{FORM_STATUS[form.status].label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {leavingSoon.length > 0 && (
        <Card flush className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <CalendarClock className="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Leaving soon</h2>
          </div>
          <ul className="divide-y divide-border">
            {leavingSoon.map((item) => (
              <li key={item._id}>
                <Link href={`/tenants/${item._id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background">
                  <span className="min-w-0 text-sm wrap-break-word">
                    {item.unitName}, {item.propertyName}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{formatDate(item.notice.leavingDate)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card flush className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="tenancySearch"
              compact
              type="search"
              aria-label="Search tenants"
              placeholder={isMarket ? "ব্যবসা, নাম, মোবাইল বা দোকান খুঁজুন" : "নাম, মোবাইল বা ফ্ল্যাট খুঁজুন"}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
              className="w-full sm:w-64"
            />
            {!isMarket && <Select
              id="occupantFilter"
              compact
              aria-label="Filter by tenant type"
              options={TYPE_FILTERS}
              value={occupantType}
              onChange={(e) => {
                setOccupantType(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-36"
            />}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <EmptyState
            icon={WifiOff}
            title="Could not load tenants"
            description={getErrorMessage(error)}
            action={<Button onClick={refetch}>Try again</Button>}
          />
        ) : tenancies.length === 0 ? (
          isFiltered ? (
            <EmptyState icon={SearchX} title={isMarket ? "কাউকে পাওয়া যায়নি" : "No tenant found"} description={isMarket ? "এই খোঁজায় কোনো ব্যবসায়ী পাওয়া যায়নি।" : "এই খোঁজায় কোনো ভাড়াটিয়া পাওয়া যায়নি।"} />
          ) : (
            <EmptyState
              icon={Users}
              title={isMarket ? (view === CURRENT ? "এখনো কোনো দোকান ভাড়া হয়নি" : "আগের কোনো ব্যবসায়ী নেই") : view === CURRENT ? "No tenants yet" : "No former tenants"}
              description={
                isMarket
                  ? view === CURRENT
                    ? "দোকানে গিয়ে \"দোকান ভাড়া দিন\" চাপুন।"
                    : "যাঁরা দোকান ছেড়েছেন তাঁদের এখানে দেখা যাবে।"
                  : view === CURRENT
                    ? "কোনো ইউনিটে গিয়ে Add Tenant চাপুন।"
                    : "যাঁরা বাসা ছেড়েছেন তাঁদের এখানে দেখা যাবে।"
              }
              action={view === CURRENT ? <LinkButton href={isMarket ? `/properties/${propertyId}/units` : "/properties"}>{isMarket ? "দোকানগুলো দেখুন" : "Go to Properties"}</LinkButton> : null}
            />
          )
        ) : (
          <>
            <div className={`hidden border-b border-border bg-background px-4 py-2 text-xs font-medium text-muted ${ROW_COLUMNS}`}>
              <span>{isMarket ? "ব্যবসা" : "Tenant"}</span>
              <span>{isMarket ? "দোকান" : "Unit"}</span>
              <span>{isMarket ? "ধরন" : "Type"}</span>
              <span>{isMarket ? "ভাড়া" : "Rent"}</span>
              <span>{isMarket ? "অবস্থা" : "Status"}</span>
              <span />
            </div>
            <ul className="divide-y divide-border">
              {tenancies.map((tenancy) => (isMarket ? <ShopRow key={tenancy._id} tenancy={tenancy} /> : <TenantRow key={tenancy._id} tenancy={tenancy} />))}
            </ul>
          </>
        )}
      </Card>

      <Pagination page={page} totalPages={meta?.totalPages || 1} onChange={setPage} />
    </div>
  );
};

export default TenantsBoard;
