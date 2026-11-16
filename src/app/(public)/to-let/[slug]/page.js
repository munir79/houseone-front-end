import { cache } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, CalendarDays, Eye, Layers, MapPin, PhoneCall, Ruler, Sofa, Users, Wind } from "lucide-react";
import { ContactPanel, ListingGallery, ReportButton, ShareButton, ViewTracker } from "@/components/toLet/ListingDetailParts";
import ListingCard from "@/components/toLet/ListingCard";
import LinkButton from "@/components/ui/LinkButton";
import { formatMoney } from "@/lib/formatMoney";
import { availableText, croppedPhoto, floorText, forWhom, listingShareText, listingTitle, placeText } from "@/lib/listingOptions";
import { fetchListing, fetchListings } from "@/lib/publicListing";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { LIVING_LAYOUT_OPTIONS } from "@/lib/unitOptions";

const MAP_SPAN = 0.008;
const SIMILAR_COUNT = 4;

// link এর শেষ ৬ অক্ষর — বাকিটা পড়ার জন্য
const codeOf = (slug) => (typeof slug === "string" ? slug.split("-").pop() : "");

// Metadata ও পাতা একই অনুরোধে — একবারই আনা হয়
const getListing = cache(async (slug) => fetchListing(codeOf(slug)).catch(() => null));

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "To-Let" };

  const title = listingShareText(listing);
  if (!listing.isLive) return { title, robots: { index: false } };
  const description = [listing.description, `${availableText(listing.availableFrom)} · বাড়িওয়ালার সাথে সরাসরি কল বা WhatsApp`].filter(Boolean).join(" · ").slice(0, 200);
  const cover = listing.photos?.[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/to-let/${listing.slug}` },
    openGraph: { title, description, type: "website", url: `/to-let/${listing.slug}`, ...(cover ? { images: [{ url: croppedPhoto(cover, 1200, 630), width: 1200, height: 630 }] } : {}) },
    twitter: { card: cover ? "summary_large_image" : "summary", title, description },
  };
}

// আনুমানিক এলাকা — বাড়ির ঠিক বিন্দু নয়; ম্যাপ নিচে গেলে তবেই load
const AreaMap = ({ point }) => {
  const [lng, lat] = point.coordinates;
  const bbox = [lng - MAP_SPAN, lat - MAP_SPAN * 0.7, lng + MAP_SPAN, lat + MAP_SPAN * 0.7].map((value) => value.toFixed(5)).join(",");
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold">আনুমানিক এলাকা</h2>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-primary-soft sm:aspect-[21/9]">
        <iframe title="আনুমানিক এলাকা" src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`} loading="lazy" className="absolute inset-0 h-full w-full border-0" referrerPolicy="no-referrer" />
        <span className="pointer-events-none absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/15" aria-hidden="true" />
      </div>
      <p className="text-xs text-muted">ঠিক ঠিকানা বাড়িওয়ালা ফোনে জানাবেন।</p>
    </section>
  );
};

const Closed = ({ listing }) => {
  const query = new URLSearchParams({ area: listing.area, ...(listing.categories?.[0] ? { category: listing.categories[0] } : {}) }).toString();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
      <h1 className="text-xl font-bold">এই বিজ্ঞাপনটি আর চালু নেই</h1>
      <p className="text-sm text-muted">
        হয়তো ভাড়া হয়ে গেছে। {listing.area}-এ এরকম আরও বাসা দেখুন।
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton href={`/to-let?${query}`}>{listing.area}-এ আরও দেখুন</LinkButton>
        <LinkButton href="/to-let" variant="outline">
          সব বিজ্ঞাপন
        </LinkButton>
      </div>
    </div>
  );
};

