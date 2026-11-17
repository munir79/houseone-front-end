"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";

// পুরো NID শুধু চাপলে দেখায়, আর দেখার রেকর্ড Log এ থাকে
const NidField = ({ last4, isLoading, onReveal }) => {
  const [fullNid, setFullNid] = useState("");

  if (!last4) return <p className="text-sm text-muted">দেওয়া হয়নি</p>;

  const handleToggle = async () => {
    if (fullNid) {
      setFullNid("");
      return;
    }

    try {
      const response = await onReveal();
      setFullNid(response.data.nid);
    } catch (err) {
      toast.error(getErrorMessage(err, "NID দেখানো যায়নি।"));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium tabular-nums">{fullNid || `•••••••${last4}`}</span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={fullNid ? "Hide NID" : "Show full NID"}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-primary-soft"
      >
        {fullNid ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
};

export default NidField;
