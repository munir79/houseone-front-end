"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { useUpdateTenantMutation } from "@/redux/features/tenancy/tenancyApi";

// Overview এর এক অংশ — শুধু সেই অংশের ঘর খোলে
const EditSectionModal = ({ tenant, section, onClose }) => {
  const [values, setValues] = useState(() => Object.fromEntries(section.fields.map(({ key }) => [key, tenant[key] ?? ""])));
  const [errors, setErrors] = useState({});
  const [updateTenant, { isLoading }] = useUpdateTenantMutation();

  const change = (key, isNumber) => (e) => {
    setValues((prev) => ({ ...prev, [key]: isNumber ? toEnglishNumber(e.target.value) : e.target.value }));
    setErrors(({ [key]: removed, ...rest }) => rest);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = Object.fromEntries(section.fields.filter(({ key, required }) => required && !String(values[key]).trim()).map(({ key, label }) => [key, `${label} লিখুন`]));
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // NID খালি থাকলে আগেরটাই থাকে
    const { nid, ...rest } = values;
    const body = { ...rest, ...(nid ? { nid } : {}) };

    try {
      await updateTenant({ id: tenant._id, ...body }).unwrap();
      toast.success("তথ্য সেভ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "তথ্য সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={section.title} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {section.fields.map(({ key, label, type, isNumber, options, placeholder }) =>
            options ? (
              <Select key={key} id={`section-${key}`} label={label} options={options} value={values[key]} onChange={change(key)} />
            ) : (
              <Input
                key={key}
                id={`section-${key}`}
                type={type ?? "text"}
                inputMode={isNumber ? "numeric" : undefined}
                autoComplete="off"
                label={label}
                placeholder={typeof placeholder === "function" ? placeholder(tenant) : placeholder}
                value={values[key]}
                onChange={change(key, isNumber)}
                error={errors[key]}
              />
            )
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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

export default EditSectionModal;
