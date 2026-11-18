import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { isSharedProperty } from "@/lib/navigation";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const Metric = ({ value, label }) => (
  <div className="px-3 py-2.5 text-center">
    <p className="text-base font-bold tabular-nums">{value}</p>
    <p className="text-xs text-muted">{label}</p>
  </div>
);

// "পুরো বাড়ি · ২০টি ইউনিট" বা "এই বিল্ডিংয়ে আমার ১টি"
const kindText = ({ kind, unitCount }) => (kind === "market" ? `মার্কেট · ${toBanglaNumber(unitCount)}টি দোকান` : kind === "flats" ? `এই বিল্ডিংয়ে আমার ${toBanglaNumber(unitCount)}টি` : "পুরো বাড়ি");

// note — অংশীদারি সম্পদের পাতায় "আপনি মূল মালিক", অপেক্ষায় থাকা দাওয়াত ইত্যাদি
const PropertyCard = ({ property, note }) => {
  const { unitCount, vacantCount } = property;

  return (
    <Link href={`/properties/${property._id}`} data-property-card={property.name} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-primary">
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
            <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
          )}
          {unitCount > 0 && (
            <Badge variant={vacantCount > 0 ? "warning" : "success"} className="absolute top-2.5 left-2.5 shadow-card">
              {vacantCount > 0 ? `${vacantCount} Vacant` : "Fully Rented"}
            </Badge>
          )}
          {isSharedProperty(property) && (
            <Badge variant="info" className="absolute top-2.5 right-2.5 shadow-card">
              অংশীদারি
            </Badge>
          )}
        </div>

        <div className="min-w-0 flex-1 px-4 py-3">
          <h2 className="truncate text-base font-bold">{property.name}</h2>
          <p data-property-kind className="text-xs font-semibold text-primary">
            {kindText(property)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {property.area}, {property.city}
            </span>
          </p>
          {note}
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
