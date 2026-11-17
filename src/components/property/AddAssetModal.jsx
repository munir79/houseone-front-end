"use client";

import { useRef, useState } from "react";
import { Building2, ChevronRight, DoorOpen, Handshake } from "lucide-react";
import FlatFormModal from "./FlatFormModal";
import PropertyFormModal from "./PropertyFormModal";
import InvitePartnersModal from "@/components/share/InvitePartnersModal";
import Modal from "@/components/ui/Modal";

const KINDS = [
  { value: "whole", icon: Building2, title: "পুরো বাড়ি", text: "বিল্ডিংটা আমার — সব বা বেশিরভাগ ফ্ল্যাট/দোকান আমার" },
  { value: "flats", icon: DoorOpen, title: "অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট বা দোকান", text: "বিল্ডিং অন্যের বা সোসাইটির — আমার শুধু এক বা কয়েকটা" },
];
const SHARED = { value: "shared", icon: Handshake, title: "অংশীদারি সম্পদ", text: "কয়েকজন মিলে মালিক — আপনি তৈরি করে অংশীদারদের দাওয়াত দেবেন" };

const ChoiceList = ({ choices, onPick }) => (
  <div className="flex flex-col gap-3">
    {choices.map(({ value, icon: Icon, title, text }) => (
      <button
        key={value}
        type="button"
        data-asset-kind={value}
        onClick={() => onPick(value)}
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
);

// "যোগ করুন" — আগে কী আছে বাছাই, তারপর সেই ফর্ম; অংশীদারি হলে ধরন বেছে, তৈরির পরে দাওয়াত
// shared — অংশীদারি সম্পদের পাতা থেকে খুললে সরাসরি অংশীদারি
const AddAssetModal = ({ onClose, onSaved, shared = false }) => {
  const [isShared, setIsShared] = useState(shared);
  const [kind, setKind] = useState(null);
  const [created, setCreated] = useState(null);
  // ফর্ম সেভ হয়েই বন্ধ করতে চায় — অংশীদারি হলে তখন দাওয়াতের ধাপ, তাই বন্ধ নয়
  const createdRef = useRef(null);

  const handleSaved = (property) => {
    if (!isShared) return onSaved?.(property);
    createdRef.current = property;
    setCreated(property);
  };
  const handleFormClose = () => {
    if (!createdRef.current) onClose();
  };
  const finish = () => {
    onSaved?.(created);
    onClose();
  };

  if (created) return <InvitePartnersModal property={created} onDone={finish} />;
  if (kind === "whole") return <PropertyFormModal isShared={isShared} onClose={handleFormClose} onSaved={handleSaved} />;
  if (kind === "flats") return <FlatFormModal isShared={isShared} onClose={handleFormClose} onSaved={(data) => handleSaved(data.property)} />;

  if (isShared) {
    return (
      <Modal title="অংশীদারি — কী ধরনের সম্পদ?" onClose={onClose}>
        <ChoiceList choices={KINDS} onPick={setKind} />
      </Modal>
    );
  }

  return (
    <Modal title="কী যোগ করবেন?" onClose={onClose}>
      <ChoiceList choices={[...KINDS, SHARED]} onPick={(value) => (value === "shared" ? setIsShared(true) : setKind(value))} />
    </Modal>
  );
};

export default AddAssetModal;
