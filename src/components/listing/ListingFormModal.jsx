"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Banknote, ImagePlus, Layers, Loader2, MapPin, Megaphone, Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import LocationSearch from "@/components/property/LocationSearch";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { cn } from "@/lib/cn";
import { DISTRICT_OPTIONS, districtLabel } from "@/lib/districts";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { CONTACT_MODE_OPTIONS, availableText, floorText, listingTitle, unitCategories } from "@/lib/listingOptions";
import { ELECTRICITY_OPTIONS, GAS_OPTIONS } from "@/lib/formTerms";
import { toBanglaNumber, toEnglishNumber } from "@/lib/toBanglaNumber";
import { LIVING_LAYOUT_OPTIONS } from "@/lib/unitOptions";
import { uploadImage } from "@/lib/uploadImage";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useCreateListingMutation, useUpdateListingMutation } from "@/redux/features/listing/listingApi";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";
import { useUpdatePropertyMutation } from "@/redux/features/property/propertyApi";
import { useGetFormSettingsQuery } from "@/redux/features/tenantForm/tenantFormApi";
import { useGetUnitQuery, useUpdateUnitMutation } from "@/redux/features/unit/unitApi";

const MAX_PHOTOS = 8;
// নতুন ছবি ফ্ল্যাটের ছবিতে যোগ হয় — ফ্ল্যাটে সর্বোচ্চ এতগুলো
const MAX_UNIT_PHOTOS = 5;
const MAX_FILE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_DESCRIPTION = 1000;
const digits = (value) => toEnglishNumber(value).replace(/\D/g, "");

// কোন ছবি দেখাবেন — চাপলে বাছা বা বাদ; ⭐ চাপলে Cover; নতুন ছবিও এখানেই
const PhotoPicker = ({ choices, picked, onChange, onUpload, canUpload, isUploading }) => {
  const inputRef = useRef(null);

  const toggle = (publicId) => {
    if (picked.includes(publicId)) return onChange(picked.filter((id) => id !== publicId));
    if (picked.length >= MAX_PHOTOS) return toast.error(`সর্বোচ্চ ${toBanglaNumber(MAX_PHOTOS)}টি ছবি`);
    onChange([...picked, publicId]);
  };

  const makeCover = (publicId) => onChange([publicId, ...picked.filter((id) => id !== publicId)]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {choices.map((photo) => {
        const order = picked.indexOf(photo.publicId);
        return (
          <div key={photo.publicId} className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <button
              type="button"
              data-photo-choice
              aria-pressed={order >= 0}
              aria-label={order >= 0 ? `Photo ${order + 1} selected, tap to remove` : "Tap to add photo"}
              onClick={() => toggle(photo.publicId)}
              className={cn("absolute inset-0 overflow-hidden rounded-lg border-2 bg-primary-soft", order >= 0 ? "border-primary" : "border-border")}
            >
              <Image loader={cloudinaryLoader} src={photo.url} alt="" fill sizes="(min-width: 640px) 180px, 45vw" className={cn("object-cover", order < 0 && "opacity-50")} />
              {order >= 0 && (
                <span className="absolute top-1.5 left-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">{toBanglaNumber(order + 1)}</span>
              )}
              {order === 0 && (
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-primary py-1.5 text-xs font-semibold text-primary-foreground">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  Cover ছবি
                </span>
              )}
              {order < 0 && <span className="absolute inset-x-0 bottom-0 bg-surface/90 py-1.5 text-center text-xs font-medium text-muted">বাছতে চাপুন</span>}
            </button>
            {order > 0 && (
              <button
                type="button"
                data-make-cover
                onClick={() => makeCover(photo.publicId)}
                aria-label={`Make photo ${order + 1} the cover`}
                className="absolute inset-x-0 bottom-0 flex min-h-9 items-center justify-center gap-1 border-t border-border bg-surface/95 text-xs font-semibold text-foreground hover:bg-primary-soft"
              >
                <Star className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                Cover করুন
              </button>
            )}
          </div>
        );
      })}

      {canUpload && (
        <button
          type="button"
          data-add-photo
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
          {isUploading ? "আপলোড হচ্ছে" : "ছবি যোগ করুন"}
        </button>
      )}
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} multiple hidden onChange={onUpload} />
    </div>
  );
};

