"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ImageOff, Megaphone } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { CONTACT_MODE_OPTIONS, availableText, listingTitle, unitCategories } from "@/lib/listingOptions";
import { toBanglaNumber, toEnglishNumber } from "@/lib/toBanglaNumber";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useCreateListingMutation, useUpdateListingMutation } from "@/redux/features/listing/listingApi";
import { useGetUnitQuery } from "@/redux/features/unit/unitApi";

const MAX_PHOTOS = 8;
const MAX_DESCRIPTION = 1000;
const digits = (value) => toEnglishNumber(value).replace(/\D/g, "");

// কোন ছবি দেখাবেন — চাপলে বাছা বা বাদ, ক্রম অনুযায়ী নম্বর; প্রথমটাই Cover
const PhotoPicker = ({ choices, picked, onChange }) => {
  if (choices.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted">
        <ImageOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        ছবি নেই। ছবি দিলে অনেক বেশি মানুষ দেখেন। Unit Details থেকে ছবি যোগ করুন।
      </p>
    );
  }

  const toggle = (publicId) => {
    if (picked.includes(publicId)) return onChange(picked.filter((id) => id !== publicId));
    if (picked.length >= MAX_PHOTOS) return toast.error(`সর্বোচ্চ ${toBanglaNumber(MAX_PHOTOS)}টি ছবি`);
    onChange([...picked, publicId]);
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {choices.map((photo) => {
        const order = picked.indexOf(photo.publicId);
        return (
          <button
            key={photo.publicId}
            type="button"
            data-photo-choice
            aria-pressed={order >= 0}
            aria-label={order >= 0 ? `Photo ${order + 1} selected` : "Select photo"}
            onClick={() => toggle(photo.publicId)}
            className={cn("relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-primary-soft", order >= 0 ? "border-primary" : "border-transparent opacity-60")}
          >
            <Image loader={cloudinaryLoader} src={photo.url} alt="" fill sizes="(min-width: 640px) 140px, 30vw" className="object-cover" />
            {order >= 0 && (
              <span className="absolute top-1 left-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {order === 0 ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : toBanglaNumber(order + 1)}
              </span>
            )}
            {order === 0 && <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Cover</span>}
          </button>
        );
      })}
    </div>
  );
};

const startValues = (listing, unit, profile, choices) =>
  listing
    ? {
        photos: listing.photos.map(({ publicId }) => publicId),
        description: listing.description ?? "",
        serviceCharge: listing.serviceCharge == null ? "" : String(listing.serviceCharge),
        advanceMonths: listing.advanceMonths == null ? "" : String(listing.advanceMonths),
        contactName: listing.contactName ?? "",
        contactPhone: listing.contactPhone ?? "",
        contactMode: listing.contactMode ?? "both",
        callFrom: listing.callFrom ?? "",
        callTo: listing.callTo ?? "",
      }
    : {
        photos: choices.slice(0, MAX_PHOTOS).map(({ publicId }) => publicId),
        description: "",
        serviceCharge: "",
        advanceMonths: "",
        contactName: profile?.name ?? "",
        contactPhone: profile?.phone || unit.property?.receiptPhone || "",
        contactMode: "both",
        callFrom: "",
        callTo: "",
      };

