"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, KeyRound, LayoutGrid, Plus, Search, SearchX, Store, WifiOff } from "lucide-react";
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
import { propertyPath } from "@/lib/navigation";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetPropertiesQuery, useGetPropertySummaryQuery } from "@/redux/features/property/propertyApi";

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 12;

// আমার মার্কেট — মার্কেটের জগতের সব মার্কেট
const MarketsPage = () => {
  const router = useRouter();
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

  const { data, error, isLoading, refetch } = useGetPropertiesQuery({ world: "market", page, search, limit: PAGE_SIZE });
  const { data: summaryData, isLoading: isSummaryLoading } = useGetPropertySummaryQuery({ world: "market" });
  const markets = data?.data?.data || [];
  const meta = data?.data?.meta;
  const summary = summaryData?.data;

  const addButton = (
    <Button onClick={() => setIsFormOpen(true)}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      মার্কেট যোগ করুন
    </Button>
  );

  let content;
  if (isLoading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  } else if (error) {
    content = (
      <Card>
        <EmptyState icon={WifiOff} title="Could not load your markets" description={getErrorMessage(error)} action={<Button onClick={refetch}>Try again</Button>} />
      </Card>
    );
  } else if (markets.length === 0) {
    content = (
      <Card>
        {search ? (
          <EmptyState icon={SearchX} title="কিছু পাওয়া যায়নি" description={`"${search}" নামে কোনো মার্কেট নেই।`} />
        ) : (
          <EmptyState icon={Store} title="এখনো কোনো মার্কেট নেই" description="মার্কেট যোগ করুন, তারপর একসাথে সব দোকান তৈরি করুন।" action={addButton} />
        )}
      </Card>
    );
  } else {
    content = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {markets.map((market) => (
            <PropertyCard key={market._id} property={market} />
          ))}
        </div>
        <Pagination page={page} totalPages={meta?.totalPages || 1} onChange={setPage} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="আমার মার্কেট" description="আপনার সব মার্কেট — যেকোনোটায় ঢুকে দোকান, ব্যবসায়ী আর ভাড়ার কাজ" action={addButton} />

      <StatStrip
        isLoading={isSummaryLoading}
        items={[
          { key: "houses", label: "মোট মার্কেট", value: summary?.houses, icon: Store },
          { key: "units", label: "মোট দোকান", value: summary?.units, icon: LayoutGrid, tone: "violet" },
          { key: "occupied", label: "ভাড়া হয়েছে", value: summary?.occupied, hint: summary?.units ? `${Math.round((summary.occupied / summary.units) * 100)}%` : undefined, icon: KeyRound, tone: "blue" },
          { key: "vacant", label: "খালি", value: summary?.vacant, icon: DoorOpen, tone: "amber" },
        ]}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            মার্কেট {meta && <span className="font-normal text-muted tabular-nums">{toBanglaNumber(meta.total)}</span>}
          </h2>
          <Input
            id="marketSearch"
            compact
            type="search"
            aria-label="Search markets"
            placeholder="নাম বা এলাকা লিখে খুঁজুন"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
            className="w-full sm:w-72"
          />
        </div>
        {content}
      </div>

      {isFormOpen && <PropertyFormModal kind="market" onClose={() => setIsFormOpen(false)} onSaved={(saved) => saved?._id && router.push(propertyPath(saved._id, "units"))} />}
    </div>
  );
};

export default MarketsPage;
