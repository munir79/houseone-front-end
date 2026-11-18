import Link from "next/link";
import { ArrowRight, Building2, ChevronRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { propertyPath } from "@/lib/navigation";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const kindText = (kind) => (kind === "market" ? "মার্কেট" : kind === "flats" ? "অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট" : "পুরো বাড়ি");

// সম্পদ এক নজরে — প্রতিটা সম্পদে এই মাসের আদায়, খালি ইউনিট আর করণীয়; চাপলে ভেতরে
// title, allHref — বাড়ি বা মার্কেটের জগৎ অনুযায়ী
const AssetGlance = ({ houses, byHouse = [], monthName, isLoading, title = "সম্পদ এক নজরে", allHref = "/properties", allLabel = "সব সম্পদ" }) => {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (houses.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="প্রথম বাড়ি বা ফ্ল্যাটটি যোগ করুন, তারপর এখানে সব হিসাব দেখবেন।"
          action={<LinkButton href={allHref}>সম্পদ যোগ করুন</LinkButton>}
        />
      </Card>
    );
  }

  const countsOf = new Map(byHouse.map((row) => [row._id, row]));

  return (
    <section data-asset-glance className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={allHref} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary md:min-h-0">
          {allLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {houses.map((house) => {
          const counts = countsOf.get(String(house._id)) ?? { vacant: 0, actions: 0 };
          const percent = house.flats ? Math.round((house.paidFlats / house.flats) * 100) : 0;
          const isDone = house.flats > 0 && house.paidFlats === house.flats;
          return (
            <li key={house._id} className="min-w-0">
              <Link
                href={propertyPath(house._id)}
                data-asset-card={house.name}
                className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card transition-colors hover:border-primary"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-base font-bold wrap-break-word">{house.name}</span>
                    <span className="block text-xs text-muted wrap-break-word">
                      {kindText(house.kind)} · {house.area}
                    </span>
                  </span>
                  {house.isShared && <Badge variant="info">অংশীদারি</Badge>}
                </span>

                <span className="flex flex-col gap-1.5">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="text-muted">{monthName} আদায়</span>
                    <span className="tabular-nums">
                      <span data-asset-collected className="font-semibold">{formatMoney(house.collected)}</span>
                      <span className="text-muted"> / {formatMoney(house.target)}</span>
                    </span>
                  </span>
                  <span role="progressbar" aria-label={`${house.name} flats paid`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-1.5 overflow-hidden rounded-full bg-border/70">
                    <span className={cn("block h-full rounded-full", isDone ? "bg-success" : "bg-primary")} style={{ width: `${percent}%` }} />
                  </span>
                </span>

                <span className="mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span data-asset-vacant className="rounded-full bg-warning-soft px-2.5 py-1 text-warning-foreground">খালি {toBanglaNumber(counts.vacant)}</span>
                  <span data-asset-actions className={cn("rounded-full px-2.5 py-1", counts.actions > 0 ? "bg-danger-soft text-danger-foreground" : "bg-primary-soft text-primary")}>
                    {counts.actions > 0 ? `করণীয় ${toBanglaNumber(counts.actions)}` : "কাজ বাকি নেই"}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-0.5 text-primary">
                    ঢুকুন
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default AssetGlance;
