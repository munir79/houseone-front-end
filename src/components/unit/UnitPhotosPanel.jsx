"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useUpdateUnitMutation } from "@/redux/features/unit/unitApi";

// Edit এ না গিয়ে এখানেই ফ্ল্যাটের ছবি — প্রথম ছবিটাই Cover
const UnitPhotosPanel = ({ unit }) => {
  const [photos, setPhotos] = useState(unit.photos || []);
  const [isBusy, setIsBusy] = useState(false);
  const [updateUnit, { isLoading }] = useUpdateUnitMutation();

  const hasChanged = JSON.stringify(photos.map(({ publicId }) => publicId)) !== JSON.stringify((unit.photos || []).map(({ publicId }) => publicId));

  const handleSave = async () => {
    try {
      await updateUnit({ id: unit._id, photos: photos.map(({ publicId, version, signature }) => ({ publicId, version, signature })) }).unwrap();
      toast.success("ছবি সেভ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-bold">Photos</h2>
        <p className="text-sm text-muted">সর্বোচ্চ ৫টি ছবি। প্রথম ছবিটি কভার হবে।</p>
      </div>
      <MultiImageUpload target="units" photos={photos} onChange={setPhotos} onBusyChange={setIsBusy} />
      {hasChanged && (
        <Button isLoading={isLoading} disabled={isBusy} onClick={handleSave} className="w-fit">
          Save Photos
        </Button>
      )}
    </Card>
  );
};

export default UnitPhotosPanel;
