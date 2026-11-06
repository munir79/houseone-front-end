"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, FileText, Search, SearchX, Users, WifiOff } from "lucide-react";
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
import { OCCUPANT_TYPE_OPTIONS, formatDate } from "@/lib/tenancyOptions";
import { FORM_STATUS } from "@/lib/tenantFormOptions";
import { useGetTenanciesQuery, useGetTenancySummaryQuery } from "@/redux/features/tenancy/tenancyApi";
import { useGetOpenFormsQuery } from "@/redux/features/tenantForm/tenantFormApi";

const SEARCH_DEBOUNCE_MS = 350;
const CURRENT = "Current";
const FORMER = "Former";

const TYPE_FILTERS = [{ value: "", label: "All types" }, ...OCCUPANT_TYPE_OPTIONS];

const ROW_COLUMNS = "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_20px] md:gap-4";

const TenantRow = ({ tenancy }) => (
  <li>
    <Link href={`/tenants/${tenancy._id}`} className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background ${ROW_COLUMNS}`}>
      <span className="min-w-0">
        <span className="block text-sm font-medium wrap-break-word">{tenancy.tenantName}</span>
        <span className="block text-xs text-muted">{tenancy.tenantPhone}</span>
        <span className="block text-xs text-muted md:hidden">
          {tenancy.unitName}, {tenancy.propertyName}
        </span>
      </span>
      <span className="hidden min-w-0 md:block">
        <span className="block truncate text-sm">{tenancy.unitName}</span>
        <span className="block truncate text-xs text-muted">{tenancy.propertyName}</span>
      </span>
      <span className="hidden text-sm text-muted md:block">{tenancy.occupantType}</span>
      <span className="hidden text-sm tabular-nums md:block">{formatMoney(tenancy.rent)}</span>
      <span className="shrink-0">
        {tenancy.notice ? (
          <Badge variant="warning">Leaving</Badge>
        ) : tenancy.status === "Ended" ? (
          <Badge>Former</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )}
      </span>
      <ChevronRight className="hidden h-4 w-4 text-muted md:block" aria-hidden="true" />
    </Link>
  </li>
);

const TenantsPage = () => {
  const [view, setView] = useState(CURRENT);
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
    status: view === CURRENT ? "Active" : "Ended",
  });
  const { data: summaryData, isLoading: isSummaryLoading } = useGetTenancySummaryQuery();
  const { data: formsData } = useGetOpenFormsQuery();

  const tenancies = data?.data?.data || [];
  const meta = data?.data?.meta;
  const summary = summaryData?.data;
  const leavingSoon = summary?.leavingSoon || [];
  const openForms = formsData?.data || [];
  const isFiltered = Boolean(search || occupantType);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Tenants" description="আপনার সব ভাড়াটিয়া এক জায়গায়" action={<LinkButton href="/properties">Add from a Unit</LinkButton>} />

      <StatStrip
        isLoading={isSummaryLoading}
        items={[
          { key: "active", label: "Tenants", value: summary?.active },
          { key: "people", label: "Total People", value: summary?.people },
          { key: "family", label: "Family", value: summary?.family },
          { key: "bachelor", label: "Bachelor", value: summary?.bachelor },
          { key: "sublet", label: "Sublet", value: summary?.sublet },
          { key: "office", label: "Office", value: summary?.office },
        ]}
      />

      {openForms.length > 0 && (
        <Card flush className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <FileText className="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Tenant forms</h2>
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
          <SegmentedControl
            label="Tenant list"
            options={[CURRENT, FORMER]}
            value={view}
            onChange={(next) => {
              setView(next);
              setPage(1);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="tenancySearch"
              compact
              type="search"
              aria-label="Search tenants"
              placeholder="নাম, মোবাইল বা ফ্ল্যাট খুঁজুন"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
              className="w-full sm:w-64"
            />
            <Select
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
            />
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
            <EmptyState icon={SearchX} title="No tenant found" description="এই খোঁজায় কোনো ভাড়াটিয়া পাওয়া যায়নি।" />
          ) : (
            <EmptyState
              icon={Users}
              title={view === CURRENT ? "No tenants yet" : "No former tenants"}
              description={view === CURRENT ? "কোনো ইউনিটে গিয়ে Add Tenant চাপুন।" : "যাঁরা বাসা ছেড়েছেন তাঁদের এখানে দেখা যাবে।"}
              action={view === CURRENT ? <LinkButton href="/properties">Go to Properties</LinkButton> : null}
            />
          )
        ) : (
          <>
            <div className={`hidden border-b border-border bg-background px-4 py-2 text-xs font-medium text-muted ${ROW_COLUMNS}`}>
              <span>Tenant</span>
              <span>Unit</span>
              <span>Type</span>
              <span>Rent</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="divide-y divide-border">
              {tenancies.map((tenancy) => (
                <TenantRow key={tenancy._id} tenancy={tenancy} />
              ))}
            </ul>
          </>
        )}
      </Card>

      <Pagination page={page} totalPages={meta?.totalPages || 1} onChange={setPage} />
    </div>
  );
};

export default TenantsPage;
