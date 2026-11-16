"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DoorOpen, ExternalLink, Eye, FileText, Megaphone, PhoneCall, Plus, Send, Share2 } from "lucide-react";
import ListingActions from "@/components/listing/ListingActions";
import ListingFormModal from "@/components/listing/ListingFormModal";
import { ListingCounts, WeekBars } from "@/components/listing/ListingStats";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { formatMoney } from "@/lib/formatMoney";
import { CLOSED_REASONS, LISTING_STATUS, availableText, banglaDate, daysLeft, listingTitle } from "@/lib/listingOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetMyListingsQuery } from "@/redux/features/listing/listingApi";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";
import { useGetPropertyUnitsQuery } from "@/redux/features/unit/unitApi";

// খালি বা নোটিশ দেওয়া ফ্ল্যাট বেছে নতুন বিজ্ঞাপন
const PickUnitModal = ({ listedUnits, onPick, onClose }) => {
  const { data: housesData, isLoading } = useGetPropertiesQuery({ page: 1, search: "", limit: 100 });
  const houses = housesData?.data?.data || [];
  const [propertyId, setPropertyId] = useState("");
  const houseId = propertyId || houses[0]?._id || "";
  const { data: unitsData, isFetching } = useGetPropertyUnitsQuery(houseId, { skip: !houseId });

  const units = (unitsData?.data || []).filter((unit) => (unit.status === "Vacant" || unit.availableFrom) && !listedUnits.has(unit._id));

  return (
    <Modal title="New To-Let" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-11 w-full" />
        ) : houses.length === 0 ? (
          <p className="text-sm text-muted">আগে বাড়ি ও ফ্ল্যাট যোগ করুন।</p>
        ) : (
          <>
            <Select id="listingHouse" label="কোন বাড়ি" options={houses.map(({ _id, name }) => ({ value: _id, label: name }))} value={houseId} onChange={(e) => setPropertyId(e.target.value)} />
            {isFetching ? (
              <Skeleton className="h-24 w-full" />
            ) : units.length === 0 ? (
              <p className="rounded-xl bg-background px-3 py-3 text-sm text-muted">এই বাড়িতে বিজ্ঞাপন দেওয়ার মতো ফ্ল্যাট নেই। খালি বা নোটিশ দেওয়া ফ্ল্যাট এখানে আসে।</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {units.map((unit) => (
                  <li key={unit._id}>
                    <button type="button" data-pick-unit={unit.name} onClick={() => onPick(unit._id)} className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-background">
                      <DoorOpen className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{unit.name}</span>
                        <span className="block text-xs text-muted">
                          {unit.rent ? formatMoney(unit.rent) : "ভাড়া লেখা নেই"} · {unit.status === "Vacant" ? "খালি" : availableText(unit.availableFrom)}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

const ListingRow = ({ listing }) => {
  const unitId = listing.unit?._id;
  const propertyId = listing.property?._id;
  const left = daysLeft(listing.expiresAt);
  const cover = listing.photos?.[0]?.url;

  return (
    <li data-my-listing={listing.unit?.name} className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <Link href={`/properties/${propertyId}/units/${unitId}`} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-primary-soft sm:h-20 sm:w-28">
          {cover ? (
            <Image loader={cloudinaryLoader} src={cover} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <Megaphone className="absolute inset-0 m-auto h-6 w-6 text-primary" aria-hidden="true" />
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="wrap-break-word">{listingTitle(listing)}</span>
            <Badge variant={LISTING_STATUS[listing.status].variant}>{LISTING_STATUS[listing.status].label}</Badge>
            {listing.hasForm && <Badge variant="info">কথা চলছে</Badge>}
          </p>
          <p className="text-xs text-muted">
            {listing.unit?.name}, {listing.property?.name} · {formatMoney(listing.rent)} · {availableText(listing.availableFrom)}
          </p>
          <p className={listing.status === "Expired" || left <= 3 ? "text-xs font-semibold text-danger" : "text-xs text-muted"}>
            {listing.status === "Expired" ? "মেয়াদ শেষ, আবার চালু করুন" : `আর ${toBanglaNumber(left)} দিন · ${banglaDate(listing.expiresAt)} পর্যন্ত`}
          </p>
          <ListingCounts counts={listing.counts} />
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 xl:flex-nowrap xl:justify-end">
        <WeekBars daily={listing.daily} />
        <div className="flex items-center gap-2">
          {listing.hasForm ? (
            <LinkButton href={`/properties/${propertyId}/units/${unitId}`} variant="outline" size="sm">
              <FileText className="h-4 w-4" aria-hidden="true" />
              ফর্ম দেখুন
            </LinkButton>
          ) : (
            <LinkButton href={`/properties/${propertyId}/units/${unitId}?sendForm=1`} variant="outline" size="sm" aria-label={`Tenant found, send form for ${listing.unit?.name}`}>
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="sm:hidden">ফর্ম পাঠান</span>
              <span className="hidden sm:inline">ভাড়াটিয়া পেয়েছি, ফর্ম পাঠান</span>
            </LinkButton>
          )}
          <ListingActions listing={listing} unitId={unitId} alwaysMenu />
        </div>
      </div>
    </li>
  );
};

// বাড়িওয়ালার To-Let — নিজের বিজ্ঞাপন, কতজন দেখেছেন, আর ভাড়াটিয়া পেলে ফর্ম
const ListingsPage = () => {
  const [isPicking, setIsPicking] = useState(false);
  const [postingUnit, setPostingUnit] = useState(null);
  const { data, isLoading } = useGetMyListingsQuery();

  const listings = data?.data || [];
  const open = listings.filter(({ isOpen }) => isOpen);
  const closed = listings.filter(({ isOpen }) => !isOpen);
  const sum = (field) => open.reduce((total, listing) => total + (listing.counts?.[field] ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="To-Let Marketplace"
        description="খালি ফ্ল্যাটের বিনামূল্যে বিজ্ঞাপন — ভাড়াটিয়া সরাসরি কল বা WhatsApp করেন"
        action={
          <div className="flex gap-2">
            <LinkButton href="/to-let" target="_blank" rel="noopener" variant="outline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">To-Let পাতা</span>
            </LinkButton>
            <Button onClick={() => setIsPicking(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              নতুন বিজ্ঞাপন
            </Button>
          </div>
        }
      />

      <StatStrip
        isLoading={isLoading}
        items={[
          { key: "open", label: "চালু বিজ্ঞাপন", value: toBanglaNumber(open.filter(({ status }) => status === "Active").length), icon: Megaphone },
          { key: "views", label: "দেখেছেন", value: toBanglaNumber(sum("views")), icon: Eye, tone: "blue" },
          { key: "shares", label: "শেয়ার", value: toBanglaNumber(sum("shares")), icon: Share2, tone: "violet" },
          { key: "contacts", label: "যোগাযোগ", value: toBanglaNumber(sum("contacts")), icon: PhoneCall, tone: "amber" },
        ]}
      />

      <Card flush className="overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-base font-bold">আমার বিজ্ঞাপন</h2>
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-20 w-full" />
          </div>
        ) : open.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No listings yet"
            description="খালি ফ্ল্যাট বা যে ফ্ল্যাটের ভাড়াটিয়া নোটিশ দিয়েছেন, সেটার বিজ্ঞাপন দিন। ভাড়া হলে নিজে বন্ধ হয়।"
            action={
              <Button onClick={() => setIsPicking(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                নতুন বিজ্ঞাপন
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {open.map((listing) => (
              <ListingRow key={listing._id} listing={listing} />
            ))}
          </ul>
        )}
      </Card>

      {closed.length > 0 && (
        <Card flush className="overflow-hidden">
          <h2 className="border-b border-border px-4 py-3 text-sm font-bold">গত ৩০ দিনে বন্ধ হয়েছে</h2>
          <ul className="divide-y divide-border">
            {closed.map((listing) => (
              <li key={listing._id} data-closed-listing className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  <span className="font-semibold">{listing.unit?.name}</span>, {listing.property?.name} · {CLOSED_REASONS[listing.closedReason] ?? "বন্ধ"}
                </span>
                <ListingCounts counts={listing.counts} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isPicking && (
        <PickUnitModal
          listedUnits={new Set(open.map(({ unit }) => unit?._id))}
          onClose={() => setIsPicking(false)}
          onPick={(unitId) => {
            setIsPicking(false);
            setPostingUnit(unitId);
          }}
        />
      )}
      {postingUnit && <ListingFormModal unitId={postingUnit} onClose={() => setPostingUnit(null)} />}
    </div>
  );
};

export default ListingsPage;
