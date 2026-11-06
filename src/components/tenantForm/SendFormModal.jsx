"use client";

import { useState } from "react";
import { toast } from "sonner";
import ShareForm from "./ShareForm";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { FORM_TYPES, MAIN_COUNT_OPTIONS } from "@/lib/tenantFormOptions";
import { useCreateTenantFormMutation, useGetFormSettingsQuery } from "@/redux/features/tenantForm/tenantFormApi";

const SendFormModal = ({ unit, onClose }) => {
  const [occupantType, setOccupantType] = useState("Family");
  const [limits, setLimits] = useState({});
  const [form, setForm] = useState(null);

  const { data } = useGetFormSettingsQuery(unit.property._id);
  const [createForm, { isLoading }] = useCreateTenantFormMutation();

  // ধরন বদলালে বাড়ির সেটিং আসে, ফ্ল্যাটের নিজের সংখ্যা থাকলে সেটাই
  const config = data?.data?.[occupantType];
  const maxMembers = limits.maxMembers ?? unit.maxPeople ?? config?.maxMembers ?? "";
  const mainCount = limits.mainCount ?? config?.mainCount ?? 2;

  const handleCreate = async () => {
    const max = Number(maxMembers);
    if (!max || max < Number(mainCount)) {
      toast.error("সর্বোচ্চ সদস্য সংখ্যা ঠিক করে লিখুন");
      return;
    }

    try {
      const response = await createForm({ unitId: unit._id, occupantType, maxMembers: max, mainCount: Number(mainCount) }).unwrap();
      setForm(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "লিংক তৈরি হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={`Send Form for ${unit.name}`} onClose={onClose}>
      {form ? (
        <ShareForm form={form} />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">ভাড়াটিয়া নিজের মোবাইলে তথ্য দেবেন। আপনি দেখে Approve করলে সব তথ্য এই ইউনিটে বসে যাবে।</p>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Tenant type</p>
            <div>
              <SegmentedControl
                label="Tenant type"
                options={FORM_TYPES}
                value={occupantType}
                onChange={(next) => {
                  setOccupantType(next);
                  setLimits(({ maxMembers: keep }) => (keep === undefined ? {} : { maxMembers: keep }));
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="sendMax"
              type="number"
              inputMode="numeric"
              min="1"
              max="30"
              label="Maximum people"
              value={maxMembers}
              onChange={(e) => setLimits((prev) => ({ ...prev, maxMembers: e.target.value }))}
            />
            <Select
              id="sendMain"
              label="প্রধান দায়িত্বশীল"
              options={MAIN_COUNT_OPTIONS}
              value={String(mainCount)}
              onChange={(e) => setLimits((prev) => ({ ...prev, mainCount: e.target.value }))}
            />
          </div>
          <p className="text-xs text-muted">এই সংখ্যাটি এই ইউনিটের জন্য মনে রাখা হবে।</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isLoading} onClick={handleCreate}>
              Create Link
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SendFormModal;
