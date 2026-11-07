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
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useGetLocationsQuery } from "@/redux/features/location/locationApi";
import { useCreatePropertyMutation, useUpdatePropertyMutation } from "@/redux/features/property/propertyApi";

const OTHER_AREA = "__other";

const toLocationValue = (location) =>
  location ? { lat: location.coordinates[1], lng: location.coordinates[0], label: location.label } : null;

// property না দিলে নতুন বাড়ি, দিলে Edit
const PropertyFormModal = ({ property, onClose, onSaved }) => {
  const isEdit = Boolean(property);

  const [form, setForm] = useState({
    name: property?.name || "",
    city: property?.city || "",
    area: property?.area || "",
    customArea: "",
    address: property?.address || "",
    totalFloors: property?.totalFloors?.toString() || "",
    receiptName: property?.receiptName || "",
    receiptPhone: property?.receiptPhone || "",
  });
  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState(toLocationValue(property?.location));
  const [photos, setPhotos] = useState(property?.photos || []);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);

  const { data: locationsData } = useGetLocationsQuery();
  const [createProperty, { isLoading: isCreating }] = useCreatePropertyMutation();
  const [updateProperty, { isLoading: isUpdating }] = useUpdatePropertyMutation();

  const locations = locationsData?.data || [];
  const cityOptions = locations.map(({ city }) => ({ value: city, label: city }));
  const cityAreas = locations.find(({ city }) => city === form.city)?.areas || [];
  const areaOptions = [...cityAreas.map((area) => ({ value: area, label: area })), { value: OTHER_AREA, label: "Other area" }];

  // তালিকায় নেই এমন এলাকা Edit করলে Other এ দেখায়
  const isCustomSavedArea = Boolean(form.city && form.area && form.area !== OTHER_AREA && locations.length && !cityAreas.includes(form.area));
  const selectedArea = isCustomSavedArea ? OTHER_AREA : form.area;
  const customAreaValue = isCustomSavedArea ? form.area : form.customArea;

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

  const handleCityChange = (e) => {
    setForm((prev) => ({ ...prev, city: e.target.value, area: "", customArea: "" }));
    clearError("city", "area");
  };

  const handleCustomArea = (e) => {
    const { value } = e.target;
    setForm((prev) => (isCustomSavedArea ? { ...prev, area: value } : { ...prev, customArea: value }));
    clearError("area");
  };

  const finalArea = selectedArea === OTHER_AREA ? customAreaValue.trim() : selectedArea;

  const validate = () => {
    const newErrors = {};
    const floors = Number(form.totalFloors);

    if (!form.name.trim()) newErrors.name = "বাড়ির নাম লিখুন";
    if (!form.city) newErrors.city = "শহর বেছে নিন";
    if (!finalArea) newErrors.area = "এলাকা বেছে নিন বা লিখুন";
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
      location: location ? { lat: location.lat, lng: location.lng, label: location.label } : null,
      photos: photos.map(({ publicId, version, signature }) => ({ publicId, version, signature })),
    };

    if (!isEdit && !body.location) delete body.location;

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
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="city"
              label="City"
              placeholder="শহর বেছে নিন"
              options={cityOptions}
              value={form.city}
              onChange={handleCityChange}
              error={errors.city}
            />
            <Select
              id="area"
              label="Area"
              placeholder={form.city ? "এলাকা বেছে নিন" : "আগে শহর বেছে নিন"}
              options={form.city ? areaOptions : []}
              disabled={!form.city}
              value={selectedArea}
              onChange={handleChange("area")}
              error={selectedArea === OTHER_AREA ? undefined : errors.area}
            />
          </div>

          {selectedArea === OTHER_AREA && (
            <Input
              id="customArea"
              label="Area name"
              placeholder="আপনার এলাকার নাম লিখুন"
              value={customAreaValue}
              onChange={handleCustomArea}
              error={errors.area}
            />
          )}

          <Textarea
            id="address"
            label="Address"
            placeholder="House 12, Road 3, Section 10"
            value={form.address}
            onChange={handleChange("address")}
            error={errors.address}
          />

          <LocationSearch value={location} onChange={setLocation} />
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
