"use client";

import { useEffect, useState } from "react";
import { Building2, DoorOpen, KeyRound, LayoutGrid, Plus, Search, SearchX, WifiOff } from "lucide-react";
import AddAssetModal from "./AddAssetModal";
import PropertyCard from "./PropertyCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { ALL_PROPERTIES } from "@/hooks/useWorkspace";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { isSharedProperty } from "@/lib/navigation";
import { useGetPropertiesQuery, useGetPropertySummaryQuery } from "@/redux/features/property/propertyApi";

const SEARCH_DEBOUNCE_MS = 350;

// আমার সম্পদ (own), অংশীদারি সম্পদ (shared), আমাকে দেওয়া সম্পদ (granted) — একই চেহারা, একই কাজ
// canAdd — দেওয়া সম্পদের পাতায় নতুন যোগ করার কিছু নেই
// top — তালিকার উপরে বাড়তি অংশ (যেমন দাওয়াত); cardNote — প্রতিটা কার্ডে বাড়তি লাইন
const AssetListPage = ({ scope, title, description, emptyTitle, emptyText, top, cardNote, canAdd = true }) => {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const isSharedPage = scope === "shared";

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, error, isLoading, refetch } = useGetPropertiesQuery({ page, search, scope });
  // সংখ্যাগুলো শুধু এই পাতার সম্পদের — সব সম্পদের তালিকা (sidebar এর query, আগেই আনা) থেকে কোনগুলো
  const { data: allData } = useGetPropertiesQuery(ALL_PROPERTIES);
  const { data: summaryData, isLoading: isSummaryLoading } = useGetPropertySummaryQuery();

  const properties = data?.data?.data || [];
  const meta = data?.data?.meta;
  const scopeOf = (house) => (house.myAccess ? "granted" : isSharedProperty(house) ? "shared" : "own");
  const inScope = new Set((allData?.data?.data || []).filter((house) => scopeOf(house) === scope).map(({ _id }) => _id));
  const rows = (summaryData?.data?.byHouse || []).filter(({ _id }) => inScope.has(_id));
  const sum = (field) => rows.reduce((total, row) => total + row[field], 0);
  const units = sum("units");
  const occupied = sum("occupied");
  const occupancy = units ? Math.round((occupied / units) * 100) : 0;

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
        <EmptyState
          icon={WifiOff}
          title="Could not load your houses"
          description={getErrorMessage(error)}
          action={<Button onClick={refetch}>Try again</Button>}
        />
      </Card>
    );
  } else if (properties.length === 0) {
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
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} note={cardNote?.(property)} />
          ))}
        </div>
        <Pagination page={page} totalPages={meta?.totalPages || 1} onChange={setPage} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} description={description} action={addButton} />
      {top}

      <StatStrip
        isLoading={isSummaryLoading || !allData}
        items={[
          { key: "houses", label: "Total Houses", value: inScope.size, icon: Building2 },
          { key: "units", label: "Total Units", value: units, icon: LayoutGrid, tone: "violet" },
          { key: "occupied", label: "Occupied", value: occupied, hint: `${occupancy}%`, icon: KeyRound, tone: "blue" },
          { key: "vacant", label: "Vacant", value: sum("vacant"), icon: DoorOpen, tone: "amber" },
        ]}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            All houses {meta && <span className="font-normal text-muted tabular-nums">{meta.total}</span>}
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

        {content}
      </div>

      {isFormOpen && <AddAssetModal shared={isSharedPage} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default AssetListPage;
