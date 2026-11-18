"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { LIVING_LAYOUT_OPTIONS, PREFERRED_TENANT_OPTIONS, SHOP_TYPE_OPTIONS, UNIT_STATUS_OPTIONS, UNIT_TYPE_OPTIONS, floorOptions } from "@/lib/unitOptions";
import { useCreateUnitMutation, useUpdateUnitMutation } from "@/redux/features/unit/unitApi";

const toText = (value) => (value === null || value === undefined ? "" : String(value));

// unit না দিলে নতুন ইউনিট, দিলে Edit — সব ঘর পরে বদলানো যায়
// isMarket — মার্কেটের দোকান: বেসমেন্ট, ব্লক, সার্ভিস চার্জ; বাসার ঘর (রুম, গ্যাস …) নেই
const UnitFormModal = ({ propertyId, totalFloors, unit, onClose, isMarket = false, basements = 0, blocks = [] }) => {
  const isEdit = Boolean(unit);

  const [form, setForm] = useState({
    name: unit?.name || "",
    floor: toText(unit?.floor),
    type: unit?.type || (isMarket ? "Shop" : "Flat"),
    block: unit?.block || "",
    serviceCharge: toText(unit?.serviceCharge),
    status: unit?.status || "Vacant",
    preferredTenant: unit?.preferredTenant || "Any",
    rent: toText(unit?.rent),
    bedrooms: toText(unit?.bedrooms),
    bathrooms: toText(unit?.bathrooms),
    balconies: toText(unit?.balconies),
    livingLayout: unit?.livingLayout || "",
    sizeSqft: toText(unit?.sizeSqft),
    maxPeople: toText(unit?.maxPeople),
    availableFrom: unit?.availableFrom?.slice(0, 10) || "",
    electricityMeter: unit?.electricityMeter || "",
    gasInfo: unit?.gasInfo || "",
    note: unit?.note || "",
  });
  const [errors, setErrors] = useState({});
  const [photos, setPhotos] = useState(unit?.photos || []);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);

  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: isUpdating }] = useUpdateUnitMutation();

  // লেখা শুরু করলেই সেই ঘরের Error চলে যায়
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors(({ [field]: removed, ...rest }) => rest);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = isMarket ? "দোকান নম্বর লিখুন" : "ইউনিটের নাম লিখুন";
    if (form.floor === "") newErrors.floor = "তলা বেছে নিন";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // মার্কেটে শুধু দোকানের ঘর যায়; বাসায় ব্লক বা সার্ভিস চার্জ নেই
    const { block, serviceCharge, ...houseFields } = form;
    const fields = isMarket
      ? { name: form.name, type: form.type, status: form.status, rent: form.rent, sizeSqft: form.sizeSqft, electricityMeter: form.electricityMeter, note: form.note, block, serviceCharge }
      : houseFields;
    const body = {
      ...fields,
      floor: Number(form.floor),
      availableFrom: form.availableFrom || null,
      photos: photos.map(({ publicId, version, signature }) => ({ publicId, version, signature })),
    };

    try {
      const response = isEdit
        ? await updateUnit({ id: unit._id, ...body }).unwrap()
        : await createUnit({ propertyId, ...body }).unwrap();

      toast.success(response.message);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, isMarket ? "দোকান সেভ হয়নি। আবার চেষ্টা করুন।" : "ইউনিট সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={isMarket ? (isEdit ? "দোকান বদলান" : "দোকান যোগ করুন") : isEdit ? "Edit Unit" : "Add Unit"} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Basic information">
          <Input
            id="unitName"
            label="Unit name"
            placeholder="3rd Floor - B"
            value={form.name}
            onChange={handleChange("name")}
            error={errors.name}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              id="unitFloor"
              label="Floor"
              placeholder="তলা বেছে নিন"
              options={floorOptions(totalFloors, isMarket ? basements : 0)}
              value={form.floor}
              onChange={handleChange("floor")}
              error={errors.floor}
            />
            <Select id="unitType" label="Type" options={isMarket ? SHOP_TYPE_OPTIONS : UNIT_TYPE_OPTIONS} value={form.type} onChange={handleChange("type")} />
            {isMarket && blocks.length > 0 && (
              <Select id="unitBlock" label="ব্লক বা লাইন" options={[{ value: "", label: "ব্লক ছাড়া" }, ...blocks.map((value) => ({ value, label: `ব্লক ${value}` }))]} value={form.block} onChange={handleChange("block")} />
            )}
            <Select id="unitStatus" label="Status" options={UNIT_STATUS_OPTIONS} value={form.status} onChange={handleChange("status")} />
          </div>
        </FormSection>

        <FormSection title="Rent and size">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              id="unitRent"
              type="number"
              inputMode="numeric"
              min="0"
              label="Rent (৳)"
              placeholder="20000"
              value={form.rent}
              onChange={handleChange("rent")}
            />
            {!isMarket && (
              <>
                <Input
                  id="unitBedrooms"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  label="Bedrooms"
                  placeholder="3"
                  value={form.bedrooms}
                  onChange={handleChange("bedrooms")}
                />
                <Input
                  id="unitBathrooms"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  label="Bathrooms"
                  placeholder="2"
                  value={form.bathrooms}
                  onChange={handleChange("bathrooms")}
                />
                <Input
                  id="unitBalconies"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  label="Balconies"
                  placeholder="2"
                  value={form.balconies}
                  onChange={handleChange("balconies")}
                />
                <Select id="unitLayout" label="Drawing & dining" options={LIVING_LAYOUT_OPTIONS} value={form.livingLayout} onChange={handleChange("livingLayout")} />
              </>
            )}
            <Input
              id="unitSize"
              type="number"
              inputMode="numeric"
              min="0"
              label="Size (sq ft)"
              placeholder="1200"
              value={form.sizeSqft}
              onChange={handleChange("sizeSqft")}
            />
            {isMarket ? (
              <Input id="unitServiceCharge" type="number" inputMode="numeric" min="0" label="সার্ভিস চার্জ (৳)" placeholder="1500" value={form.serviceCharge} onChange={handleChange("serviceCharge")} />
            ) : (
              <Input
                id="unitMaxPeople"
                type="number"
                inputMode="numeric"
                min="1"
                max="30"
                label="Maximum people"
                placeholder="বাড়ির সেটিং"
                value={form.maxPeople}
                onChange={handleChange("maxPeople")}
              />
            )}
          </div>
        </FormSection>

        <FormSection title="Photos">
          <MultiImageUpload target="units" photos={photos} onChange={setPhotos} onBusyChange={setIsPhotoBusy} />
        </FormSection>

        <FormSection title="More details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="unitAvailable"
              type="date"
              label="Available from (optional)"
              value={form.availableFrom}
              onChange={handleChange("availableFrom")}
            />
            {!isMarket && (
              <Select
                id="unitPreferred"
                label="Prefer to rent to"
                options={PREFERRED_TENANT_OPTIONS}
                value={form.preferredTenant}
                onChange={handleChange("preferredTenant")}
              />
            )}
            <Input
              id="unitMeter"
              label="Electricity meter (optional)"
              placeholder="মিটার নম্বর"
              value={form.electricityMeter}
              onChange={handleChange("electricityMeter")}
            />
            {!isMarket && (
              <Input
                id="unitGas"
                label="Gas details (optional)"
                placeholder="লাইন না সিলিন্ডার"
                value={form.gasInfo}
                onChange={handleChange("gasInfo")}
              />
            )}
            <Input id="unitNote" label="Note (optional)" placeholder="মনে রাখার মতো কিছু" value={form.note} onChange={handleChange("note")} />
          </div>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPhotoBusy} isLoading={isCreating || isUpdating}>
            {isEdit ? "Save Changes" : isMarket ? "দোকান যোগ করুন" : "Add Unit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UnitFormModal;
