"use client";

import { useState } from "react";
import { Building2, ChevronRight, DoorOpen } from "lucide-react";
import FlatFormModal from "./FlatFormModal";
import PropertyFormModal from "./PropertyFormModal";
import Modal from "@/components/ui/Modal";

const CHOICES = [
  { value: "whole", icon: Building2, title: "পুরো বাড়ি", text: "বিল্ডিংটা আমার — সব বা বেশিরভাগ ফ্ল্যাট/দোকান আমার" },
  { value: "flats", icon: DoorOpen, title: "অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট বা দোকান", text: "বিল্ডিং অন্যের বা সোসাইটির — আমার শুধু এক বা কয়েকটা" },
];

// "যোগ করুন" — আগে কী আছে বাছাই, তারপর সেই ফর্ম
const AddAssetModal = ({ onClose, onSaved }) => {
  const [kind, setKind] = useState(null);

  if (kind === "whole") return <PropertyFormModal onClose={onClose} onSaved={onSaved} />;
  if (kind === "flats") return <FlatFormModal onClose={onClose} onSaved={(data) => onSaved?.(data.property)} />;

  return (
    <Modal title="কী যোগ করবেন?" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {CHOICES.map(({ value, icon: Icon, title, text }) => (
          <button
            key={value}
            type="button"
            data-asset-kind={value}
            onClick={() => setKind(value)}
            className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-primary-soft"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted">{text}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default AddAssetModal;