// ফ্ল্যাটের ধরন অনুযায়ী বাড়ির ফর্ম সেটিং — ফ্ল্যাটের নিজের শর্ত থাকলে সেটা আগে
const termsFor = (unit, settings) => {
  const type = unit.type === "Room" ? "Sublet" : ["Shop", "Office"].includes(unit.type) ? unit.type : unit.preferredTenant === "Any" ? "Family" : unit.preferredTenant;
  const config = settings?.[type];
  const own = unit.formTerms?.[type];
  return config || own ? { ...config, ...own } : null;
};

// ফ্ল্যাটের তথ্য থেকে বর্ণনা — মালিক বদলাতে পারেন
const autoDescription = (unit, terms) => {
  const layout = LIVING_LAYOUT_OPTIONS.find(({ value }) => value && value === unit.livingLayout)?.label;
  const rooms = [
    unit.bedrooms && `${toBanglaNumber(unit.bedrooms)} বেডরুম`,
    unit.bathrooms && `${toBanglaNumber(unit.bathrooms)} বাথরুম`,
    unit.balconies && `${toBanglaNumber(unit.balconies)} বারান্দা`,
    layout,
    unit.sizeSqft && `${toBanglaNumber(unit.sizeSqft)} sqft`,
  ].filter(Boolean);
  const gas = GAS_OPTIONS.find(({ value }) => value === terms?.gas)?.label;
  const electricity = ELECTRICITY_OPTIONS.find(({ value }) => value === terms?.electricity)?.label;
  const utilities = [gas && `গ্যাস: ${gas}`, electricity && `বিদ্যুৎ: ${electricity}`].filter(Boolean);
  const charges = (terms?.charges ?? []).filter(({ name, amount }) => name && Number(amount) > 0).map(({ name, amount }) => `${name} ${formatMoney(Number(amount))}`);
  return [rooms.length && `${rooms.join(", ")}।`, utilities.length && `${utilities.join(", ")}।`, charges.length && `মাসিক চার্জ: ${charges.join(", ")}।`]
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_DESCRIPTION);
};

const chargesTotal = (terms) => (terms?.charges ?? []).reduce((sum, { amount }) => sum + (Number(amount) || 0), 0);

const startValues = (listing, unit, profile, choices, terms) =>
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
        altName: listing.altName ?? "",
        altPhone: listing.altPhone ?? "",
      }
    : {
        photos: choices.slice(0, MAX_PHOTOS).map(({ publicId }) => publicId),
        description: autoDescription(unit, terms),
        serviceCharge: chargesTotal(terms) ? String(chargesTotal(terms)) : "",
        advanceMonths: terms?.advanceMonths ? String(terms.advanceMonths) : "",
        contactName: profile?.name ?? "",
        contactPhone: profile?.phone || unit.property?.receiptPhone || "",
        contactMode: "both",
        callFrom: "",
        callTo: "",
        altName: "",
        altPhone: "",
      };

// নিশ্চিত করার জন্য — কোন ফ্ল্যাট, কোন তলা, কোথায়, ভাড়া কত
const ConfirmRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted">{label}</p>
      <div className="text-sm font-medium wrap-break-word">{children}</div>
    </div>
  </div>
);

// ধরন অনুযায়ী কোন তথ্য দরকার — জরুরি না থাকলে দেওয়ার আগে জিজ্ঞেস করা হয়
const INFO_LABELS = { bedrooms: "রুম", bathrooms: "বাথরুম", balconies: "বারান্দা", sizeSqft: "মাপ (sqft)" };
const infoNeeds = (unit) => {
  if (unit.type === "Garage") return { required: [], nice: [] };
  if (["Shop", "Office"].includes(unit.type)) return { required: ["sizeSqft"], nice: ["bathrooms"] };
  return { required: ["bedrooms", "bathrooms"], nice: ["balconies", "sizeSqft"] };
};

const EditLink = ({ label = "বদলান", ...props }) => (
  <button type="button" className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-primary hover:underline" {...props}>
    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
    {label}
  </button>
);

