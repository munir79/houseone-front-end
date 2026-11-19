"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ContractFields, { PrivatePhotos } from "./ContractFields";
import ReceiveToday, { receiptsBody, rentedMessage } from "./ReceiveToday";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { BUSINESS_TYPE_OPTIONS, contractBody, emptyContract, validateContract } from "@/lib/marketOptions";
import { todayInput } from "@/lib/tenancyOptions";
import { useCreateTenancyMutation } from "@/redux/features/tenancy/tenancyApi";

const MAX_FAMILY = 2;
const PHONE_REGEX = /^01\d{9}$/;
const cleanPhone = (value) => value.replace(/[\s-]/g, "").replace(/^\+?88/, "");

// মালিক নিজে ব্যবসায়ী যোগ করেন — ব্যবসা, মালিক, পরিবার, চুক্তি, আর আজ কী টাকা পেলেন
const AddBusinessmanModal = ({ unit, onClose }) => {
  const [business, setBusiness] = useState({ businessName: "", businessType: "", businessTypeOther: "", tradeLicense: "", tradeLicensePhoto: [] });
  const [person, setPerson] = useState({ name: "", phone: "", nid: "", permanentAddress: "" });
  const [family, setFamily] = useState([]);
  const [contract, setContract] = useState({ ...emptyContract(unit), startDate: todayInput() });
  const [received, setReceived] = useState({});
  const [method, setMethod] = useState("Cash");
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [createTenancy] = useCreateTenancyMutation();

  const changeBusiness = (field) => (e) => {
    setBusiness((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors(({ [field]: removed, ...rest }) => rest);
  };
  const changePerson = (field) => (e) => {
    setPerson((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors(({ [field]: removed, ...rest }) => rest);
  };
  const changeFamily = (index, field) => (e) => setFamily((prev) => prev.map((member, i) => (i === index ? { ...member, [field]: e.target.value } : member)));

  const validate = () => {
    const next = { ...validateContract(contract) };
    if (!business.businessName.trim()) next.businessName = "ব্যবসা বা দোকানের নাম লিখুন";
    if (business.businessType === "Other" && !business.businessTypeOther.trim()) next.businessTypeOther = "কী ব্যবসা, লিখুন";
    if (!person.name.trim()) next.name = "মালিকের নাম লিখুন";
    if (!PHONE_REGEX.test(cleanPhone(person.phone))) next.phone = "১১ সংখ্যার মোবাইল নম্বর লিখুন";
    if (family.some(({ name, relation, phone }) => !name.trim() || !relation.trim() || !PHONE_REGEX.test(cleanPhone(phone)))) next.family = "পরিবারের প্রত্যেকের নাম, সম্পর্ক ও মোবাইল নম্বর দিন";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("লাল ঘরগুলো ঠিক করে দিন");
      return;
    }

    const body = { ...contractBody(contract), ...receiptsBody({ contract, received, method }) };
    const [licencePhoto] = business.tradeLicensePhoto;
    body.unitId = unit._id;
    body.tenant = { name: person.name.trim(), phone: person.phone.trim(), permanentAddress: person.permanentAddress.trim(), tradeLicense: business.tradeLicense.trim(), companyName: business.businessName.trim(), ...(person.nid.trim() ? { nid: person.nid.trim() } : {}) };
    body.market = {
      ...body.market,
      businessName: business.businessName.trim(),
      businessType: business.businessType,
      businessTypeOther: business.businessTypeOther.trim(),
      tradeLicense: business.tradeLicense.trim(),
      ...(licencePhoto ? { tradeLicensePhoto: { publicId: licencePhoto.publicId, format: licencePhoto.format, version: licencePhoto.version, signature: licencePhoto.signature } } : {}),
      family: family.map(({ name, relation, phone }) => ({ name: name.trim(), relation: relation.trim(), phone: phone.trim() })),
    };

    setIsSaving(true);
    try {
      const { data: tenancy } = await createTenancy(body).unwrap();

      const message = rentedMessage(tenancy.receipts);
      toast[message.type](message.text);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "যোগ হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={`${unit.name} দোকান ভাড়া দিন`} onClose={onClose} size="lg">
      <form data-add-businessman onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="ব্যবসা">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="businessName" label="ব্যবসা / দোকানের নাম" placeholder="রহিম ফ্যাশন" value={business.businessName} onChange={changeBusiness("businessName")} error={errors.businessName} />
            <Select id="businessType" label="ব্যবসার ধরন" placeholder="বেছে নিন" options={BUSINESS_TYPE_OPTIONS} value={business.businessType} onChange={changeBusiness("businessType")} />
            {business.businessType === "Other" && (
              <Input id="businessTypeOther" label="কী ব্যবসা" placeholder="যেমন: মোবাইল সার্ভিসিং" value={business.businessTypeOther} onChange={changeBusiness("businessTypeOther")} error={errors.businessTypeOther} />
            )}
            <Input id="tradeLicense" label="Trade License নম্বর (ঐচ্ছিক)" value={business.tradeLicense} onChange={changeBusiness("tradeLicense")} />
          </div>
          <PrivatePhotos id="tradeLicense" label="Trade License এর ছবি (ঐচ্ছিক)" max={1} photos={business.tradeLicensePhoto} onChange={(tradeLicensePhoto) => setBusiness((prev) => ({ ...prev, tradeLicensePhoto }))} />
        </FormSection>

        <FormSection title="ব্যবসার মালিক">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="ownerName" label="পুরো নাম" placeholder="রহিম মিয়া" value={person.name} onChange={changePerson("name")} error={errors.name} />
            <Input id="ownerPhone" type="tel" inputMode="tel" label="মোবাইল" placeholder="01XXXXXXXXX" value={person.phone} onChange={changePerson("phone")} error={errors.phone} />
            <Input id="ownerNid" inputMode="numeric" autoComplete="off" label="NID নম্বর (ঐচ্ছিক)" placeholder="১০ থেকে ১৭ সংখ্যা" value={person.nid} onChange={changePerson("nid")} />
            <Input id="ownerAddress" label="ঠিকানা (ঐচ্ছিক)" value={person.permanentAddress} onChange={changePerson("permanentAddress")} />
          </div>
          <p className="text-xs text-muted">একই মোবাইলে আগে কোনো দোকান নিয়ে থাকলে তাঁর পাতায় সব দোকান একসাথে দেখাবে।</p>
        </FormSection>

        <FormSection title="পরিবারের সদস্য (দরকারে যোগাযোগ)">
          {family.map((member, index) => (
            <div key={index} data-family-row className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Input id={`familyName-${index}`} label="নাম" value={member.name} onChange={changeFamily(index, "name")} />
              <Input id={`familyRelation-${index}`} label="সম্পর্ক" placeholder="ভাই, ছেলে" value={member.relation} onChange={changeFamily(index, "relation")} />
              <Input id={`familyPhone-${index}`} type="tel" inputMode="tel" label="মোবাইল" value={member.phone} onChange={changeFamily(index, "phone")} />
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

        <ReceiveToday contract={contract} received={received} onReceivedChange={setReceived} method={method} onMethodChange={setMethod} />

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            দোকান ভাড়া দিন
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddBusinessmanModal;
