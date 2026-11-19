"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContractFields from "./ContractFields";
import ReceiveToday, { receiptsBody, rentedMessage } from "./ReceiveToday";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { contractBody, emptyContract, validateContract } from "@/lib/marketOptions";
import { todayInput } from "@/lib/tenancyOptions";
import { useFormActionMutation } from "@/redux/features/tenantForm/tenantFormApi";
import { useGetUnitQuery } from "@/redux/features/unit/unitApi";

// ব্যবসায়ীর ফর্ম Approve — তাঁর দেওয়া তথ্যের সাথে মালিক চুক্তি লেখেন, আর আজ যা পেলেন তার রসিদ
const ContractForm = ({ form, unit, onClose }) => {
  const router = useRouter();
  const [contract, setContract] = useState({ ...emptyContract(unit), startDate: todayInput() });
  const [received, setReceived] = useState({});
  const [method, setMethod] = useState("Cash");
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [formAction] = useFormActionMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validateContract(contract);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("লাল ঘরগুলো ঠিক করে দিন");
      return;
    }

    setIsSaving(true);
    try {
      const { data: tenancy } = await formAction({ id: form._id, action: "approve", ...contractBody(contract), ...receiptsBody({ contract, received, method }) }).unwrap();
      const message = rentedMessage(tenancy.receipts);
      toast[message.type](message.text);
      router.replace(`/properties/${form.property}/units/${form.unit}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Approve হয়নি। আবার চেষ্টা করুন।"));
      setIsSaving(false);
    }
  };

  return (
    <form data-market-approve onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted">{form.companyName || form.name} এর দেওয়া তথ্য এই দোকানে বসবে। এখন চুক্তিটা লিখুন।</p>
      <ContractFields value={contract} onChange={setContract} errors={errors} />
      <ReceiveToday contract={contract} received={received} onReceivedChange={setReceived} method={method} onMethodChange={setMethod} />
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving}>
          Approve ও ভাড়া দিন
        </Button>
      </div>
    </form>
  );
};

const MarketApproveModal = ({ form, onClose }) => {
  const { data } = useGetUnitQuery(form.unit);
  const unit = data?.data;

  return (
    <Modal title={`${form.unitName} দোকানের চুক্তি`} onClose={onClose} size="lg">
      {unit ? <ContractForm form={form} unit={unit} onClose={onClose} /> : <Skeleton className="h-64 w-full rounded-xl" />}
    </Modal>
  );
};

export default MarketApproveModal;
