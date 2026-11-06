"use client";

import { Plus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { ADVANCE_BASE_OPTIONS, ELECTRICITY_OPTIONS, GAS_OPTIONS } from "@/lib/formTerms";
import { RENT_DAY_OPTIONS } from "@/lib/tenancyOptions";

const MAX_CHARGES = 15;

// চার্জ, Advance, বিদ্যুৎ ও গ্যাস — Charges tab ও Send Form দুটোতেই
const TermsEditor = ({ value, onChange }) => {
  const change = (update) => onChange({ ...value, ...update });
  const changeCharge = (index, update) => change({ charges: value.charges.map((charge, itemIndex) => (itemIndex === index ? { ...charge, ...update } : charge)) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-medium">মাসিক চার্জ</p>
          <p className="text-sm text-muted">টাকা ০ থাকলে ভাড়াটিয়ার ফর্মে দেখাবে না।</p>
        </div>
        {value.charges.map((charge, index) => (
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
              onClick={() => change({ charges: value.charges.filter((_, itemIndex) => itemIndex !== index) })}
              aria-label={`Remove charge ${index + 1}`}
              className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {value.charges.length < MAX_CHARGES && (
          <Button variant="outline" size="sm" onClick={() => change({ charges: [...value.charges, { name: "", amount: 0 }] })} className="w-fit">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Charge
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input id="advanceMonths" type="number" inputMode="numeric" min="0" max="12" label="Advance (মাস)" value={value.advanceMonths} onChange={(e) => change({ advanceMonths: e.target.value === "" ? "" : Number(e.target.value) })} />
        <Select id="advanceBase" label="Advance কিসের ওপর" options={ADVANCE_BASE_OPTIONS} value={value.advanceBase} onChange={(e) => change({ advanceBase: e.target.value })} />
        <Select id="electricity" label="বিদ্যুৎ" options={ELECTRICITY_OPTIONS} value={value.electricity} onChange={(e) => change({ electricity: e.target.value })} />
        <Select id="gas" label="গ্যাস" options={GAS_OPTIONS} value={value.gas} onChange={(e) => change({ gas: e.target.value })} />
        <Select id="dueDay" label="Rent day" options={RENT_DAY_OPTIONS} value={String(value.dueDay)} onChange={(e) => change({ dueDay: Number(e.target.value) })} />
      </div>
    </div>
  );
};

export default TermsEditor;