const ListingForm = ({ unit, listing, profile, settings, onClose }) => {
  const property = unit.property ?? {};
  const terms = termsFor(unit, settings);
  // ফ্ল্যাটের ছবি — নতুন upload এখানে যোগ হয়, সেভের সময় ফ্ল্যাটেও যায়
  const [unitPhotos, setUnitPhotos] = useState(unit.photos ?? []);
  const choices = [...unitPhotos, ...(property.photos ?? [])];
  const [values, setValues] = useState(() => startValues(listing, unit, profile, choices, terms));
  // ভাড়া — না থাকলে লিখতে হয়, থাকলে "বদলান" চাপলে; ফ্ল্যাটেও সেভ হয়
  const [rent, setRent] = useState(unit.rent > 0 ? String(unit.rent) : "");
  const [isEditingRent, setIsEditingRent] = useState(!(unit.rent > 0));
  // লোকেশন — পুরো বাড়ির; নতুন জায়গা বাছলে এলাকা ও জেলাও
  const [isEditingPlace, setIsEditingPlace] = useState(false);
  const [place, setPlace] = useState(null);
  const [placeArea, setPlaceArea] = useState("");
  const [placeCity, setPlaceCity] = useState("");
  // ফ্ল্যাটে যে তথ্য নেই — এখানেই দেওয়া যায়, ফ্ল্যাটেও সেভ হয়
  const needs = infoNeeds(unit);
  const missingFields = [...needs.required, ...needs.nice].filter((field) => unit[field] == null);
  const [info, setInfo] = useState(() => Object.fromEntries(missingFields.map((field) => [field, ""])));
  // জরুরি তথ্য ছাড়া দিতে চাইলে নিচে জিজ্ঞেস — "এভাবেই দিন" বা "ফিরে গিয়ে দিন"
  const [askMissing, setAskMissing] = useState(null);
  const infoBoxRef = useRef(null);
  const photoSectionRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const [getSignature] = useGetUploadSignatureMutation();
  const [updateUnit] = useUpdateUnitMutation();
  const [updateProperty] = useUpdatePropertyMutation();
  const [createListing, { isLoading: isCreating }] = useCreateListingMutation();
  const [updateListing, { isLoading: isUpdating }] = useUpdateListingMutation();

  const change = (field, clean) => (event) => setValues((prev) => ({ ...prev, [field]: clean ? clean(event.target.value) : event.target.value }));
  const isPrefilled = !listing && Boolean(terms);
  const needsRent = !(unit.rent > 0);
  const rentChanged = isEditingRent && Number(rent) !== unit.rent;
  // লোকেশন দিয়ে খোঁজায় আসতে বাড়ির ম্যাপ-লোকেশন লাগে
  const needsLocation = !property.location?.coordinates && !place;

  const pickPlace = (picked) => {
    setPlace(picked);
    if (!picked) return;
    setPlaceArea(picked.area || property.area || "");
    setPlaceCity(picked.district || property.city || "");
  };

  const cancelPlace = () => {
    setIsEditingPlace(false);
    setPlace(null);
  };
  const photosChanged = unitPhotos.length !== (unit.photos ?? []).length;
  const uploadLeft = MAX_UNIT_PHOTOS - unitPhotos.length;

  const handleUpload = async (event) => {
    const chosen = [...event.target.files];
    event.target.value = "";
    const valid = chosen.filter((file) => ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_MB * 1024 * 1024);
    if (valid.length < chosen.length) toast.error(`শুধু ${toBanglaNumber(MAX_FILE_MB)} MB এর কম JPG, PNG বা WebP ছবি`);
    if (valid.length > uploadLeft) toast.error(`ফ্ল্যাটে সর্বোচ্চ ${toBanglaNumber(MAX_UNIT_PHOTOS)}টি ছবি রাখা যায়`);
    const files = valid.slice(0, uploadLeft);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: signature } = await getSignature("units").unwrap();
      const results = await Promise.allSettled(files.map((file) => uploadImage(file, signature)));
      const uploaded = results.filter(({ status }) => status === "fulfilled").map(({ value }) => value);
      if (uploaded.length < files.length) toast.error("কিছু ছবি আপলোড হয়নি। আবার চেষ্টা করুন।");
      setUnitPhotos((prev) => [...prev, ...uploaded].slice(0, MAX_UNIT_PHOTOS));
      // নতুন ছবি নিজে থেকে বাছা — জায়গা থাকলে
      setValues((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded.map(({ publicId }) => publicId)].slice(0, MAX_PHOTOS) }));
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsUploading(false);
    }
  };

  // এখানে লেখা তথ্য — শুধু যেগুলো দেওয়া হয়েছে
  const filledInfo = Object.fromEntries(Object.entries(info).filter(([, value]) => value !== "").map(([field, value]) => [field, Number(value)]));
  // জরুরি তথ্য বা ছবি এখনো নেই
  const stillMissing = [...needs.required.filter((field) => unit[field] == null && info[field] === "").map((field) => INFO_LABELS[field]), ...(values.photos.length === 0 ? ["ছবি"] : [])];

  const goBackToInfo = () => {
    setAskMissing(null);
    // তথ্যের ঘর থাকলে সেখানে, নাহলে ছবির অংশে
    const target = infoBoxRef.current ?? photoSectionRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    infoBoxRef.current?.querySelector("input")?.focus();
  };

  const handleSubmit = async (event, skipCheck = false) => {
    event?.preventDefault();
    if (isEditingRent && !(Number(rent) > 0)) return toast.error("মাসিক ভাড়া লিখুন");
    if (!skipCheck && stillMissing.length > 0) return setAskMissing(stillMissing);
    setAskMissing(null);
    if (isEditingPlace && !place && needsLocation) return toast.error("নতুন লোকেশন বাছুন");
    if (place && (!placeArea.trim() || !placeCity)) return toast.error("এলাকা ও জেলা দিন");
    if (!/^01[3-9]\d{8}$/.test(values.contactPhone)) return toast.error("সঠিক মোবাইল নম্বর দিন");
    if (Boolean(values.callFrom) !== Boolean(values.callTo)) return toast.error("কল করার সময়ের শুরু ও শেষ দুটোই দিন");
    if (values.altPhone && !/^01[3-9]\d{8}$/.test(values.altPhone)) return toast.error("আরেকটি নম্বর সঠিক নয়");
    const body = { ...values, serviceCharge: values.serviceCharge || null, advanceMonths: values.advanceMonths || null };
    try {
      setIsSavingUnit(true);
      // আগে বাড়ির লোকেশন, তারপর ফ্ল্যাট — ভাড়া ও নতুন ছবি; শেষে বিজ্ঞাপন সেগুলো পায়
      if (place) {
        await updateProperty({
          id: property._id,
          location: { lat: place.lat, lng: place.lng, label: place.label, locality: place.area },
          area: placeArea.trim(),
          city: placeCity,
        }).unwrap();
      }
      if (rentChanged || photosChanged || Object.keys(filledInfo).length > 0) {
        await updateUnit({
          id: unit._id,
          ...filledInfo,
          ...(rentChanged ? { rent: Number(rent) } : {}),
          ...(photosChanged ? { photos: unitPhotos.map(({ publicId, version, signature }) => ({ publicId, version, signature })) } : {}),
        }).unwrap();
      }
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
    } finally {
      setIsSavingUnit(false);
    }
  };

  return (
    <form data-listing-form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <section data-listing-confirm className="flex flex-col gap-3 rounded-xl bg-background p-3">
        <p className="text-sm font-semibold">
          {listingTitle({ categories: unitCategories(unit), unitType: unit.type, bedrooms: unit.bedrooms })} · {unit.name}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ConfirmRow icon={Layers} label="তলা">
            <span data-confirm-floor>{floorText(unit.floor, property.totalFloors)}</span>
          </ConfirmRow>
          <ConfirmRow icon={Banknote} label="মাসিক ভাড়া">
            {isEditingRent ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Input id="listingRent" inputMode="numeric" compact aria-label="মাসিক ভাড়া" placeholder="ভাড়া লিখুন, যেমন 15000" value={rent} onChange={(e) => setRent(digits(e.target.value))} className="min-w-0 flex-1" />
                  {!needsRent && (
                    <button type="button" onClick={() => { setIsEditingRent(false); setRent(String(unit.rent)); }} className="min-h-10 shrink-0 px-1 text-xs font-semibold text-muted hover:text-foreground">
                      বাতিল
                    </button>
                  )}
                </div>
                <span className="text-xs font-normal text-muted">ফ্ল্যাটের ভাড়াও বদলাবে। এখনকার ভাড়াটিয়ার ভাড়া বদলাবে না।</span>
              </div>
            ) : (
              <span className="flex flex-wrap items-center gap-x-2">
                <span>
                  {formatMoney(unit.rent)} · {availableText(unit.availableFrom)}
                </span>
                <EditLink data-edit-rent onClick={() => setIsEditingRent(true)} />
              </span>
            )}
          </ConfirmRow>
        </div>
        <ConfirmRow icon={MapPin} label="লোকেশন (পুরো বাড়ির)">
          {isEditingPlace ? (
            <div data-place-editor className="flex flex-col gap-3">
              <LocationSearch value={place} onChange={pickPlace} />
              {place && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select id="listingPlaceCity" label="জেলা" options={DISTRICT_OPTIONS} value={placeCity} onChange={(e) => setPlaceCity(e.target.value)} />
                  <Input id="listingPlaceArea" label="এলাকা" value={placeArea} onChange={(e) => setPlaceArea(e.target.value)} />
                  <p className="text-xs font-normal text-muted sm:col-span-2">
                    আগে: {[property.area, districtLabel(property.city)].filter(Boolean).join(", ")} → এখন: {[placeArea, districtLabel(placeCity)].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              <p className="text-xs font-normal text-warning-foreground">এটা পুরো বাড়ির লোকেশন বদলাবে। এই বাড়ির সব বিজ্ঞাপনে নতুন লোকেশন যাবে।</p>
              <button type="button" onClick={cancelPlace} className="w-fit text-xs font-semibold text-muted hover:text-foreground">
                বাতিল, আগের লোকেশন রাখুন
              </button>
            </div>
          ) : needsLocation ? (
            <span data-needs-location className="flex flex-wrap items-center gap-x-2 text-danger">
              ম্যাপ-লোকেশন নেই। ভাড়াটিয়া লোকেশন দিয়ে খোঁজেন, তাই লাগবে।
              <EditLink label="লোকেশন দিন" data-edit-location onClick={() => setIsEditingPlace(true)} />
            </span>
          ) : (
            <span data-confirm-location className="block">
              <span className="flex flex-wrap items-center gap-x-2">
                {[property.location.locality, property.area, districtLabel(property.city)].filter(Boolean).join(", ")}
                <EditLink data-edit-location onClick={() => setIsEditingPlace(true)} />
              </span>
              {property.location.label && <span className="block text-xs font-normal text-muted">{property.location.label}</span>}
            </span>
          )}
        </ConfirmRow>
      </section>

      {missingFields.length > 0 && (
        <section ref={infoBoxRef} data-missing-info className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft p-3">
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">{toBanglaNumber(missingFields.length)}টা তথ্য নেই:</span> {missingFields.map((field) => INFO_LABELS[field]).join(", ")}। এগুলো থাকলে অনেক বেশি মানুষ যোগাযোগ করেন। এখানে দিলে ফ্ল্যাটেও সেভ হবে।
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {missingFields.map((field) => (
              <Input
                key={field}
                id={`listingInfo-${field}`}
                inputMode="numeric"
                compact
                label={`${INFO_LABELS[field]}${needs.required.includes(field) ? "" : " (ঐচ্ছিক)"}`}
                value={info[field]}
                onChange={(e) => setInfo((prev) => ({ ...prev, [field]: digits(e.target.value).slice(0, field === "sizeSqft" ? 6 : 2) }))}
              />
            ))}
          </div>
        </section>
      )}

      <section ref={photoSectionRef} className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">
          ছবি <span className="font-normal text-muted">({toBanglaNumber(values.photos.length)}/{toBanglaNumber(MAX_PHOTOS)})</span>
        </h3>
        <p className="-mt-1 text-xs text-muted">ছবিতে চাপলে বিজ্ঞাপনে যোগ বা বাদ হয়। যেটা প্রথমে দেখাতে চান, তার নিচের &quot;Cover করুন&quot; চাপুন।</p>
        <PhotoPicker
          choices={choices}
          picked={values.photos}
          onChange={(photos) => setValues((prev) => ({ ...prev, photos }))}
          onUpload={handleUpload}
          canUpload={uploadLeft > 0}
          isUploading={isUploading}
        />
        {choices.length === 0 && <p className="text-xs text-muted">ছবি দিলে অনেক বেশি মানুষ দেখেন। নতুন ছবি ফ্ল্যাটের ছবিতেও যোগ হবে।</p>}
      </section>

      <Textarea
        id="listingDescription"
        label="বর্ণনা (ঐচ্ছিক)"
        rows={4}
        maxLength={MAX_DESCRIPTION}
        placeholder="যেমন: লিফট আছে, গ্যাস লাইন, মেইন রোডের পাশে, পানির সমস্যা নেই"
        value={values.description}
        onChange={change("description")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="listingService" inputMode="numeric" label="মাসিক চার্জ, মোট (ঐচ্ছিক)" placeholder="৳" value={values.serviceCharge} onChange={change("serviceCharge", digits)} />
        <Input id="listingAdvance" inputMode="numeric" label="অগ্রিম কত মাসের (ঐচ্ছিক)" value={values.advanceMonths} onChange={change("advanceMonths", (value) => digits(value).slice(0, 2))} />
      </div>
      {isPrefilled && <p data-prefilled className="-mt-3 text-xs text-muted">ফ্ল্যাট ও বাড়ির ফর্ম সেটিং থেকে বসানো। দরকার হলে বদলান।</p>}

      <section className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">ভাড়াটিয়া কীভাবে যোগাযোগ করবেন</h3>
        <Select id="listingMode" label="মাধ্যম" options={CONTACT_MODE_OPTIONS} value={values.contactMode} onChange={change("contactMode")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="listingPhone" type="tel" inputMode="tel" label="মোবাইল নম্বর" placeholder="01XXXXXXXXX" value={values.contactPhone} onChange={change("contactPhone", (value) => digits(value).slice(0, 11))} />
          <Input id="listingContactName" label="নাম (ঐচ্ছিক)" placeholder="যেমন: কেয়ারটেকার রহিম" maxLength={60} value={values.contactName} onChange={change("contactName")} />
          <Input id="listingCallFrom" type="time" label="কল করার সময় — থেকে (ঐচ্ছিক)" value={values.callFrom} onChange={change("callFrom")} />
          <Input id="listingCallTo" type="time" label="পর্যন্ত" value={values.callTo} onChange={change("callTo")} />
          <Input id="listingAltPhone" type="tel" inputMode="tel" label="আরেকটি নম্বর (ঐচ্ছিক)" placeholder="01XXXXXXXXX" value={values.altPhone} onChange={change("altPhone", (value) => digits(value).slice(0, 11))} />
          <Input id="listingAltName" label="কার নম্বর (ঐচ্ছিক)" placeholder="যেমন: দারোয়ান" maxLength={60} value={values.altName} onChange={change("altName")} />
        </div>
        <p className="text-xs text-muted">নম্বর পুরোটা দেখায় না। কেউ কল বা WhatsApp চাপলে তবেই খোলে।</p>
      </section>

      {askMissing && (
        <div data-ask-missing role="alert" className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft p-3">
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">{askMissing.join(", ")} ছাড়া বিজ্ঞাপন দেবেন?</span> এগুলো না থাকলে ভাড়াটিয়া কম যোগাযোগ করেন।
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" size="sm" onClick={(event) => handleSubmit(event, true)}>
              এভাবেই দিন
            </Button>
            <Button size="sm" onClick={goBackToInfo}>
              ফিরে গিয়ে দিন
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSavingUnit || isCreating || isUpdating} disabled={(!listing && needsLocation) || isUploading}>
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
  // নতুন বিজ্ঞাপনে চার্জ ও অগ্রিম বসাতে — সেটিং না থাকলেও ফর্ম খোলে
  const { data: settingsData, isLoading: isSettingsLoading } = useGetFormSettingsQuery(unit?.property?._id, { skip: Boolean(listing) || !unit?.property?._id });

  return (
    <Modal title={listing ? `Edit To-Let: ${unit?.name ?? ""}` : `To-Let: ${unit?.name ?? ""}`} onClose={onClose} size="lg">
      {isLoading || isProfileLoading || isSettingsLoading || !unit ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <ListingForm unit={unit} listing={listing} profile={profile?.data} settings={settingsData?.data} onClose={onClose} />
      )}
    </Modal>
  );
};

export default ListingFormModal;
