"use client";

import ChargeRows from "./ChargeRows";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { ADVANCE_BASE_OPTIONS, ELECTRICITY_OPTIONS, GAS_OPTIONS } from "@/lib/formTerms";
import { RENT_DAY_OPTIONS } from "@/lib/tenancyOptions";

// চার্জ, Advance, বিদ্যুৎ ও গ্যাস — Charges tab ও Send Form দুটোতেই
const TermsEditor = ({ value, onChange }) => {
  const change = (update) => onChange({ ...value, ...update });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-medium">মাসিক চার্জ</p>
          <p className="text-sm text-muted">টাকা ০ থাকলে ভাড়াটিয়ার ফর্মে দেখাবে না।</p>
        </div>
        <ChargeRows charges={value.charges} onChange={(charges) => change({ charges })} />
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
