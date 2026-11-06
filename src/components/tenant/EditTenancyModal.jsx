"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { OCCUPANT_TYPE_OPTIONS, RENT_DAY_OPTIONS, toDateInput } from "@/lib/tenancyOptions";
import { useUpdateTenancyMutation, useUpdateTenantMutation } from "@/redux/features/tenancy/tenancyApi";

// ভাড়াটিয়ার তথ্য ও ভাড়ার তথ্য — সবই পরে বদলানো যায়
const EditTenancyModal = ({ tenancy, onClose }) => {
  const { tenant } = tenancy;

  const [person, setPerson] = useState({
    name: tenant.name,
    phone: tenant.phone,
    email: tenant.email,
    occupation: tenant.occupation,
    permanentAddress: tenant.permanentAddress,
    emergencyName: tenant.emergencyName,
    emergencyPhone: tenant.emergencyPhone,
  });
  const [nid, setNid] = useState("");
  const [rental, setRental] = useState({
    occupantType: tenancy.occupantType,
    startDate: toDateInput(tenancy.startDate),
    rent: String(tenancy.rent),
    advance: String(tenancy.advance),
    dueDay: String(tenancy.dueDay),
    hasSublet: tenancy.hasSublet,
    subletNote: tenancy.subletNote,
    subletPeople: String(tenancy.subletPeople),
    note: tenancy.note,
  });
  const [errors, setErrors] = useState({});

  const [updateTenant, { isLoading: isSavingTenant }] = useUpdateTenantMutation();
  const [updateTenancy, { isLoading: isSavingTenancy }] = useUpdateTenancyMutation();

  const clearError = (field) => setErrors(({ [field]: removed, ...rest }) => rest);

  const changePerson = (field) => (e) => {
    setPerson((prev) => ({ ...prev, [field]: e.target.value }));
    clearError(field);
  };

  const changeRental = (field) => (e) => {
    setRental((prev) => ({ ...prev, [field]: e.target.value }));
    clearError(field);
  };

  const validate = () => {
    const newErrors = {};
    if (!person.name.trim()) newErrors.name = "ভাড়াটিয়ার নাম লিখুন";
    if (!person.phone.trim()) newErrors.phone = "মোবাইল নম্বর লিখুন";
    if (rental.rent === "") newErrors.rent = "মাসিক ভাড়া লিখুন";
    if (!rental.startDate) newErrors.startDate = "ওঠার তারিখ দিন";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await updateTenant({ id: tenant._id, ...person, ...(nid.trim() ? { nid } : {}) }).unwrap();
      await updateTenancy({ id: tenancy._id, ...rental, dueDay: Number(rental.dueDay) }).unwrap();

      toast.success("তথ্য সেভ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "তথ্য সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Edit Tenant" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Tenant">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="tenantName" label="Full name" value={person.name} onChange={changePerson("name")} error={errors.name} />
            <Input id="tenantPhone" type="tel" inputMode="tel" label="Mobile number" value={person.phone} onChange={changePerson("phone")} error={errors.phone} />
            <Input id="tenantEmail" type="email" label="Email (optional)" value={person.email} onChange={changePerson("email")} />
            <Input id="tenantOccupation" label="Occupation (optional)" value={person.occupation} onChange={changePerson("occupation")} />
            <Input id="tenantAddress" label="Permanent address (optional)" value={person.permanentAddress} onChange={changePerson("permanentAddress")} />
            <Input
              id="tenantNid"
              inputMode="numeric"
              autoComplete="off"
              label="NID number"
              placeholder={tenant.nidLast4 ? `শেষ ৪ সংখ্যা ${tenant.nidLast4}, বদলাতে নতুন লিখুন` : "১০ থেকে ১৭ সংখ্যা"}
              value={nid}
              onChange={(e) => setNid(e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection title="Emergency contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="emergencyName" label="Name (optional)" value={person.emergencyName} onChange={changePerson("emergencyName")} />
            <Input id="emergencyPhone" type="tel" inputMode="tel" label="Mobile (optional)" value={person.emergencyPhone} onChange={changePerson("emergencyPhone")} />
          </div>
        </FormSection>

        <FormSection title="Rent details">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Select id="occupantType" label="Tenant type" options={OCCUPANT_TYPE_OPTIONS} value={rental.occupantType} onChange={changeRental("occupantType")} />
            <Input id="startDate" type="date" label="Move-in date" value={rental.startDate} onChange={changeRental("startDate")} error={errors.startDate} />
            <Select id="dueDay" label="Rent day" options={RENT_DAY_OPTIONS} value={rental.dueDay} onChange={changeRental("dueDay")} />
            <Input id="tenancyRent" type="number" inputMode="numeric" min="0" label="Monthly rent (৳)" value={rental.rent} onChange={changeRental("rent")} error={errors.rent} />
            <Input id="tenancyAdvance" type="number" inputMode="numeric" min="0" label="Advance (৳)" value={rental.advance} onChange={changeRental("advance")} />
          </div>
        </FormSection>

        <FormSection title="Sublet">
          <Checkbox
            id="hasSublet"
            label="এই ফ্ল্যাটে সাবলেট আছে"
            checked={rental.hasSublet}
            onChange={(e) => setRental((prev) => ({ ...prev, hasSublet: e.target.checked }))}
          />
          {rental.hasSublet && (
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <Input id="subletNote" label="Note" placeholder="যেমন: এক রুমে আরেকটি পরিবার" value={rental.subletNote} onChange={changeRental("subletNote")} />
              <Input id="subletPeople" type="number" inputMode="numeric" min="0" label="People" value={rental.subletPeople} onChange={changeRental("subletPeople")} />
            </div>
          )}
        </FormSection>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSavingTenant || isSavingTenancy}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTenancyModal;
