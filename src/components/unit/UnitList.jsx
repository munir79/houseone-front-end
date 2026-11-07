"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid, Plus, Search, SearchX, Zap } from "lucide-react";
import QuickAddUnitsModal from "./QuickAddUnitsModal";
import UnitFormModal from "./UnitFormModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/formatMoney";
import { billStatus } from "@/lib/billOptions";
import { OCCUPANT_TYPE_OPTIONS } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { unitActivity } from "@/lib/unitActivity";
import { floorName } from "@/lib/unitOptions";
import { useGetPropertyUnitsQuery } from "@/redux/features/unit/unitApi";

const NEEDS_ACTION = "Needs Action";
const ALL_TYPES = "All Types";

const SORT_OPTIONS = [
  { value: "floor", label: "Sort: Floor" },
  { value: "rent", label: "Sort: Rent" },
  { value: "name", label: "Sort: Name" },
];

const SORTERS = {
  // আসল বিল্ডিংয়ের মতো — উপরের তলা উপরে
  floor: (a, b) => b.floor - a.floor || a.name.localeCompare(b.name),
  rent: (a, b) => (b.rent ?? -1) - (a.rent ?? -1),
  name: (a, b) => a.name.localeCompare(b.name),
};

const ROW_COLUMNS = "xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_180px_20px] xl:gap-4";

// ভাড়াটিয়া থাকলে তাঁর ধরন, খালি হলে যাঁকে ভাড়া দিতে চান
// এই মাসের ভাড়া — বিল না হলে সেটাই বলে
const ThisMonth = ({ unit }) => {
  if (!unit.tenancy) return <span className="text-sm text-muted">—</span>;
  if (!unit.bill) return <span className="text-sm text-muted">বিল হয়নি</span>;

  const { label, variant } = billStatus(unit.bill);
  return <Badge variant={variant}>{label}</Badge>;
};

const tenantTypeLabel = ({ tenancy, preferredTenant, type }) => {
  if (tenancy) return tenancy.occupantType;
  return preferredTenant && preferredTenant !== "Any" ? `${preferredTenant} চাই` : type;
};

