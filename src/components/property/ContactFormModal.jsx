"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useCreateContactMutation, useUpdateContactMutation } from "@/redux/features/property/propertyApi";

const CATEGORIES = ["Plumber", "Electrician", "Lift", "Gas", "Guard", "Caretaker", "Other"];
const categoryOptions = CATEGORIES.map((category) => ({ value: category, label: category }));

const ContactFormModal = ({ propertyId, contact, onClose }) => {
  const [form, setForm] = useState({
    category: contact?.category || "",
    name: contact?.name || "",
    phone: contact?.phone || "",
    note: contact?.note || "",
  });
  const [errors, setErrors] = useState({});

  const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
  const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();

  // লেখা শুরু করলেই সেই ঘরের Error চলে যায়
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors(({ [field]: removed, ...rest }) => rest);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.category) newErrors.category = "ধরন বেছে নিন";
    if (!form.name.trim()) newErrors.name = "নাম লিখুন";
    if (!form.phone.trim()) newErrors.phone = "ফোন নম্বর লিখুন";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = contact
        ? await updateContact({ propertyId, contactId: contact._id, ...form }).unwrap()
        : await createContact({ propertyId, ...form }).unwrap();

      toast.success(response.message);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "নম্বর সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={contact ? "Edit Contact" : "Add Contact"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Select
          id="category"
          label="Type"
          placeholder="ধরন বেছে নিন"
          options={categoryOptions}
          value={form.category}
          onChange={handleChange("category")}
          error={errors.category}
        />
        <Input id="contactName" label="Name" placeholder="Rafiq" value={form.name} onChange={handleChange("name")} error={errors.name} />
        <Input
          id="contactPhone"
          type="tel"
          inputMode="tel"
          label="Phone number"
          placeholder="01XXXXXXXXX"
          value={form.phone}
          onChange={handleChange("phone")}
          error={errors.phone}
        />
        <Input id="contactNote" label="Note (optional)" placeholder="যেমন: সকালে ফোন করলে পাওয়া যায়" value={form.note} onChange={handleChange("note")} />

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {contact ? "Save Changes" : "Add Contact"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactFormModal;
