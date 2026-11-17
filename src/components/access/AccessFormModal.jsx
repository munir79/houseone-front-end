"use client";

import { useState } from "react";
import { Mail, Save } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { ALL_PROPERTIES } from "@/hooks/useWorkspace";
import { ACCESS_LEVELS, ACCESS_RELATIONS } from "@/lib/accessOptions";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useInviteAccessMutation, useUpdateAccessMutation } from "@/redux/features/access/accessApi";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// কাউকে অ্যাক্সেস দেওয়া বা বদলানো — কে, সম্পর্ক, অনুমতি, কোন সম্পদ (শুধু নিজের একার)
// grant থাকলে Edit; propertyId — সম্পদের ভেতর থেকে খুললে সেটা আগে থেকে বাছা
const AccessFormModal = ({ grant, propertyId, onClose }) => {
  const isEdit = !!grant;
  const { data: profile } = useGetMyProfileQuery();
  const { data } = useGetPropertiesQuery(ALL_PROPERTIES);
  const [inviteAccess, { isLoading: isInviting }] = useInviteAccessMutation();
  const [updateAccess, { isLoading: isUpdating }] = useUpdateAccessMutation();

  const me = profile?.data?._id;
  const choices = (data?.data?.data || []).filter((house) => house.owner === me && !house.isShared);
  const [form, setForm] = useState({
    email: grant?.email ?? "",
    relation: grant?.relation ?? "",
    level: grant?.level ?? "view",
    properties: grant ? grant.properties.map(({ _id }) => _id) : propertyId ? [propertyId] : [],
  });
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const toggleProperty = (id) => set("properties", form.properties.includes(id) ? form.properties.filter((value) => value !== id) : [...form.properties, id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!isEdit && !EMAIL_PATTERN.test(form.email.trim())) found.email = "সঠিক email লিখুন";
    if (!form.relation) found.relation = "সম্পর্ক বাছুন";
    if (form.properties.length === 0) found.properties = "অন্তত একটা সম্পদ বাছুন";
    if (Object.keys(found).length > 0) return setErrors(found);

    const body = { relation: form.relation, level: form.level, propertyIds: form.properties };
    try {
      if (isEdit) await updateAccess({ grantId: grant._id, ...body }).unwrap();
      else await inviteAccess({ email: form.email.trim(), ...body }).unwrap();
      toast.success(isEdit ? "অ্যাক্সেস বদলানো হয়েছে" : "অ্যাক্সেসের দাওয়াত পাঠানো হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={isEdit ? "অ্যাক্সেস বদলান" : "কাউকে অ্যাক্সেস দিন"} onClose={onClose}>
      <form data-access-form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {!isEdit && <p className="text-sm text-muted">পরিবারের কাউকে আপনার সম্পদ দেখতে বা কাজে সাহায্য করতে দিন। তিনি এই email দিয়ে login করে Accept করলেই দেখবেন। মালিকানা বা লাভের ভাগ পাবেন না।</p>}
        <Input id="accessEmail" type="email" label="তাঁর email" placeholder="name@email.com" value={form.email} error={errors.email} disabled={isEdit} onChange={(e) => set("email", e.target.value)} />
        <Select
          id="accessRelation"
          label="আপনার কে হন"
          placeholder="বাছুন"
          options={ACCESS_RELATIONS.map((value) => ({ value, label: value }))}
          value={form.relation}
          error={errors.relation}
          onChange={(e) => set("relation", e.target.value)}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold">অনুমতি</legend>
          {ACCESS_LEVELS.map(({ value, label, text }) => (
            <label
              key={value}
              data-access-level={value}
              className={cn("flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors", form.level === value ? "border-primary bg-primary-soft" : "border-border hover:border-primary")}
            >
              <input type="radio" name="accessLevel" value={value} checked={form.level === value} onChange={() => set("level", value)} className="mt-1 h-4 w-4 shrink-0 accent-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted">{text}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold">কোন সম্পদ দেখবেন</legend>
          {choices.length === 0 ? (
            <p className="text-sm text-muted">আপনার একার কোনো সম্পদ নেই। অংশীদারি সম্পদে অংশীদারের দাওয়াত দিন।</p>
          ) : (
            choices.map((house) => (
              <label key={house._id} data-access-property={house.name} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 hover:border-primary">
                <input type="checkbox" checked={form.properties.includes(house._id)} onChange={() => toggleProperty(house._id)} className="h-4 w-4 shrink-0 accent-primary" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{house.name}</span>
                <span className="shrink-0 text-xs text-muted">{house.area}</span>
              </label>
            ))
          )}
          {errors.properties && (
            <p id="accessProperties-error" className="text-sm text-danger" role="alert">
              {errors.properties}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isInviting || isUpdating}>
            {isEdit ? <Save className="h-4 w-4" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
            {isEdit ? "Save" : "দাওয়াত পাঠান"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AccessFormModal;
