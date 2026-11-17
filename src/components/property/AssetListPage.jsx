"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, DoorOpen, KeyRound, LayoutGrid, Plus, Search, SearchX, WifiOff } from "lucide-react";
import AddAssetModal from "./AddAssetModal";
import PropertyCard from "./PropertyCard";
import UnitAssetCard from "./UnitAssetCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import Tabs from "@/components/ui/Tabs";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetMyAssetsQuery } from "@/redux/features/property/propertyApi";

const SEARCH_DEBOUNCE_MS = 350;
const TABS = [
  { value: "houses", label: "বাড়ি", unit: "বাড়ি" },
  { value: "flats", label: "ফ্ল্যাট", unit: "ফ্ল্যাট" },
  { value: "others", label: "অন্যান্য", unit: "দোকান/অফিস" },
];

// আমার সম্পদ (own), অংশীদারি সম্পদ (shared), আমাকে দেওয়া সম্পদ (granted) — একই চেহারা, একই কাজ
// Tab — বাড়ি, ফ্ল্যাট, অন্যান্য; কিছু না থাকা Tab দেখায় না; কোন Tab খোলা তা URL এ (?tab=)
// top — তালিকার উপরে বাড়তি অংশ (যেমন দাওয়াত); cardNote — প্রতিটা কার্ডে বাড়তি লাইন
// canAdd — দেওয়া সম্পদের পাতায় নতুন যোগ করার কিছু নেই
const AssetListPage = ({ scope, title, description, emptyTitle, emptyText, top, cardNote, canAdd = true }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const requestedTab = searchParams.get("tab") || undefined;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, error, isLoading, isFetching, refetch } = useGetMyAssetsQuery({ scope, tab: requestedTab, page, search });
  const result = data?.data;
  const tab = result?.tab ?? requestedTab ?? "houses";
  const counts = result?.counts ?? {};
  const stats = result?.stats;
  const rows = result?.data || [];
  const visibleTabs = TABS.filter(({ value }) => counts[value] > 0);
  const tabInfo = TABS.find(({ value }) => value === tab) ?? TABS[0];
  const hasAny = visibleTabs.length > 0;

  const changeTab = (value) => {
    setPage(1);
    setSearchText("");
    setSearch("");
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
  };

  const addButton = canAdd && (
    <Button onClick={() => setIsFormOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      যোগ করুন
    </Button>
  );

  let content;
  if (isLoading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  } else if (error) {
    content = (
      <Card>
        <EmptyState icon={WifiOff} title="Could not load your houses" description={getErrorMessage(error)} action={<Button onClick={refetch}>Try again</Button>} />
      </Card>
    );
  } else if (rows.length === 0) {
    content = (
      <Card>
        {search ? (
          <EmptyState icon={SearchX} title="No house found" description={`"${search}" নামে কিছু পাওয়া যায়নি।`} />
        ) : (
          <EmptyState icon={Building2} title={emptyTitle} description={emptyText} action={addButton} />
        )}
      </Card>
    );
  } else {
    content = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) =>
            tab === "houses" ? <PropertyCard key={row._id} property={row} note={cardNote?.(row)} /> : <UnitAssetCard key={row._id} asset={row} note={cardNote?.({ ...row.building, myAccess: row.myAccess })} />
          )}
        </div>
        <Pagination page={page} totalPages={result?.meta?.totalPages || 1} onChange={setPage} />
      </>
    );
  }

  const statItems =
    tab === "houses"
      ? [
          { key: "houses", label: "Total Houses", value: stats?.total, icon: Building2 },
          { key: "units", label: "Total Units", value: stats?.units, icon: LayoutGrid, tone: "violet" },
          { key: "occupied", label: "Occupied", value: stats?.occupied, hint: stats?.units ? `${Math.round((stats.occupied / stats.units) * 100)}%` : undefined, icon: KeyRound, tone: "blue" },
          { key: "vacant", label: "Vacant", value: stats?.vacant, icon: DoorOpen, tone: "amber" },
        ]
      : [
          { key: "units", label: `মোট ${tabInfo.unit}`, value: stats?.total, icon: LayoutGrid, tone: "violet" },
          { key: "occupied", label: "ভাড়া হয়েছে", value: stats?.occupied, icon: KeyRound, tone: "blue" },
          { key: "vacant", label: "খালি", value: stats?.vacant, icon: DoorOpen, tone: "amber" },
        ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} description={description} action={addButton} />
      {top}

      {visibleTabs.length > 1 && (
        <div data-asset-tabs>
          <Tabs label="Asset types" tabs={visibleTabs.map(({ value, label }) => ({ value, label, count: toBanglaNumber(counts[value]) }))} active={tab} onChange={changeTab} />
        </div>
      )}

      {(isLoading || hasAny) && <StatStrip isLoading={isLoading || (isFetching && !stats)} items={statItems} />}

      <div className="flex flex-col gap-4">
        {hasAny && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              {tabInfo.label} {result?.meta && <span className="font-normal text-muted tabular-nums">{toBanglaNumber(result.meta.total)}</span>}
            </h2>
            <Input
              id="propertySearch"
              compact
              type="search"
              aria-label="Search houses"
              placeholder="নাম বা এলাকা লিখে খুঁজুন"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
              className="w-full sm:w-72"
            />
          </div>
        )}

        {content}
      </div>

      {isFormOpen && <AddAssetModal shared={scope === "shared"} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default AssetListPage;
