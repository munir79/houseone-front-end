"use client";

import { useState } from "react";
import { toast } from "sonner";
import ImageSlot from "@/components/tenantForm/ImageSlot";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { GENDERS } from "@/lib/tenantFormOptions";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";
import { useAddMemberMutation, useUpdateMemberMutation } from "@/redux/features/tenancy/tenancyApi";

const GENDER_OPTIONS = [{ value: "", label: "Not set" }, ...GENDERS];

// নতুন সদস্য এলে বা তথ্য বদলালে — ভাড়াটিয়া থাকা অবস্থাতেই
const MemberFormModal = ({ tenancyId, member, onClose }) => {
  const [values, setValues] = useState({
    name: member?.name || "",
    relation: member?.relation || "",
    phone: member?.phone || "",
    gender: member?.gender || "",
    age: member?.age ?? "",
    occupation: member?.occupation || "",
    workplace: member?.workplace || "",
    permanentAddress: member?.permanentAddress || "",
    previousAddress: member?.previousAddress || "",
    isMain: member?.isMain || false,
  });
  const [nid, setNid] = useState("");
  const [front, setFront] = useState(member?.documents?.[0] || null);
  const [back, setBack] = useState(member?.documents?.[1] || null);
  const [photo, setPhoto] = useState(member?.photo || null);
  const [nameError, setNameError] = useState("");

  const [getSignature] = useGetUploadSignatureMutation();
  const [addMember, { isLoading: isAdding }] = useAddMemberMutation();
  const [updateMember, { isLoading: isUpdating }] = useUpdateMemberMutation();

  const change = (key) => (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));
  const signature = async () => (await getSignature("nid").unwrap()).data;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setNameError("নাম লিখুন");
      return;
    }

    const body = { ...values, documents: [front, back].filter(Boolean), photo, ...(nid.trim() ? { nid } : {}) };

    try {
      if (member) await updateMember({ id: tenancyId, memberId: member._id, ...body }).unwrap();
      else await addMember({ id: tenancyId, ...body }).unwrap();

      toast.success("সদস্যের তথ্য সেভ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={member ? "Edit Member" : "Add Member"} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="memberName"
              label="Full name"
              value={values.name}
              onChange={(e) => {
                change("name")(e);
                setNameError("");
              }}
              error={nameError}
            />
            <Input id="memberRelation" label="Relation (optional)" placeholder="স্ত্রী, ছেলে, ভাই, বন্ধু" value={values.relation} onChange={change("relation")} />
            <Input id="memberPhone" type="tel" inputMode="tel" label="Mobile (optional)" placeholder="01XXXXXXXXX" value={values.phone} onChange={(e) => setValues((prev) => ({ ...prev, phone: toEnglishNumber(e.target.value) }))} />
            <Select id="memberGender" label="Gender (optional)" options={GENDER_OPTIONS} value={values.gender} onChange={change("gender")} />
            <Input id="memberAge" type="number" inputMode="numeric" min="0" max="120" label="Age (optional)" value={values.age} onChange={change("age")} />
            <Input id="memberOccupation" label="Occupation (optional)" value={values.occupation} onChange={change("occupation")} />
            <Input id="memberWorkplace" label="Workplace (optional)" value={values.workplace} onChange={change("workplace")} />
            <Input id="memberAddress" label="Permanent address (optional)" value={values.permanentAddress} onChange={change("permanentAddress")} />
            <Input id="memberPrevious" label="Previous address (optional)" value={values.previousAddress} onChange={change("previousAddress")} />
            <Input
              id="memberNid"
              inputMode="numeric"
              autoComplete="off"
              label="NID number (optional)"
              placeholder={member?.nidLast4 ? `শেষ ৪ সংখ্যা ${member.nidLast4}, বদলাতে নতুন লিখুন` : "১০ থেকে ১৭ সংখ্যা"}
              value={nid}
              onChange={(e) => setNid(toEnglishNumber(e.target.value))}
            />
          </div>
          <Checkbox
            id="memberMain"
            label="প্রধান দায়িত্বশীল"
            description="মূল ভাড়াটিয়া সহ সর্বোচ্চ ২ জন"
            checked={values.isMain}
            onChange={(e) => setValues((prev) => ({ ...prev, isMain: e.target.checked }))}
          />
        </FormSection>

        <FormSection title="Photos (private)">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ImageSlot id="memberFront" label="NID front" value={front} getSignature={signature} onChange={setFront} />
            <ImageSlot id="memberBack" label="NID back" value={back} getSignature={signature} onChange={setBack} />
            <ImageSlot id="memberPhoto" label="Photo" value={photo} getSignature={signature} onChange={setPhoto} />
          </div>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isAdding || isUpdating}>
            Save Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MemberFormModal;
