"use client";

import { useEffect, useState } from "react";
import { Building2, DoorOpen, KeyRound, LayoutGrid, Plus, Search, SearchX, WifiOff } from "lucide-react";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyFormModal from "@/components/property/PropertyFormModal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useGetPropertiesQuery, useGetPropertySummaryQuery } from "@/redux/features/property/propertyApi";

const SEARCH_DEBOUNCE_MS = 350;

const PropertiesPage = () => {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data, error, isLoading, refetch } = useGetPropertiesQuery({ page, search });
  const { data: summaryData, isLoading: isSummaryLoading } = useGetPropertySummaryQuery();

  const properties = data?.data?.data || [];
  const meta = data?.data?.meta;
  const summary = summaryData?.data;
  const occupancy = summary?.units ? Math.round((summary.occupied / summary.units) * 100) : 0;

  const addButton = (
    <Button onClick={() => setIsFormOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add House
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
          <EmptyState
            icon={Building2}
            title="No houses yet"
            description="প্রথম বাড়িটি যোগ করুন। তারপর এক ক্লিকে সব ফ্ল্যাট তৈরি করতে পারবেন।"
            action={addButton}
          />
        )}
      </Card>
    );
  } else {
    content = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
        <Pagination page={page} totalPages={meta?.totalPages || 1} onChange={setPage} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Properties" description="আপনার সব বাড়ি এক জায়গায়" action={addButton} />

      <StatStrip
        isLoading={isSummaryLoading}
        items={[
          { key: "houses", label: "Total Houses", value: summary?.houses, icon: Building2 },
          { key: "units", label: "Total Units", value: summary?.units, icon: LayoutGrid, tone: "violet" },
          { key: "occupied", label: "Occupied", value: summary?.occupied, hint: `${occupancy}%`, icon: KeyRound, tone: "blue" },
          { key: "vacant", label: "Vacant", value: summary?.vacant, icon: DoorOpen, tone: "amber" },
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

      {isFormOpen && <PropertyFormModal onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default PropertiesPage;
