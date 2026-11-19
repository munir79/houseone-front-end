"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { RENEW_OPTIONS } from "@/lib/marketOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { useRenewContractMutation } from "@/redux/features/tenancy/tenancyApi";

const endAfter = (end, months) => {
  const date = new Date(end);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
};

// এখনকার শেষ তারিখ থেকে আরও কিছু বছর — ভাড়া বাড়ানো আলাদা, বৃদ্ধির নিয়মে
const RenewContractModal = ({ tenancy, onClose }) => {
  const [months, setMonths] = useState("12");
  const [renew, { isLoading }] = useRenewContractMutation();
  const end = tenancy.market.contractEnd;

  const handleRenew = async () => {
    try {
      await renew({ id: tenancy._id, months: Number(months) }).unwrap();
      toast.success("চুক্তি নবায়ন হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "নবায়ন হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="চুক্তি নবায়ন" onClose={onClose}>
      <div data-renew className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {tenancy.market.businessName} · {tenancy.unitName} · এখনকার চুক্তি শেষ {formatDate(end)}
        </p>
        <Select id="renewMonths" label="আরও কত দিনের জন্য" options={RENEW_OPTIONS} value={months} onChange={(e) => setMonths(e.target.value)} />
        <p className="rounded-xl bg-primary-soft px-3 py-2 text-sm">নতুন শেষ তারিখ: {formatDate(endAfter(end, Number(months)))}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} onClick={handleRenew}>
            নবায়ন করুন
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RenewContractModal;