export default async function ListingPage({ params }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();
  // এলাকা বা রুম বদলালে link ও বদলায় — পুরোনো link নতুনটায় যায়
  if (listing.slug !== slug) permanentRedirect(`/to-let/${listing.slug}`);
  if (!listing.isLive) return <Closed listing={listing} />;

  const title = listingTitle(listing);
  const similar = await fetchListings(new URLSearchParams({ area: listing.area, ...(listing.categories?.[0] ? { category: listing.categories[0] } : {}) }).toString())
    .then(({ data }) => data.filter(({ code }) => code !== listing.code).slice(0, SIMILAR_COUNT))
    .catch(() => []);
  const layout = LIVING_LAYOUT_OPTIONS.find(({ value }) => value === listing.livingLayout && value);
  const facts = [
    listing.bedrooms != null && { icon: BedDouble, label: "রুম", value: toBanglaNumber(listing.bedrooms) },
    listing.bathrooms != null && { icon: Bath, label: "বাথরুম", value: toBanglaNumber(listing.bathrooms) },
    listing.balconies != null && { icon: Wind, label: "বারান্দা", value: toBanglaNumber(listing.balconies) },
    listing.sizeSqft && { icon: Ruler, label: "মাপ", value: `${toBanglaNumber(listing.sizeSqft)} sqft` },
    floorText(listing.floor, listing.totalFloors) && { icon: Layers, label: "তলা", value: floorText(listing.floor, listing.totalFloors) },
    layout && { icon: Sofa, label: "ড্রয়িং-ডাইনিং", value: layout.label },
    forWhom(listing.categories) && { icon: Users, label: "কাদের জন্য", value: forWhom(listing.categories) },
    listing.maxPeople && { icon: Users, label: "সর্বোচ্চ", value: `${toBanglaNumber(listing.maxPeople)} জন` },
    { icon: CalendarDays, label: "কবে থেকে", value: availableText(listing.availableFrom) },
  ].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-4 pb-8 md:px-6 md:pt-6 lg:pb-10">
      <ViewTracker code={listing.code} />
      <div className="flex items-center justify-between gap-2">
        <Link href="/to-let" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          সব বিজ্ঞাপন
        </Link>
        <ShareButton listing={listing} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <ListingGallery photos={listing.photos ?? []} title={title} />

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight wrap-break-word sm:text-3xl">{title} ভাড়া</h1>
            <p className="flex items-center gap-1.5 text-muted">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {placeText(listing)}
            </p>
            <p className="text-3xl font-bold text-primary">
              {formatMoney(listing.rent)}
              <span className="text-base font-normal text-muted">/মাস</span>
            </p>
            <p className="text-sm text-muted">
              {[listing.serviceCharge ? `মাসিক চার্জ ${formatMoney(listing.serviceCharge)}` : null, listing.advanceMonths ? `অগ্রিম ${toBanglaNumber(listing.advanceMonths)} মাসের` : null].filter(Boolean).join(" · ")}
            </p>
            {/* আগ্রহ — বড় হলে গোল করে; কম হলে Server পাঠায় না */}
            {(listing.seenBy || listing.contactedBy) && (
              <p data-interest className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-success-foreground">
                {listing.seenBy && (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    {toBanglaNumber(listing.seenBy)}+ জন দেখেছেন
                  </span>
                )}
                {listing.contactedBy && (
                  <span className="inline-flex items-center gap-1">
                    <PhoneCall className="h-4 w-4" aria-hidden="true" />
                    {toBanglaNumber(listing.contactedBy)}+ জন যোগাযোগ করেছেন
                  </span>
                )}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="text-sm font-semibold wrap-break-word">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {listing.description && (
            <section className="flex flex-col gap-2">
              <h2 className="text-base font-bold">বিস্তারিত</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line wrap-break-word">{listing.description}</p>
            </section>
          )}

          {listing.point && <AreaMap point={listing.point} />}
        </div>

        <aside className="flex w-full flex-col gap-3 lg:sticky lg:top-20 lg:w-80 lg:shrink-0">
          <ContactPanel listing={listing} />
          <ReportButton code={listing.code} />
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="text-lg font-bold">{listing.area}-এ আরও</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <li key={item.code} className="flex min-w-0 [&>a]:min-w-0 [&>a]:flex-1">
                <ListingCard listing={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
