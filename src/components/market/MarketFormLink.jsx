"use client";

import { toast } from "sonner";
import { useState } from "react";
import ShareForm from "@/components/tenantForm/ShareForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useCreateTenantFormMutation } from "@/redux/features/tenantForm/tenantFormApi";

// ব্যবসায়ী নিজে তথ্য দেন — ব্যবসা, Trade License, NID, পরিবার; চুক্তি মালিক Approve এর সময় লেখেন
const MarketFormLink = ({ unit, onClose, onCreated }) => {
  const [form, setForm] = useState(null);
  const [createForm, { isLoading }] = useCreateTenantFormMutation();

  const handleCreate = async () => {
    try {
      const response = await createForm({ unitId: unit._id, occupantType: "Shop" }).unwrap();
      onCreated?.();
      setForm(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "লিংক তৈরি হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={`${unit.name} দোকানের ফর্ম`} onClose={onClose} size="lg">
      {form ? (
        <ShareForm form={form} message={`${form.propertyName}, ${form.unitName} দোকানের ব্যবসায়ীর ফর্ম। এই লিংকে গিয়ে পূরণ করুন:`} />
      ) : (
        <div data-market-form-link className="flex flex-col gap-4">
          <p className="text-sm text-muted">ব্যবসায়ী এই লিংকে নিজের ব্যবসা, Trade License, NID আর পরিবারের ১–২ জনের তথ্য দেবেন। কোন ঘর লাগবে, তা মার্কেটের Settings থেকে ঠিক করা যায়।</p>
          <p className="rounded-xl bg-primary-soft px-3 py-2 text-sm">ভাড়া, মেয়াদ, সিকিউরিটি আর পজিশন মানি আপনি Approve করার সময় চুক্তিতে লিখবেন।</p>
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

export default MarketFormLink;