const ListingForm = ({ unit, listing, profile, onClose }) => {
  const choices = [...(unit.photos ?? []), ...(unit.property?.photos ?? [])];
  const [values, setValues] = useState(() => startValues(listing, unit, profile, choices));
  const [createListing, { isLoading: isCreating }] = useCreateListingMutation();
  const [updateListing, { isLoading: isUpdating }] = useUpdateListingMutation();

  const change = (field, clean) => (event) => setValues((prev) => ({ ...prev, [field]: clean ? clean(event.target.value) : event.target.value }));
  const hasRent = unit.rent > 0;
  // লোকেশন দিয়ে খোঁজায় আসতে বাড়ির ম্যাপ-লোকেশন লাগে — নতুন বিজ্ঞাপনে
  const needsLocation = !listing && !unit.property?.location?.coordinates;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^01[3-9]\d{8}$/.test(values.contactPhone)) return toast.error("সঠিক মোবাইল নম্বর দিন");
    if (Boolean(values.callFrom) !== Boolean(values.callTo)) return toast.error("কল করার সময়ের শুরু ও শেষ দুটোই দিন");
    const body = { ...values, serviceCharge: values.serviceCharge || null, advanceMonths: values.advanceMonths || null };
    try {
      if (listing) {
        await updateListing({ id: listing._id, ...body }).unwrap();
        toast.success("বিজ্ঞাপন বদলানো হয়েছে");
      } else {
        await createListing({ unitId: unit._id, ...body }).unwrap();
        toast.success("To-Let-এ দেওয়া হয়েছে। এখন শেয়ার করুন।");
      }
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <form data-listing-form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="rounded-xl bg-background px-3 py-2.5 text-sm">
        <p className="font-semibold">
          {listingTitle({ categories: unitCategories(unit), unitType: unit.type, bedrooms: unit.bedrooms })} · {unit.property?.area}
        </p>
        {hasRent ? (
          <p className="text-muted">
            ভাড়া {formatMoney(unit.rent)} · {availableText(unit.availableFrom)} · ফ্ল্যাটের তথ্য থেকে আসে, বদলাতে Edit Unit
          </p>
        ) : (
          <p className="text-danger">এই ফ্ল্যাটের ভাড়া লেখা নেই। আগে Edit Unit থেকে ভাড়া দিন।</p>
        )}
        {needsLocation && (
          <p data-needs-location className="mt-1 text-danger">
            ভাড়াটিয়া লোকেশন দিয়ে খোঁজেন, তাই বাড়ির ম্যাপ-লোকেশন লাগবে।{" "}
            <Link href={`/properties/${unit.property?._id}`} className="font-semibold underline">
              বাড়ির পাতায় Edit House থেকে দিন
            </Link>
          </p>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">
          ছবি <span className="font-normal text-muted">({toBanglaNumber(values.photos.length)}/{toBanglaNumber(MAX_PHOTOS)}, প্রথমটা Cover)</span>
        </h3>
        <PhotoPicker choices={choices} picked={values.photos} onChange={(photos) => setValues((prev) => ({ ...prev, photos }))} />
      </section>

      <Textarea
        id="listingDescription"
        label="বর্ণনা (ঐচ্ছিক)"
        rows={3}
        maxLength={MAX_DESCRIPTION}
        placeholder="যেমন: লিফট আছে, গ্যাস লাইন, মেইন রোডের পাশে, পানির সমস্যা নেই"
        value={values.description}
        onChange={change("description")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="listingService" inputMode="numeric" label="সার্ভিস চার্জ / মাস (ঐচ্ছিক)" placeholder="৳" value={values.serviceCharge} onChange={change("serviceCharge", digits)} />
        <Input id="listingAdvance" inputMode="numeric" label="অগ্রিম কত মাসের (ঐচ্ছিক)" value={values.advanceMonths} onChange={change("advanceMonths", (value) => digits(value).slice(0, 2))} />
      </div>

      <section className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">ভাড়াটিয়া কীভাবে যোগাযোগ করবেন</h3>
        <Select id="listingMode" label="মাধ্যম" options={CONTACT_MODE_OPTIONS} value={values.contactMode} onChange={change("contactMode")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="listingPhone" type="tel" inputMode="tel" label="মোবাইল নম্বর" placeholder="01XXXXXXXXX" value={values.contactPhone} onChange={change("contactPhone", (value) => digits(value).slice(0, 11))} />
          <Input id="listingContactName" label="নাম (ঐচ্ছিক)" placeholder="যেমন: কেয়ারটেকার রহিম" maxLength={60} value={values.contactName} onChange={change("contactName")} />
          <Input id="listingCallFrom" type="time" label="কল করার সময় — থেকে (ঐচ্ছিক)" value={values.callFrom} onChange={change("callFrom")} />
          <Input id="listingCallTo" type="time" label="পর্যন্ত" value={values.callTo} onChange={change("callTo")} />
        </div>
        <p className="text-xs text-muted">নম্বর পুরোটা দেখায় না। কেউ কল বা WhatsApp চাপলে তবেই খোলে।</p>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isCreating || isUpdating} disabled={!hasRent || needsLocation}>
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          {listing ? "Save" : "To-Let দিন"}
        </Button>
      </div>
    </form>
  );
};

// বিজ্ঞাপন দেওয়া বা বদলানো — ফ্ল্যাটের ছবি ও তথ্য নিজেই আনে
const ListingFormModal = ({ unitId, listing = null, onClose }) => {
  const { data, isLoading } = useGetUnitQuery(unitId);
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfileQuery();
  const unit = data?.data;

  return (
    <Modal title={listing ? "Edit To-Let" : `To-Let: ${unit?.name ?? ""}`} onClose={onClose} size="lg">
      {isLoading || isProfileLoading || !unit ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <ListingForm unit={unit} listing={listing} profile={profile?.data} onClose={onClose} />
      )}
    </Modal>
  );
};

export default ListingFormModal;
