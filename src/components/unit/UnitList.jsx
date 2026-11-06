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
import { floorName } from "@/lib/unitOptions";
import { useGetPropertyUnitsQuery } from "@/redux/features/unit/unitApi";

const FILTERS = ["All", "Vacant", "Occupied"];

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

const ROW_COLUMNS = "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_96px_20px] md:gap-4";

const UnitRow = ({ propertyId, unit }) => (
  <li>
    <Link
      href={`/properties/${propertyId}/units/${unit._id}`}
      className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background md:items-center ${ROW_COLUMNS}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium wrap-break-word">{unit.name}</span>
        <span className="block text-xs text-muted md:hidden">
          {floorName(unit.floor)} · {unit.type} · {formatMoney(unit.rent)}
        </span>
      </span>
      <span className="hidden text-sm text-muted md:block">{floorName(unit.floor)}</span>
      <span className="hidden text-sm text-muted md:block">{unit.type}</span>
      <span className="hidden text-sm tabular-nums md:block">{formatMoney(unit.rent)}</span>
      <span className="shrink-0">
        <Badge variant={unit.status === "Vacant" ? "warning" : "success"}>{unit.status}</Badge>
      </span>
      <ChevronRight className="hidden h-4 w-4 text-muted md:block" aria-hidden="true" />
    </Link>
  </li>
);

const UnitList = ({ property }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("floor");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetPropertyUnitsQuery(property._id);

  const units = useMemo(() => data?.data || [], [data]);
  const shownUnits = useMemo(() => {
    const text = search.trim().toLowerCase();
    return units
      .filter((unit) => filter === "All" || unit.status === filter)
      .filter((unit) => !text || unit.name.toLowerCase().includes(text))
      .sort(SORTERS[sort]);
  }, [units, filter, search, sort]);

  const quickAddButton = (
    <Button size="sm" onClick={() => setIsQuickOpen(true)}>
      <Zap className="h-4 w-4" aria-hidden="true" />
      Quick Add
    </Button>
  );

  return (
    <Card flush className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl label="Filter units" options={FILTERS} value={filter} onChange={setFilter} />
          <Input
            id="unitSearch"
            compact
            type="search"
            aria-label="Search units"
            placeholder="ইউনিটের নাম খুঁজুন"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
            className="w-full sm:w-52"
          />
          <Select
            id="unitSort"
            compact
            aria-label="Sort units"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full sm:w-36"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {units.length > 0 && quickAddButton}
          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Unit
          </Button>
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
        <EmptyState icon={SearchX} title="No unit found" description="এই ফিল্টারে কোনো ইউনিট নেই।" />
      ) : (
        <>
          <div className={`hidden border-b border-border bg-background px-4 py-2 text-xs font-medium text-muted ${ROW_COLUMNS}`}>
            <span>Unit</span>
            <span>Floor</span>
            <span>Type</span>
            <span>Rent</span>
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
