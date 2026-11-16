"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Camera, Home, MapPin, Ruler } from "lucide-react";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { formatMoney } from "@/lib/formatMoney";
import { availableText, distanceText, floorText, forWhom, listingPath, listingTitle, placeText } from "@/lib/listingOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

// তালিকার একটি বিজ্ঞাপন — ছোট ছবি, ভাড়া, এলাকা, রুম
const ListingCard = ({ listing, priority = false }) => {
  const who = forWhom(listing.categories);
  const facts = [
    listing.bedrooms ? { icon: BedDouble, text: `${toBanglaNumber(listing.bedrooms)} রুম` } : null,
    listing.bathrooms ? { icon: Bath, text: `${toBanglaNumber(listing.bathrooms)} বাথ` } : null,
    listing.sizeSqft ? { icon: Ruler, text: `${toBanglaNumber(listing.sizeSqft)} sqft` } : null,
  ].filter(Boolean);

  return (
    <Link
      href={listingPath(listing)}
      data-listing-card={listing.code}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-[4/3] bg-primary-soft">
        {listing.cover ? (
          <Image
            loader={cloudinaryLoader}
            src={listing.cover}
            alt={listingTitle(listing)}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Home className="absolute inset-0 m-auto h-10 w-10 text-primary/50" aria-hidden="true" />
        )}
        <span className="absolute top-2 left-2 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-card">{availableText(listing.availableFrom)}</span>
        {listing.photoCount > 1 && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-sidebar/80 px-2 py-0.5 text-xs text-sidebar-foreground">
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            {toBanglaNumber(listing.photoCount)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="text-lg font-bold text-primary">
          {formatMoney(listing.rent)}
          <span className="text-sm font-normal text-muted">/মাস</span>
        </p>
        <h3 className="text-sm font-semibold wrap-break-word">{listingTitle(listing)}</h3>
        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {placeText(listing)}
          </span>
        </p>
        {facts.length > 0 && (
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {facts.map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {text}
              </span>
            ))}
          </p>
        )}
        <p className="mt-auto pt-1 text-xs text-muted">
          {[who, floorText(listing.floor), listing.distance != null ? distanceText(listing.distance) : null].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
};

export default ListingCard;
