"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import NidField from "@/components/tenant/NidField";
import Badge from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { GENDERS } from "@/lib/tenantFormOptions";

const Row = ({ label, value }) =>
  value || value === 0 ? (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm wrap-break-word">{value}</dd>
    </div>
  ) : null;

// একজন মানুষের পুরো তথ্য — ফর্মের রিভিউ ও ভাড়াটিয়ার সদস্য তালিকা দুটোতেই
const PersonDetailsModal = ({ person, isMain, hasImages, isRevealing, onReveal, loadImages, actions, onClose }) => {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    if (!hasImages) return;

    loadImages()
      .then((response) => setLinks(response.data))
      .catch((err) => toast.error(getErrorMessage(err, "ছবি খোলা যায়নি।")));
    // Modal খুললে একবারই
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal title={person.name} onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        {isMain && (
          <div>
            <Badge variant="info">প্রধান দায়িত্বশীল</Badge>
          </div>
        )}

        {person.phone && (
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${person.phone}`} className={buttonClasses({ size: "sm" })}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </a>
            <a href={`https://wa.me/88${person.phone}`} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "outline", size: "sm" })}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3">
          <Row label="Mobile" value={person.phone} />
          <Row label="Gender" value={GENDERS.find(({ value }) => value === person.gender)?.label} />
          <Row label="Age" value={person.age} />
          <Row label="Relation" value={person.relation} />
          <Row label="Occupation" value={person.occupation} />
          <Row label="Workplace" value={person.workplace} />
          <Row label="Permanent address" value={person.permanentAddress} />
          <Row label="Previous address" value={person.previousAddress} />
          {person.nidLast4 && (
            <div className="min-w-0">
              <dt className="text-xs text-muted">NID</dt>
              <dd>
                <NidField last4={person.nidLast4} isLoading={isRevealing} onReveal={onReveal} />
              </dd>
            </div>
          )}
        </dl>

        {hasImages &&
          (links ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {links.map(({ publicId, url }, index) => (
                // Private ছবির স্বাক্ষরিত লিংক, CDN এর ভেতর দিয়ে যায় না
                <a key={publicId} href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${person.name} document ${index + 1}`} className="h-32 w-full rounded-lg border border-border object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <Skeleton className="h-32 w-full rounded-lg" />
          ))}

        {actions && <div className="flex flex-wrap gap-2 border-t border-border pt-4">{actions}</div>}
      </div>
    </Modal>
  );
};

export default PersonDetailsModal;
