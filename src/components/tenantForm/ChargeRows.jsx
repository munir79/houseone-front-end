"use client";

import { Plus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const MAX_CHARGES = 15;

// চার্জের সারি — Charges tab, Send Form ও ভাড়াটিয়ার Edit এ
const ChargeRows = ({ charges, onChange }) => {
  const changeCharge = (index, update) => onChange(charges.map((charge, itemIndex) => (itemIndex === index ? { ...charge, ...update } : charge)));

  return (
    <div className="flex flex-col gap-2">
      {charges.map((charge, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input id={`chargeName-${index}`} aria-label={`Charge ${index + 1} name`} placeholder="চার্জের নাম" value={charge.name} onChange={(e) => changeCharge(index, { name: e.target.value })} className="min-w-0 flex-1" />
          <Input
            id={`chargeAmount-${index}`}
            type="number"
            inputMode="numeric"
            min="0"
            aria-label={`Charge ${index + 1} amount`}
            value={charge.amount}
            onChange={(e) => changeCharge(index, { amount: e.target.value === "" ? "" : Number(e.target.value) })}
            className="w-28 shrink-0"
          />
          <button
            type="button"
            onClick={() => onChange(charges.filter((_, itemIndex) => itemIndex !== index))}
            aria-label={`Remove charge ${index + 1}`}
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      {charges.length < MAX_CHARGES && (
        <Button variant="outline" size="sm" onClick={() => onChange([...charges, { name: "", amount: 0 }])} className="w-fit">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Charge
        </Button>
      )}
    </div>
  );
};

export default ChargeRows;
