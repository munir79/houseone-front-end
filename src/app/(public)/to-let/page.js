import { Suspense } from "react";
import Image from "next/image";
import { Megaphone } from "lucide-react";
import ListingResults from "@/components/toLet/ListingResults";
import ToLetBrowser from "@/components/toLet/ToLetBrowser";
import ToLetSearch from "@/components/toLet/ToLetSearch";
import LinkButton from "@/components/ui/LinkButton";
import { LISTING_CATEGORIES, categoryLabel } from "@/lib/listingOptions";
import { fetchListings, searchQuery } from "@/lib/publicListing";

const HERO_IMAGE = "/images/to-let-image/Smart%20Living%20at%20Twilight.png";

const headingOf = (params) => {
  const what = LISTING_CATEGORIES.some(({ value }) => value === params.category) ? `${categoryLabel(params.category)} ` : "";
  const where = [params.area, params.near ? params.place : null].find((value) => typeof value === "string" && value.trim());
  return where ? `${where.trim().slice(0, 60)}-এ ${what}বাসা ভাড়া` : `${what}বাসা, দোকান ও অফিস ভাড়া`;
};

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const title = `To-Let: ${headingOf(params)}`;
  const description = "বাংলাদেশে ফ্যামিলি, ব্যাচেলর, সাবলেট, অফিস ও দোকান ভাড়া — বাড়িওয়ালার সাথে সরাসরি কল বা WhatsApp।";
  return { title, description, alternates: { canonical: "/to-let" }, openGraph: { title, description, type: "website" } };
}

// ভাড়াটিয়ার খোঁজার পাতা — Server এ তৈরি, তাই দ্রুত খোলে ও Google পড়তে পারে
export default async function ToLetPage({ searchParams }) {
  const params = await searchParams;
  const query = searchQuery(params);
  const initial = await fetchListings(query).catch(() => null);

  return (
    <>
      {/* ছবি আলাদা ঘরে কাটা — লোকেশনের তালিকা hero র নিচে বেরোতে পারে */}
      <section className="relative isolate bg-sidebar">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover object-[70%_center]" />
          <div className="absolute inset-0 bg-linear-to-r from-sidebar/90 via-sidebar/65 to-sidebar/10" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-sidebar-accent">To-Let · বিনামূল্যে</p>
            <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight text-sidebar-foreground sm:text-4xl">{headingOf(params)}</h1>
            <p className="mt-2 text-sm text-sidebar-foreground/90 sm:text-base">বাংলাদেশের যেকোনো জায়গায় খুঁজুন — বাড়িওয়ালার সাথে সরাসরি কল বা WhatsApp।</p>
          </div>
          <Suspense>
            <ToLetSearch key={query} />
          </Suspense>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-6 md:py-8">
        {initial ? (
          <Suspense>
            <ToLetBrowser meta={initial.meta}>
              <ListingResults data={initial.data} meta={initial.meta} query={query} />
            </ToLetBrowser>
          </Suspense>
        ) : (
          <div className="rounded-2xl border border-border bg-surface px-4 py-10 text-center">
            <p className="font-semibold">বিজ্ঞাপন আনা যায়নি</p>
            <p className="mt-1 text-sm text-muted">একটু পরে আবার চেষ্টা করুন।</p>
            <LinkButton href={query ? `/to-let?${query}` : "/to-let"} variant="outline" className="mt-4">
              আবার চেষ্টা করুন
            </LinkButton>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-6 text-center">
          <p className="font-semibold">বাড়ি বা মার্কেটের মালিক?</p>
          <p className="text-sm text-muted">খালি ফ্ল্যাট বা দোকানের বিজ্ঞাপন দিন বিনামূল্যে — ভাড়া হলে নিজেই বন্ধ হয়।</p>
          <LinkButton href="/register" variant="outline" size="sm" className="mt-1">
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            বিনামূল্যে বিজ্ঞাপন দিন
          </LinkButton>
        </div>
      </div>
    </>
  );
}
