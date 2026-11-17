"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import TermsEditor from "./TermsEditor";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { FORM_TYPES } from "@/lib/tenantFormOptions";
import { useGetFormSettingsQuery, useUpdateFormSettingsMutation } from "@/redux/features/tenantForm/tenantFormApi";

const ChargesEditor = ({ propertyId, initial, initialType }) => {
  const [types, setTypes] = useState(initial);
  const [type, setType] = useState(initialType);
  const [updateSettings, { isLoading }] = useUpdateFormSettingsMutation();

  const handleSave = async () => {
    const invalidType = FORM_TYPES.find((item) => types[item].advanceMonths === "" || types[item].charges.some(({ name, amount }) => !name.trim() || amount === ""));
    if (invalidType) {
      setType(invalidType);
      toast.error(`${invalidType}: Advance-এর মাস দিন, আর প্রতিটি চার্জের নাম ও টাকা লিখুন`);
      return;
    }

    try {
      await updateSettings({ propertyId, types }).unwrap();
      toast.success("চার্জ সেভ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Card flush className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3 sm:p-4">
        <SegmentedControl label="Tenant type" options={FORM_TYPES} value={type} onChange={setType} />
        <Button size="sm" isLoading={isLoading} onClick={handleSave}>
          Save Charges
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <p className="text-sm text-muted">এই বাড়ির সব ফ্ল্যাটে এই হিসাব বসবে। কোনো ফ্ল্যাট আলাদা হলে Send Form-এর সময় বদলান, সেটা ওই ফ্ল্যাটের জন্য মনে থাকবে।</p>
        <TermsEditor value={types[type]} onChange={(next) => setTypes((prev) => ({ ...prev, [type]: next }))} />
      </div>
    </Card>
  );
};

const ChargesPanel = ({ propertyId }) => {
  const { data, isFetching } = useGetFormSettingsQuery(propertyId);

  // Send Form থেকে এলে যে ধরনের চার্জ বাকি, সেটাই খোলে
  const requestedType = useSearchParams().get("type");
  const initialType = FORM_TYPES.includes(requestedType) ? requestedType : FORM_TYPES[0];

  if (isFetching || !data) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return <ChargesEditor propertyId={propertyId} initial={data.data} initialType={initialType} />;
};

export default ChargesPanel;
