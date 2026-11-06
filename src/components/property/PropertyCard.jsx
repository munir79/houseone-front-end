import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import Card from "@/components/ui/Card";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";

const Metric = ({ value, label }) => (
  <div className="px-3 py-2.5 text-center">
    <p className="text-sm font-semibold tabular-nums">{value}</p>
    <p className="text-xs text-muted">{label}</p>
  </div>
);

const PropertyCard = ({ property }) => {
  const { unitCount, vacantCount } = property;

  return (
    <Link href={`/properties/${property._id}`} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
      <Card flush className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative flex aspect-[16/9] items-center justify-center bg-primary-soft">
          {property.photos?.[0] ? (
            <Image
              loader={cloudinaryLoader}
              src={property.photos[0].url}
              alt={property.name}
              fill
              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 px-4 py-3">
          <h2 className="truncate text-[15px] font-semibold">{property.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {property.area}, {property.city}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          <Metric value={unitCount} label="Units" />
          <Metric value={unitCount - vacantCount} label="Occupied" />
          <Metric value={vacantCount} label="Vacant" />
        </div>
      </Card>
    </Link>
  );
};

export default PropertyCard;
