"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ContractFields, { PrivatePhotos } from "./ContractFields";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { BUSINESS_TYPE_OPTIONS, contractBody, contractFromTenancy, validateContract } from "@/lib/marketOptions";
import { useUpdateTenancyMutation } from "@/redux/features/tenancy/tenancyApi";

const MAX_FAMILY = 2;
const PHONE_REGEX = /^01\d{9}$/;
const cleanPhone = (value) => value.replace(/[\s-]/g, "").replace(/^\+?88/, "");

// ব্যবসা, পরিবার ও চুক্তি — এক জায়গায় বদলানো; ভাড়া বদলালে পরের বিল থেকে কার্যকর
const EditContractModal = ({ tenancy, onClose }) => {
  const { market } = tenancy;
  const [business, setBusiness] = useState({
    businessName: market.businessName,
    businessType: market.businessType,
    businessTypeOther: market.businessTypeOther,
    tradeLicense: market.tradeLicense,
    tradeLicensePhoto: market.tradeLicensePhoto ? [market.tradeLicensePhoto] : [],
  });
  const [family, setFamily] = useState(market.family ?? []);
  const [contract, setContract] = useState(contractFromTenancy(tenancy));
  const [errors, setErrors] = useState({});
  const [updateTenancy, { isLoading }] = useUpdateTenancyMutation();

  const changeBusiness = (field) => (e) => setBusiness((prev) => ({ ...prev, [field]: e.target.value }));
  const changeFamily = (index, field) => (e) => setFamily((prev) => prev.map((member, i) => (i === index ? { ...member, [field]: e.target.value } : member)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = { ...validateContract(contract) };
    if (!business.businessName.trim()) next.businessName = "ব্যবসা বা দোকানের নাম লিখুন";
    if (family.some(({ name, relation, phone }) => !name.trim() || !relation.trim() || !PHONE_REGEX.test(cleanPhone(phone)))) next.family = "পরিবারের প্রত্যেকের নাম, সম্পর্ক ও মোবাইল নম্বর দিন";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("লাল ঘরগুলো ঠিক করে দিন");
      return;
    }

    const body = contractBody(contract);
    const [photo] = business.tradeLicensePhoto;
    body.market = {
      ...body.market,
      businessName: business.businessName.trim(),
      businessType: business.businessType,
      businessTypeOther: business.businessTypeOther.trim(),
      tradeLicense: business.tradeLicense.trim(),
      tradeLicensePhoto: photo ? { publicId: photo.publicId, format: photo.format, version: photo.version, signature: photo.signature } : null,
      family: family.map(({ name, relation, phone }) => ({ name: name.trim(), relation: relation.trim(), phone: phone.trim() })),
    };

    try {
      await updateTenancy({ id: tenancy._id, ...body }).unwrap();
      toast.success("চুক্তি সেভ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="চুক্তি Edit" onClose={onClose} size="lg">
      <form data-edit-contract onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="ব্যবসা">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="editBusinessName" label="ব্যবসা / দোকানের নাম" value={business.businessName} onChange={changeBusiness("businessName")} error={errors.businessName} />
            <Select id="editBusinessType" label="ব্যবসার ধরন" placeholder="বেছে নিন" options={BUSINESS_TYPE_OPTIONS} value={business.businessType} onChange={changeBusiness("businessType")} />
            {business.businessType === "Other" && <Input id="editBusinessTypeOther" label="কী ব্যবসা" value={business.businessTypeOther} onChange={changeBusiness("businessTypeOther")} />}
            <Input id="editTradeLicense" label="Trade License নম্বর" value={business.tradeLicense} onChange={changeBusiness("tradeLicense")} />
          </div>
          <PrivatePhotos id="tradeLicense" label="Trade License এর ছবি" max={1} photos={business.tradeLicensePhoto} onChange={(tradeLicensePhoto) => setBusiness((prev) => ({ ...prev, tradeLicensePhoto }))} />
        </FormSection>

        <FormSection title="পরিবারের সদস্য">
          {family.map((member, index) => (
            <div key={index} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Input id={`editFamilyName-${index}`} label="নাম" value={member.name} onChange={changeFamily(index, "name")} />
              <Input id={`editFamilyRelation-${index}`} label="সম্পর্ক" value={member.relation} onChange={changeFamily(index, "relation")} />
              <Input id={`editFamilyPhone-${index}`} type="tel" inputMode="tel" label="মোবাইল" value={member.phone} onChange={changeFamily(index, "phone")} />
              <button type="button" aria-label={`Remove family member ${index + 1}`} onClick={() => setFamily((prev) => prev.filter((_, i) => i !== index))} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {errors.family && <p className="text-sm text-danger">{errors.family}</p>}
          {family.length < MAX_FAMILY && (
            <Button variant="outline" size="sm" onClick={() => setFamily((prev) => [...prev, { name: "", relation: "", phone: "" }])} className="w-fit">
              <Plus className="h-4 w-4" aria-hidden="true" />
              সদস্য যোগ
            </Button>
          )}
        </FormSection>

        <ContractFields value={contract} onChange={setContract} errors={errors} />
        <p className="text-xs text-muted">ভাড়া বা সার্ভিস চার্জ বদলালে পরের বিল থেকে কার্যকর হবে, আগের বিল বদলাবে না।</p>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditContractModal;
