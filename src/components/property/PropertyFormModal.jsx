"use client";

import { useState } from "react";
import { toast } from "sonner";
import LocationSearch from "./LocationSearch";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { DISTRICT_OPTIONS } from "@/lib/districts";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useGetLocationsQuery } from "@/redux/features/location/locationApi";
import { useCreatePropertyMutation, useUpdatePropertyMutation } from "@/redux/features/property/propertyApi";

const toLocationValue = (location) =>
  location ? { lat: location.coordinates[1], lng: location.coordinates[0], label: location.label, locality: location.locality } : null;

// property না দিলে নতুন বাড়ি, দিলে Edit
const PropertyFormModal = ({ property, onClose, onSaved }) => {
  const isEdit = Boolean(property);

  const [form, setForm] = useState({
    name: property?.name || "",
    city: property?.city || "",
    area: property?.area || "",
    address: property?.address || "",
    totalFloors: property?.totalFloors?.toString() || "",
    receiptName: property?.receiptName || "",
    receiptPhone: property?.receiptPhone || "",
    kind: property?.kind || "whole",
  });
  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState(toLocationValue(property?.location));
  const [photos, setPhotos] = useState(property?.photos || []);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);

  const { data: locationsData } = useGetLocationsQuery();
  const [createProperty, { isLoading: isCreating }] = useCreatePropertyMutation();
  const [updateProperty, { isLoading: isUpdating }] = useUpdatePropertyMutation();

  // বড় শহরের চেনা এলাকা — লেখার সময় পরামর্শ, যাতে নাম এক রকম থাকে
  const areaSuggestions = (locationsData?.data || []).find(({ city }) => city === form.city)?.areas || [];

  // লেখা শুরু করলেই সেই ঘরের Error চলে যায়
  const clearError = (...fields) => {
    setErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => delete next[field]);
      return next;
    });
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    clearError(field);
  };

  // ম্যাপে জায়গা বাছলে জেলা ও এলাকা নিজে থেকে — পরে বদলানো যায়
  const handleLocation = (place) => {
    // পাড়া — Photon এর এলাকা; To-Let এ এলাকার সাথে দেখায়
    setLocation(place && { ...place, locality: place.area });
    if (!place) return;
    setForm((prev) => ({ ...prev, city: place.district || prev.city, area: place.area || prev.area }));
    clearError("location", "city", "area");
  };

  const finalArea = form.area.trim();

  const validate = () => {
    const newErrors = {};
    const floors = Number(form.totalFloors);

    if (!form.name.trim()) newErrors.name = "বাড়ির নাম লিখুন";
    if (!location) newErrors.location = "ম্যাপে বাড়ির লোকেশন দিন — নাম লিখে খুঁজুন বা পাশের বোতামে নিজের লোকেশন";
    if (!form.city) newErrors.city = "জেলা বেছে নিন";
    if (!finalArea) newErrors.area = "এলাকার নাম লিখুন";
    if (!form.address.trim()) newErrors.address = "ঠিকানা লিখুন";
    if (!Number.isInteger(floors) || floors < 1 || floors > 200) newErrors.totalFloors = "১ থেকে ২০০ এর মধ্যে তলার সংখ্যা লিখুন";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      name: form.name,
      city: form.city,
      area: finalArea,
      address: form.address,
      totalFloors: Number(form.totalFloors),
      receiptName: form.receiptName,
      receiptPhone: form.receiptPhone,
      kind: form.kind,
      location: { lat: location.lat, lng: location.lng, label: location.label, locality: location.locality },
      photos: photos.map(({ publicId, version, signature }) => ({ publicId, version, signature })),
    };

    try {
      const response = isEdit
        ? await updateProperty({ id: property._id, ...body }).unwrap()
        : await createProperty(body).unwrap();

      toast.success(response.message);
      onSaved?.(response.data);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "বাড়ি সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={isEdit ? "Edit House" : "Add House"} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Basic information">
          {isEdit && (
            <Select
              id="propertyKind"
              label="কী আছে"
              options={[
                { value: "whole", label: "পুরো বাড়ি" },
                { value: "flats", label: "অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট বা দোকান" },
              ]}
              value={form.kind}
              onChange={handleChange("kind")}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Input
              id="name"
              label="House name"
              placeholder="Sunshine Residency"
              value={form.name}
              onChange={handleChange("name")}
              error={errors.name}
            />
            <Input
              id="totalFloors"
              label="Total floors"
              type="number"
              inputMode="numeric"
              min="1"
              max="200"
              placeholder="6"
              value={form.totalFloors}
              onChange={handleChange("totalFloors")}
              error={errors.totalFloors}
            />
          </div>
        </FormSection>

        <FormSection title="Location">
          <LocationSearch value={location} onChange={handleLocation} error={errors.location} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="city" label="District" placeholder="জেলা বেছে নিন" options={DISTRICT_OPTIONS} value={form.city} onChange={handleChange("city")} error={errors.city} />
            <Input id="area" label="Area" placeholder="যেমন: Shewrapara" list="areaSuggestions" autoComplete="off" value={form.area} onChange={handleChange("area")} error={errors.area} />
            <datalist id="areaSuggestions">
              {areaSuggestions.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>
          </div>

          <Textarea
            id="address"
            label="Address"
            placeholder="House 12, Road 3, Section 10"
            value={form.address}
            onChange={handleChange("address")}
            error={errors.address}
          />
        </FormSection>

        <FormSection title="Photos">
          <MultiImageUpload target="properties" photos={photos} onChange={setPhotos} onBusyChange={setIsPhotoBusy} />
        </FormSection>

        <FormSection title="Receipt details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="receiptName"
              label="Name on receipt (optional)"
              placeholder="Owner name"
              value={form.receiptName}
              onChange={handleChange("receiptName")}
            />
            <Input
              id="receiptPhone"
              type="tel"
              inputMode="tel"
              label="Phone on receipt (optional)"
              placeholder="01XXXXXXXXX"
              value={form.receiptPhone}
              onChange={handleChange("receiptPhone")}
            />
          </div>
          <p className="text-sm text-muted">রসিদ ও বিলে ভাড়াটিয়া এই নাম ও ফোন দেখবেন। খালি রাখলে আপনার account-এর নাম ও ফোন বসবে।</p>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPhotoBusy} isLoading={isCreating || isUpdating}>
            {isEdit ? "Save Changes" : "Add House"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PropertyFormModal;