// পুরো সারি ইউনিটের Link, শুধু কাজের Badge আলাদা Link — সরাসরি ফর্ম বা ভাড়াটিয়ার পেজে যায়
const UnitRow = ({ propertyId, unit }) => {
  const activity = unitActivity(unit);
  const typeLabel = tenantTypeLabel(unit);
  // ভাড়াটিয়া থাকলে তাঁর আসল ভাড়া, খালি হলে ফ্ল্যাটের ভাড়া
  const rent = unit.tenancy?.rent ?? unit.rent;

  return (
    <li data-unit-row={unit.name} className="relative transition-colors hover:bg-background">
      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${ROW_COLUMNS}`}>
        <span className="min-w-0">
          <Link href={`/properties/${propertyId}/units/${unit._id}`} className="block text-sm font-semibold wrap-break-word after:absolute after:inset-0">
            {unit.name}
          </Link>
          {unit.tenancy && (
            <span className="block text-sm wrap-break-word text-muted">
              {unit.tenancy.tenantName}
              {unit.tenancy.peopleCount > 1 && ` · মোট ${toBanglaNumber(unit.tenancy.peopleCount)} জন`}
            </span>
          )}
          <span className="block text-xs text-muted xl:hidden">
            {floorName(unit.floor)} · {typeLabel} · {formatMoney(rent)}
            {unit.tenancy && ` · Advance ${formatMoney(unit.tenancy.advance)}`}
          </span>
          <span className="hidden text-xs text-muted xl:block">{floorName(unit.floor)}</span>
        </span>
        <span data-unit-type className="hidden text-sm text-muted xl:block">
          {typeLabel}
        </span>
        <span data-unit-rent className="hidden text-sm tabular-nums xl:block">
          {formatMoney(rent)}
        </span>
        <span data-unit-advance className="hidden text-sm tabular-nums xl:block">
          {unit.tenancy ? formatMoney(unit.tenancy.advance) : "—"}
        </span>
        <span data-unit-month className="hidden xl:block">
          <ThisMonth unit={unit} />
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 xl:flex-row xl:flex-wrap xl:items-center xl:justify-start">
          <Badge variant={unit.status === "Vacant" ? "warning" : "success"}>{unit.status}</Badge>
          {unit.tenancy && (
            <span className="xl:hidden">
              <ThisMonth unit={unit} />
            </span>
          )}
          {activity && (
            <Link href={activity.href} data-activity className="relative z-10 rounded-full focus-visible:outline-2 focus-visible:outline-primary">
              <Badge variant={activity.variant}>{activity.label}</Badge>
            </Link>
          )}
        </span>
        <ChevronRight className="hidden h-4 w-4 text-muted xl:block" aria-hidden="true" />
      </div>
    </li>
  );
};

const UnitList = ({ property }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [occupantType, setOccupantType] = useState(ALL_TYPES);
  const [sort, setSort] = useState("floor");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetPropertyUnitsQuery(property._id);

  const units = useMemo(() => data?.data || [], [data]);
  const actionCount = useMemo(() => units.filter((unit) => unitActivity(unit)?.needsAction).length, [units]);
  const actionLabel = actionCount > 0 ? `${NEEDS_ACTION} (${actionCount})` : NEEDS_ACTION;

  // গণনাও এখানেই, ফিল্টারও — শূন্য ধরন দেখানো হয় না
  const typeOptions = useMemo(() => {
    const counts = units.reduce((all, { tenancy }) => (tenancy ? { ...all, [tenancy.occupantType]: (all[tenancy.occupantType] || 0) + 1 } : all), {});
    return OCCUPANT_TYPE_OPTIONS.filter(({ value }) => counts[value]).map(({ value }) => ({ value, label: `${value} ${counts[value]}` }));
  }, [units]);
  const activeType = typeOptions.find(({ value }) => value === occupantType);

  const shownUnits = useMemo(() => {
    const text = search.trim().toLowerCase();
    return units
      .filter((unit) => !activeType || unit.tenancy?.occupantType === activeType.value)
      .filter((unit) => (filter === NEEDS_ACTION ? unitActivity(unit)?.needsAction : filter === "All" || unit.status === filter))
      .filter((unit) => !text || unit.name.toLowerCase().includes(text))
      .sort(SORTERS[sort]);
  }, [units, activeType, filter, search, sort]);

  const quickAddButton = (
    <Button size="sm" onClick={() => setIsQuickOpen(true)}>
      <Zap className="h-4 w-4" aria-hidden="true" />
      Quick Add
    </Button>
  );

  return (
    <Card flush className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            label="Filter units"
            options={["All", "Vacant", "Occupied", actionLabel]}
            value={filter === NEEDS_ACTION ? actionLabel : filter}
            onChange={(next) => setFilter(next === actionLabel ? NEEDS_ACTION : next)}
          />
          <div className="flex flex-wrap gap-2">
            {units.length > 0 && quickAddButton}
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Unit
            </Button>
          </div>
        </div>

        {typeOptions.length > 0 && (
          <div>
            <SegmentedControl
              label="Filter by tenant type"
              options={[ALL_TYPES, ...typeOptions.map(({ label }) => label)]}
              value={activeType?.label ?? ALL_TYPES}
              onChange={(next) => setOccupantType(typeOptions.find(({ label }) => label === next)?.value ?? ALL_TYPES)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="unitSearch"
            compact
            type="search"
            aria-label="Search units"
            placeholder="ইউনিটের নাম খুঁজুন"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
            className="w-full sm:w-64"
          />
          <Select
            id="unitSort"
            compact
            aria-label="Sort units"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : units.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No units yet"
          description="Quick Add দিয়ে একবারে সব ফ্ল্যাট তৈরি করুন, পরে যেকোনোটি বদলাতে পারবেন।"
          action={quickAddButton}
        />
      ) : shownUnits.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={filter === NEEDS_ACTION ? "All caught up" : "No unit found"}
          description={filter === NEEDS_ACTION ? "এই বাড়িতে এখন আপনার কোনো কাজ বাকি নেই।" : "এই ফিল্টারে কোনো ইউনিট নেই।"}
        />
      ) : (
        <>
          <div className={`hidden border-b border-border bg-background px-4 py-2 text-xs font-medium text-muted ${ROW_COLUMNS}`}>
            <span>Unit</span>
            <span>Type</span>
            <span>Rent</span>
            <span>Advance</span>
            <span>This Month</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {shownUnits.map((unit) => (
              <UnitRow key={unit._id} propertyId={property._id} unit={unit} />
            ))}
          </ul>
        </>
      )}

      {isAddOpen && (
        <UnitFormModal propertyId={property._id} totalFloors={property.totalFloors} onClose={() => setIsAddOpen(false)} />
      )}

      {isQuickOpen && (
        <QuickAddUnitsModal propertyId={property._id} totalFloors={property.totalFloors} onClose={() => setIsQuickOpen(false)} />
      )}
    </Card>
  );
};

export default UnitList;
