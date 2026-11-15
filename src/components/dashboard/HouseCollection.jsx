import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

// বাড়ি অনুযায়ী এই মাস — কয়টি ফ্ল্যাট পুরো দিয়েছে, টাকা কত উঠল
const HouseCollection = ({ houses, monthName }) => {
  const shown = houses.filter(({ flats }) => flats > 0);
  if (shown.length === 0) return null;

  return (
    <Card flush data-house-collection className="overflow-hidden">
      <h2 className="border-b border-border px-4 py-3 text-base font-bold">{monthName}: বাড়ি অনুযায়ী</h2>
      <ul className="divide-y divide-border">
        {shown.map((house) => {
          const percent = house.flats ? Math.round((house.paidFlats / house.flats) * 100) : 0;
          const isDone = house.paidFlats === house.flats;
          return (
            <li key={house._id} data-house-row={house.name}>
              <Link href={`/properties/${house._id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background">
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-semibold wrap-break-word">{house.name}</span>
                    <span className="text-sm tabular-nums">
                      <span className="font-semibold">{formatMoney(house.collected)}</span>
                      <span className="text-muted"> / {formatMoney(house.target)}</span>
                    </span>
                  </span>
                  <span role="progressbar" aria-label={`${house.name} flats paid`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-1.5 overflow-hidden rounded-full bg-border/70">
                    <span className={cn("block h-full rounded-full", isDone ? "bg-success" : "bg-primary")} style={{ width: `${percent}%` }} />
                  </span>
                  <span className="text-xs text-muted">
                    {toBanglaNumber(house.paidFlats)} / {toBanglaNumber(house.flats)} ফ্ল্যাট পুরো দিয়েছে
                    {house.notBilled > 0 && ` · ${toBanglaNumber(house.notBilled)}টির বিল হয়নি`}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default HouseCollection;
