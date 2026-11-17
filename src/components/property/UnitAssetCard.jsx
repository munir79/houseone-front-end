import Image from "next/image";
import Link from "next/link";
import { DoorOpen, MapPin, Store } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { formatMoney } from "@/lib/formatMoney";
import { isSharedProperty, propertyPath } from "@/lib/navigation";

const TYPE_TEXT = { Flat: "ফ্ল্যাট", Room: "রুম", Shop: "দোকান", Office: "অফিস", Garage: "গ্যারেজ", Other: "অন্যান্য" };

const Metric = ({ value, label }) => (
  <div className="min-w-0 px-3 py-2.5 text-center">
    <p className="truncate text-base font-bold tabular-nums">{value}</p>
    <p className="text-xs text-muted">{label}</p>
  </div>
);

// অন্যের বিল্ডিংয়ে আমার একটা ফ্ল্যাট বা দোকান — বাড়ির card এর মতো চেহারা; চাপলে সেই ইউনিটের পাতা
// note — পাতাভেদে বাড়তি লাইন (যেমন অনুমতি)
const UnitAssetCard = ({ asset, note }) => {
  const { building } = asset;
  const isShop = asset.type && !["Flat", "Room"].includes(asset.type);
  const Icon = isShop ? Store : DoorOpen;
  const href = asset.type ? propertyPath(building._id, `units/${asset._id}`) : propertyPath(building._id);
  const isOccupied = asset.status === "Occupied";

  return (
    <Link href={href} data-unit-asset={asset.name} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-primary">
      <Card flush className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative flex aspect-[16/9] items-center justify-center bg-primary-soft">
          {asset.photo ? (
            <Image loader={cloudinaryLoader} src={asset.photo} alt={asset.name} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          ) : (
            <Icon className="h-8 w-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
          )}
          {asset.status && (
            <Badge variant={isOccupied ? "success" : "warning"} className="absolute top-2.5 left-2.5 shadow-card">
              {isOccupied ? "ভাড়া হয়েছে" : "খালি"}
            </Badge>
          )}
          {isSharedProperty(building) && (
            <Badge variant="info" className="absolute top-2.5 right-2.5 shadow-card">
              অংশীদারি
            </Badge>
          )}
        </div>

        <div className="min-w-0 flex-1 px-4 py-3">
          <h2 className="truncate text-base font-bold">{asset.name}</h2>
          <p data-unit-asset-building className="truncate text-xs font-semibold text-primary">
            {asset.type ? `${TYPE_TEXT[asset.type] ?? asset.type} · ${building.name}` : "ইউনিট যোগ করা হয়নি"}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {building.area}, {building.city}
            </span>
          </p>
          {note}
        </div>

        <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
          <Metric value={asset.rent ? formatMoney(asset.rent) : "—"} label="ভাড়া" />
          <Metric value={isOccupied ? asset.tenantName || "আছে" : "—"} label="ভাড়াটিয়া" />
        </div>
      </Card>
    </Link>
  );
};

export default UnitAssetCard;
