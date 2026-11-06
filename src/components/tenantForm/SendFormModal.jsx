"use client";

import { useState } from "react";
import { toast } from "sonner";
import ShareForm from "./ShareForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useCreateTenantFormMutation } from "@/redux/features/tenantForm/tenantFormApi";

const TYPES = ["Family", "Bachelor", "Office"];

const SendFormModal = ({ unit, onClose }) => {
  const [occupantType, setOccupantType] = useState("Family");
  const [form, setForm] = useState(null);
  const [createForm, { isLoading }] = useCreateTenantFormMutation();

  const handleCreate = async () => {
    try {
      const response = await createForm({ unitId: unit._id, occupantType }).unwrap();
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
            <SegmentedControl label="Tenant type" options={TYPES} value={occupantType} onChange={setOccupantType} />
          </div>
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
