"use client";

import { useState } from "react";
import { Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useInviteOwnerMutation } from "@/redux/features/share/shareApi";

const MAX_ROWS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// অংশীদারি সম্পদ তৈরির পরের ধাপ — অংশীদারদের email; এখন না দিলে পরে অংশীদারি পাতা থেকে
const InvitePartnersModal = ({ property, onDone }) => {
  const [emails, setEmails] = useState([""]);
  const [errors, setErrors] = useState({});
  const [inviteOwner, { isLoading }] = useInviteOwnerMutation();

  const setEmail = (index, value) => {
    setEmails((prev) => prev.map((email, i) => (i === index ? value : email)));
    setErrors((prev) => ({ ...prev, [index]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const filled = emails.map((email, index) => ({ email: email.trim(), index })).filter(({ email }) => email);
    if (filled.length === 0) return onDone();

    const invalid = Object.fromEntries(filled.filter(({ email }) => !EMAIL_PATTERN.test(email)).map(({ index }) => [index, "সঠিক email লিখুন"]));
    if (Object.keys(invalid).length > 0) return setErrors(invalid);

    // একজনের দাওয়াত না গেলে বাকিরা যায়; না যাওয়াগুলো ঘরে থেকে যায় আবার চেষ্টার জন্য
    const failed = {};
    for (const { email, index } of filled) {
      try {
        await inviteOwner({ propertyId: property._id, email }).unwrap();
      } catch (err) {
        failed[index] = getErrorMessage(err, "দাওয়াত পাঠানো যায়নি");
      }
    }
    if (Object.keys(failed).length > 0) {
      setEmails((prev) => prev.map((email, index) => (failed[index] ? email : "")));
      return setErrors(failed);
    }
    toast.success(filled.length > 1 ? "সবাইকে দাওয়াত পাঠানো হয়েছে" : "দাওয়াত পাঠানো হয়েছে");
    onDone();
  };

  return (
    <Modal title="অংশীদারদের দাওয়াত দিন" onClose={onDone}>
      <form data-invite-partners onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          &ldquo;{property.name}&rdquo; তৈরি হয়েছে। অংশীদারদের email দিন — তাঁরা এই email দিয়ে login করে দাওয়াত Accept করলেই সম্পদটা দেখবেন। ভাগ পরে অংশীদারি পাতা থেকে ঠিক করবেন।
        </p>
        {emails.map((email, index) => (
          <div key={index} className="flex items-start gap-2">
            <Input
              id={`partnerEmail-${index}`}
              type="email"
              label={index === 0 ? "অংশীদারের email" : undefined}
              aria-label={`Partner email ${index + 1}`}
              placeholder="partner@email.com"
              value={email}
              error={errors[index]}
              onChange={(e) => setEmail(index, e.target.value)}
              className="min-w-0 flex-1"
            />
            {emails.length > 1 && (
              <button
                type="button"
                aria-label={`Remove email ${index + 1}`}
                onClick={() => setEmails((prev) => prev.filter((_, i) => i !== index))}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background ${index === 0 ? "mt-7" : ""}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {emails.length < MAX_ROWS && (
          <Button variant="ghost" size="sm" onClick={() => setEmails((prev) => [...prev, ""])} className="w-fit">
            <Plus className="h-4 w-4" aria-hidden="true" />
            আরেকজন
          </Button>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onDone}>
            পরে দেব
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!emails.some((email) => email.trim())}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            দাওয়াত পাঠান
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InvitePartnersModal;
