"use client";

import { useState } from "react";
import { toast } from "sonner";
import LocationSearch from "./LocationSearch";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { DISTRICT_OPTIONS } from "@/lib/districts";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { floorOptions } from "@/lib/unitOptions";
import { useGetLocationsQuery } from "@/redux/features/location/locationApi";
import { useCreateFlatWithBuildingMutation } from "@/redux/features/unit/unitApi";

const MAX_FLOORS = 200;
const FLAT_TYPES = [
  { value: "Flat", label: "ফ্ল্যাট" },
  { value: "Shop", label: "দোকান" },
  { value: "Office", label: "অফিস" },
  { value: "Room", label: "রুম" },
];
const digits = (value) => toEnglishNumber(value).replace(/\D/g, "");

// অন্যের বা সোসাইটির বিল্ডিংয়ে আমার ফ্ল্যাট — এক পাতায় বিল্ডিং আর ফ্ল্যাট একসাথে
const FlatFormModal = ({ onClose, onSaved, isShared = false }) => {
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({ name: "", city: "", area: "", address: "", totalFloors: "", unitName: "", floor: "", type: "Flat", rent: "", bedrooms: "", bathrooms: "" });
  const [errors, setErrors] = useState({});
  const { data: locationsData } = useGetLocationsQuery();
  const [createFlat, { isLoading }] = useCreateFlatWithBuildingMutation();

  const areaSuggestions = (locationsData?.data || []).find(({ city }) => city === form.city)?.areas || [];
  const totalFloors = Number(form.totalFloors);
  const isLiving = form.type === "Flat" || form.type === "Room";

  const change = (field, clean) => (event) => {
    const value = clean ? clean(event.target.value) : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ম্যাপে জায়গা বাছলে জেলা ও এলাকা নিজে থেকে — পরে বদলানো যায়
  const handleLocation = (place) => {
    setLocation(place && { ...place, locality: place.area });
    // জেলা ও এলাকাও ভরে যায় — সেগুলোর আগের ভুলও সরে
    setErrors((prev) => ({ ...prev, location: undefined, ...(place ? { city: undefined, area: undefined } : {}) }));
    if (place) setForm((prev) => ({ ...prev, city: place.district || prev.city, area: place.area || prev.area }));
  };

  const validate = () => {
    const next = {};
    if (!location) next.location = "ম্যাপে বিল্ডিংয়ের লোকেশন দিন — নাম লিখে খুঁজুন বা পাশের বোতামে নিজের লোকেশন";
    if (!form.city) next.city = "জেলা বেছে নিন";
    if (!form.area.trim()) next.area = "এলাকার নাম লিখুন";
    if (!form.name.trim()) next.name = "বিল্ডিংয়ের নাম লিখুন";
    if (!(totalFloors >= 1 && totalFloors <= MAX_FLOORS)) next.totalFloors = "১ থেকে ২০০ তলার মধ্যে লিখুন";
    if (!form.unitName.trim()) next.unitName = "ফ্ল্যাটের নাম লিখুন, যেমন 5B";
    if (form.floor === "") next.floor = "কোন তলা বাছুন";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const number = (value) => (value === "" ? undefined : Number(value));
    try {
      const response = await createFlat({
        name: form.name.trim(),
        city: form.city,
        area: form.area.trim(),
        address: form.address.trim() || form.name.trim(),
        totalFloors,
        isShared,
        location: { lat: location.lat, lng: location.lng, label: location.label, locality: location.locality },
        unit: {
          name: form.unitName.trim(),
          floor: Number(form.floor),
          type: form.type,
          rent: number(form.rent),
          ...(isLiving ? { bedrooms: number(form.bedrooms), bathrooms: number(form.bathrooms) } : {}),
        },
      }).unwrap();
      toast.success("ফ্ল্যাট যোগ হয়েছে");
      onSaved?.(response.data);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট" onClose={onClose} size="lg">
      <form data-flat-form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="বিল্ডিং কোথায়">
          <LocationSearch value={location} onChange={handleLocation} error={errors.location} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="flatCity" label="জেলা" placeholder="জেলা বেছে নিন" options={DISTRICT_OPTIONS} value={form.city} onChange={change("city")} error={errors.city} />
            <Input id="flatArea" label="এলাকা" placeholder="যেমন: Dhanmondi" list="flatAreaSuggestions" autoComplete="off" value={form.area} onChange={change("area")} error={errors.area} />
            <datalist id="flatAreaSuggestions">
              {areaSuggestions.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>
            <Input id="flatBuilding" label="বিল্ডিংয়ের নাম" placeholder="যেমন: Rose Garden" value={form.name} onChange={change("name")} error={errors.name} />
            <Input id="flatTotalFloors" inputMode="numeric" label="বিল্ডিংয়ে মোট তলা" placeholder="যেমন: 10" value={form.totalFloors} onChange={change("totalFloors", (value) => digits(value).slice(0, 3))} error={errors.totalFloors} />
          </div>
          <Textarea id="flatAddress" label="ঠিকানা (ঐচ্ছিক)" placeholder="যেমন: Road 5, House 12" value={form.address} onChange={change("address")} />
        </FormSection>

        <FormSection title="আমার ফ্ল্যাট">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="flatType" label="ধরন" options={FLAT_TYPES} value={form.type} onChange={change("type")} />
            <Input id="flatUnitName" label="ফ্ল্যাট / দোকানের নাম" placeholder="যেমন: 5B" value={form.unitName} onChange={change("unitName")} error={errors.unitName} />
            <Select
              id="flatFloor"
              label="কোন তলা"
              placeholder={totalFloors >= 1 ? "তলা বেছে নিন" : "আগে মোট তলা লিখুন"}
              options={totalFloors >= 1 && totalFloors <= MAX_FLOORS ? floorOptions(totalFloors) : []}
              disabled={!(totalFloors >= 1 && totalFloors <= MAX_FLOORS)}
              value={form.floor}
              onChange={change("floor")}
              error={errors.floor}
            />
            <Input id="flatRent" inputMode="numeric" label="মাসিক ভাড়া (ঐচ্ছিক)" placeholder="৳" value={form.rent} onChange={change("rent", digits)} />
            {isLiving && (
              <>
                <Input id="flatBedrooms" inputMode="numeric" label="রুম (ঐচ্ছিক)" value={form.bedrooms} onChange={change("bedrooms", (value) => digits(value).slice(0, 2))} />
                <Input id="flatBathrooms" inputMode="numeric" label="বাথরুম (ঐচ্ছিক)" value={form.bathrooms} onChange={change("bathrooms", (value) => digits(value).slice(0, 2))} />
              </>
            )}
          </div>
          <p className="text-xs text-muted">একই বিল্ডিংয়ে আরও ফ্ল্যাট থাকলে পরে বিল্ডিংয়ের পাতা থেকে যোগ করবেন।</p>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            ফ্ল্যাট যোগ করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FlatFormModal;
