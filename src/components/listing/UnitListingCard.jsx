"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import ListingActions from "./ListingActions";
import ListingFormModal from "./ListingFormModal";
import { ListingCounts } from "./ListingStats";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { LISTING_STATUS, daysLeft } from "@/lib/listingOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetUnitListingQuery } from "@/redux/features/listing/listingApi";

// ফ্ল্যাটের পাতায় To-Let — খালি বা নোটিশ দেওয়া ফ্ল্যাটে
const UnitListingCard = ({ unit }) => {
  const [isPosting, setIsPosting] = useState(false);
  const { data, isLoading } = useGetUnitListingQuery(unit._id);
  const listing = data?.data;

  if (isLoading) return null;

  return (
    <div data-unit-listing className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        </span>
        {listing ? (
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              To-Let বিজ্ঞাপন
              <Badge variant={LISTING_STATUS[listing.status].variant}>{LISTING_STATUS[listing.status].label}</Badge>
              {listing.status === "Active" && <span className="text-xs font-normal text-muted">আর {toBanglaNumber(daysLeft(listing.expiresAt))} দিন</span>}
            </p>
            <ListingCounts counts={listing.counts} className="mt-1" />
          </div>
        ) : (
          <p className="text-sm">
            <span className="block font-semibold">To-Let দিন, বিনামূল্যে</span>
            <span className="text-muted">ভাড়াটিয়া খুঁজে সরাসরি কল বা WhatsApp করবেন। ভাড়া হলে বিজ্ঞাপন নিজে বন্ধ হয়।</span>
          </p>
        )}
      </div>

      {listing ? (
        <div className="shrink-0 self-end sm:self-auto">
          <ListingActions listing={listing} unitId={unit._id} alwaysMenu />
        </div>
      ) : (
        <Button size="sm" onClick={() => setIsPosting(true)} className="shrink-0">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          To-Let দিন
        </Button>
      )}

      {isPosting && <ListingFormModal unitId={unit._id} onClose={() => setIsPosting(false)} />}
    </div>
  );
};

export default UnitListingCard;
