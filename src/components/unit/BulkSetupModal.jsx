"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { LIVING_LAYOUT_OPTIONS, PREFERRED_TENANT_OPTIONS, UNIT_TYPE_OPTIONS, floorName } from "@/lib/unitOptions";
import { useBulkUpdateUnitsMutation } from "@/redux/features/unit/unitApi";

const KEEP = { value: "", label: "আগের মতো থাকবে" };
const EMPTY_VALUES = { type: "", rent: "", bedrooms: "", bathrooms: "", balconies: "", livingLayout: "", sizeSqft: "", preferredTenant: "" };

// "7th Floor - B" থেকে B — তলায় একটি ইউনিট হলে নেই
const unitLetter = ({ name }) => name.split(" - ")[1] ?? "";

const QuickPick = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="min-h-9 rounded-full border border-border bg-surface px-3 text-sm font-semibold hover:bg-primary-soft">
    {label}
  </button>
);

// ফ্ল্যাট তৈরির পরে — একই রকম ফ্ল্যাট বেছে একবারে তথ্য বসানো
const BulkSetupModal = ({ propertyId, units, onClose }) => {
  const [selected, setSelected] = useState(() => new Set());
  const [values, setValues] = useState(EMPTY_VALUES);
  const [bulkUpdate, { isLoading }] = useBulkUpdateUnitsMutation();

  const floors = useMemo(() => {
    const byFloor = units.reduce((all, unit) => all.set(unit.floor, [...(all.get(unit.floor) || []), unit]), new Map());
    return [...byFloor.entries()].sort(([a], [b]) => b - a);
  }, [units]);

  const letters = useMemo(() => [...new Set(units.map(unitLetter).filter(Boolean))].sort(), [units]);
  const noRent = units.filter(({ rent }) => rent === null || rent === undefined);
  const chosen = units.filter(({ _id }) => selected.has(_id));
  const occupiedCount = chosen.filter(({ tenancy }) => tenancy).length;
  const rentChangeCount = values.rent === "" ? 0 : chosen.filter(({ rent }) => rent !== null && rent !== undefined && rent !== Number(values.rent)).length;
  const hasValues = Object.values(values).some((value) => value !== "");

  const change = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));
  const pick = (list) => setSelected(new Set(list.map(({ _id }) => _id)));

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const toggleFloor = (floorUnits) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const isAllChosen = floorUnits.every(({ _id }) => next.has(_id));
      floorUnits.forEach(({ _id }) => (isAllChosen ? next.delete(_id) : next.add(_id)));
      return next;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fields = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));

    try {
      await bulkUpdate({ propertyId, unitIds: [...selected], fields }).unwrap();
      toast.success(`${toBanglaNumber(selected.size)}টি ফ্ল্যাট সেট হয়েছে। এবার পরের রকমের ফ্ল্যাট বাছুন।`);
      setSelected(new Set());
      setValues(EMPTY_VALUES);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Bulk Setup" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">একই রকম ফ্ল্যাটগুলো বেছে নিন, তারপর তথ্য দিন। একবারে সবগুলোতে বসে যাবে।</p>

        <FormSection title="১. একই রকম ফ্ল্যাট বাছুন">
          <div className="flex flex-wrap gap-2">
            <QuickPick label="সব ফ্ল্যাট" onClick={() => pick(units)} />
            {letters.map((letter) => (
              <QuickPick key={letter} label={`সব ${letter}`} onClick={() => pick(units.filter((unit) => unitLetter(unit) === letter))} />
            ))}
            {noRent.length > 0 && <QuickPick label={`ভাড়া সেট হয়নি (${toBanglaNumber(noRent.length)})`} onClick={() => pick(noRent)} />}
            {selected.size > 0 && <QuickPick label="বাছাই মুছুন" onClick={() => setSelected(new Set())} />}
          </div>

          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-xl border border-border p-2">
            {floors.map(([floor, floorUnits]) => (
              <div key={floor} className="flex flex-wrap items-center gap-2">
                <button type="button" data-floor-pick={floor} onClick={() => toggleFloor(floorUnits)} className="min-h-9 w-24 shrink-0 rounded-lg px-1 text-left text-sm font-semibold hover:bg-primary-soft">
                  {floorName(floor)}
                </button>
                {floorUnits.map((unit) => {
                  const isChosen = selected.has(unit._id);
                  return (
                    <button
                      key={unit._id}
                      type="button"
                      data-unit-pick={unit.name}
                      aria-pressed={isChosen}
                      onClick={() => toggle(unit._id)}
                      className={cn("min-h-9 rounded-lg border px-3 text-sm font-semibold", isChosen ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-primary-soft")}
                    >
                      {unitLetter(unit) || unit.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection title="২. তথ্য দিন">
          <p className="text-sm text-muted">শুধু যেটা বদলাতে চান সেটা লিখুন। খালি ঘরের তথ্য আগের মতোই থাকবে।</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Select id="bulkType" label="ধরন" options={[KEEP, ...UNIT_TYPE_OPTIONS]} value={values.type} onChange={change("type")} />
            <Input id="bulkRent" type="number" inputMode="numeric" min="0" label="বাসা ভাড়া (৳)" value={values.rent} onChange={change("rent")} />
            <Input id="bulkBedrooms" type="number" inputMode="numeric" min="0" label="বেডরুম" value={values.bedrooms} onChange={change("bedrooms")} />
            <Input id="bulkBathrooms" type="number" inputMode="numeric" min="0" label="বাথরুম" value={values.bathrooms} onChange={change("bathrooms")} />
            <Input id="bulkBalconies" type="number" inputMode="numeric" min="0" label="বারান্দা" value={values.balconies} onChange={change("balconies")} />
            <Input id="bulkSize" type="number" inputMode="numeric" min="0" label="আয়তন (বর্গফুট)" value={values.sizeSqft} onChange={change("sizeSqft")} />
            <Select id="bulkLayout" label="ড্রয়িং-ডাইনিং" options={[KEEP, ...LIVING_LAYOUT_OPTIONS.filter(({ value }) => value)]} value={values.livingLayout} onChange={change("livingLayout")} />
            <Select id="bulkPreferred" label="কাকে ভাড়া দিতে চান" options={[KEEP, ...PREFERRED_TENANT_OPTIONS]} value={values.preferredTenant} onChange={change("preferredTenant")} />
          </div>
        </FormSection>

        {occupiedCount > 0 && values.rent !== "" && (
          <p data-occupied-warning className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {toBanglaNumber(occupiedCount)}টি ফ্ল্যাটে ভাড়াটিয়া আছেন। তাঁদের চলমান ভাড়া বদলাবে না, বদলাতে হলে ভাড়াটিয়ার Edit থেকে করুন।
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div data-bulk-summary className="text-sm">
            <p className="font-semibold">{selected.size > 0 ? `${toBanglaNumber(selected.size)}টি ফ্ল্যাটে বসবে` : "কোনো ফ্ল্যাট বাছা হয়নি"}</p>
            {rentChangeCount > 0 && <p className="text-muted">{toBanglaNumber(rentChangeCount)}টি ফ্ল্যাটের আগের ভাড়া বদলাবে</p>}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={selected.size === 0 || !hasValues}>
              Apply
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BulkSetupModal;
