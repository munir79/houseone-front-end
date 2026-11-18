"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { floorName } from "@/lib/unitOptions";
import { useCreateUnitsInBulkMutation } from "@/redux/features/unit/unitApi";

const MAX_PER_FLOOR = 200;
const floorCode = (floor) => (floor < 0 ? `B${-floor}` : floor === 0 ? "G" : String(floor));
const shopName = (floor, block, number) => `${floorCode(floor)}-${block}${String(number).padStart(2, "0")}`;

// একসাথে দোকান — তলা বেছে, প্রতি তলায় কয়টা; নম্বর নিজে থেকে (G-01, 1-A05, B1-03)
// আগে থেকে থাকা নম্বর বাদ দিয়ে পরের নম্বর থেকে বসে
const ShopsSetupModal = ({ property, onCreated, onClose }) => {
  const basements = property.basementFloors ?? 0;
  const floors = Array.from({ length: property.totalFloors + basements + 1 }, (_, index) => index - basements);
  const [chosen, setChosen] = useState(() => new Set(floors));
  const [form, setForm] = useState({ count: "", block: "", sizeSqft: "", rent: "", serviceCharge: "" });
  const [errors, setErrors] = useState({});
  const [createUnits, { isLoading }] = useCreateUnitsInBulkMutation();

  const set = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const toggle = (floor) =>
    setChosen((prev) => {
      const next = new Set(prev);
      next.has(floor) ? next.delete(floor) : next.add(floor);
      return next;
    });

  const count = Number(form.count);
  const isCountValid = Number.isInteger(count) && count >= 1 && count <= MAX_PER_FLOOR;
  const total = isCountValid ? count * chosen.size : 0;
  const example = [...chosen].sort((a, b) => a - b)[0];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!isCountValid) found.count = `১ থেকে ${toBanglaNumber(MAX_PER_FLOOR)} এর মধ্যে লিখুন`;
    if (chosen.size === 0) found.floors = "অন্তত একটা তলা বাছুন";
    if (Object.keys(found).length > 0) return setErrors(found);

    const number = (value) => (value === "" ? undefined : Number(value));
    try {
      const response = await createUnits({
        propertyId: property._id,
        rows: [...chosen].sort((a, b) => a - b).map((floor) => ({ floor, count, block: form.block })),
        sizeSqft: number(form.sizeSqft),
        rent: number(form.rent),
        serviceCharge: number(form.serviceCharge),
      }).unwrap();
      toast.success(`${toBanglaNumber(response.data.created)}টি দোকান তৈরি হয়েছে`);
      onCreated?.(response.data.created);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "দোকান তৈরি হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="একসাথে দোকান তৈরি" onClose={onClose} size="lg">
      <form data-shops-setup onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold">কোন তলায়</legend>
          <div className="flex flex-wrap gap-2">
            {floors.map((floor) => (
              <button
                key={floor}
                type="button"
                data-floor={floor}
                aria-pressed={chosen.has(floor)}
                onClick={() => toggle(floor)}
                className={cn("min-h-10 rounded-full border px-3.5 text-sm font-semibold transition-colors", chosen.has(floor) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary")}
              >
                {floorName(floor)}
              </button>
            ))}
          </div>
          {errors.floors && (
            <p id="shopFloors-error" className="text-sm text-danger" role="alert">
              {errors.floors}
            </p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="shopCount" type="number" inputMode="numeric" min="1" max={MAX_PER_FLOOR} label="প্রতি তলায় কয়টা দোকান" placeholder="যেমন: ২০" value={form.count} onChange={set("count")} error={errors.count} />
          {(property.blocks ?? []).length > 0 && (
            <Select id="shopBlock" label="ব্লক বা লাইন" options={[{ value: "", label: "ব্লক ছাড়া" }, ...property.blocks.map((block) => ({ value: block, label: `ব্লক ${block}` }))]} value={form.block} onChange={set("block")} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="shopSize" type="number" inputMode="numeric" min="0" label="মাপ (বর্গফুট, ঐচ্ছিক)" placeholder="১২০" value={form.sizeSqft} onChange={set("sizeSqft")} />
          <Input id="shopRent" type="number" inputMode="numeric" min="0" label="মাসিক ভাড়া (ঐচ্ছিক)" placeholder="৪০,০০০" value={form.rent} onChange={set("rent")} />
          <Input id="shopServiceCharge" type="number" inputMode="numeric" min="0" label="সার্ভিস চার্জ (ঐচ্ছিক)" placeholder="১,৫০০" value={form.serviceCharge} onChange={set("serviceCharge")} />
        </div>

        <p data-shops-preview className="flex items-start gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-sm">
          <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {total > 0 && example !== undefined
            ? `${toBanglaNumber(total)}টি দোকান তৈরি হবে, যেমন ${shopName(example, form.block, 1)}, ${shopName(example, form.block, 2)} … আগে থেকে থাকা নম্বর বাদ দিয়ে পরের নম্বর থেকে বসবে। পরে প্রতিটা দোকান আলাদা করে বদলাতে পারবেন।`
            : "তলা বাছুন আর প্রতি তলায় কয়টা দোকান লিখুন — নম্বর নিজে থেকে বসবে।"}
        </p>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            দোকান তৈরি করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ShopsSetupModal;
