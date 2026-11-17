"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { floorName, floorOptions } from "@/lib/unitOptions";
import { useCreateUnitsInBulkMutation } from "@/redux/features/unit/unitApi";

const MAX_PER_FLOOR = 26;

const isValidCount = (value, min) => {
  const number = Number(value);
  return value !== "" && Number.isInteger(number) && number >= min && number <= MAX_PER_FLOOR;
};

const QuickAddUnitsModal = ({ propertyId, totalFloors, onCreated, onClose }) => {
  const [unitsPerFloor, setUnitsPerFloor] = useState("2");
  const [includeGround, setIncludeGround] = useState(false);
  const [exceptions, setExceptions] = useState([]); // [{ id, floor, units }]
  const [error, setError] = useState("");

  const [createUnits, { isLoading }] = useCreateUnitsInBulkMutation();

  const isValid = isValidCount(unitsPerFloor, 1);
  const allFloors = floorOptions(totalFloors);
  const usedFloors = new Set(exceptions.map(({ floor }) => floor));

  const addException = () => {
    setExceptions((prev) => [...prev, { id: crypto.randomUUID(), floor: "", units: "1" }]);
  };

  const updateException = (id, field, value) => {
    setExceptions((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    setError("");
  };

  const removeException = (id) => {
    setExceptions((prev) => prev.filter((item) => item.id !== id));
    setError("");
  };

  const countFor = (floor) => {
    const exception = exceptions.find((item) => item.floor === String(floor) && isValidCount(item.units, 0));
    if (exception) return Number(exception.units);
    return floor === 0 && !includeGround ? 0 : Number(unitsPerFloor);
  };

  const total = isValid ? Array.from({ length: totalFloors + 1 }, (_, floor) => countFor(floor)).reduce((sum, count) => sum + count, 0) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      setError(`১ থেকে ${toBanglaNumber(MAX_PER_FLOOR)} এর মধ্যে সংখ্যা লিখুন`);
      return;
    }
    if (exceptions.some(({ floor, units }) => floor === "" || !isValidCount(units, 0))) {
      setError(`প্রতিটি Exception-এ তলা বেছে নিন, আর ০ থেকে ${toBanglaNumber(MAX_PER_FLOOR)} এর মধ্যে সংখ্যা লিখুন`);
      return;
    }

    try {
      const response = await createUnits({
        propertyId,
        unitsPerFloor: Number(unitsPerFloor),
        includeGround,
        exceptions: exceptions.map(({ floor, units }) => ({ floor: Number(floor), units: Number(units) })),
      }).unwrap();
      const { created, skipped } = response.data;

      toast.success(
        skipped > 0
          ? `${toBanglaNumber(created)}টি ইউনিট যোগ হয়েছে, ${toBanglaNumber(skipped)}টি আগে থেকেই ছিল`
          : `${toBanglaNumber(created)}টি ইউনিট যোগ হয়েছে`
      );
      onCreated(created);
    } catch (err) {
      toast.error(getErrorMessage(err, "ইউনিট যোগ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Quick Add Units" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Floors">
          <p className="text-sm text-muted">
            এই বাড়িতে {toBanglaNumber(totalFloors)}টি তলা আছে। পরে যেকোনো ইউনিট বদলাতে বা মুছতে পারবেন।
          </p>

          <Input
            id="unitsPerFloor"
            type="number"
            inputMode="numeric"
            min="1"
            max={MAX_PER_FLOOR}
            label="Units on each floor"
            value={unitsPerFloor}
            onChange={(e) => {
              setUnitsPerFloor(e.target.value);
              setError("");
            }}
            className="sm:max-w-48"
          />

          <Checkbox
            id="includeGround"
            label="নিচতলাতেও ইউনিট তৈরি করুন"
            description="নিচতলায় পার্কিং বা গ্যারেজ থাকলে টিক দেবেন না"
            checked={includeGround}
            onChange={(e) => setIncludeGround(e.target.checked)}
          />
        </FormSection>

        <FormSection title="Exceptions">
          <p className="text-sm text-muted">কোনো তলায় ইউনিট কম বা বেশি হলে এখানে যোগ করুন। ০ দিলে সেই তলায় ইউনিট হবে না।</p>

          {exceptions.map(({ id, floor, units }, index) => (
            <div key={id} className="flex items-end gap-2">
              <Select
                id={`exceptionFloor${index}`}
                label={index === 0 ? "Floor" : undefined}
                aria-label="Floor"
                placeholder="তলা বেছে নিন"
                options={allFloors.filter(({ value }) => value === floor || !usedFloors.has(value))}
                value={floor}
                onChange={(e) => updateException(id, "floor", e.target.value)}
                className="min-w-0 flex-1"
              />
              <Input
                id={`exceptionUnits${index}`}
                label={index === 0 ? "Units" : undefined}
                aria-label="Units"
                type="number"
                inputMode="numeric"
                min="0"
                max={MAX_PER_FLOOR}
                value={units}
                onChange={(e) => updateException(id, "units", e.target.value)}
                className="w-20 shrink-0"
              />
              <button
                type="button"
                onClick={() => removeException(id)}
                aria-label={`Remove exception ${index + 1}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}

          {exceptions.length <= totalFloors && (
            <Button variant="outline" size="sm" onClick={addException} className="w-fit">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Exception
            </Button>
          )}
        </FormSection>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {isValid && (
              <>
                <p className="font-semibold">{toBanglaNumber(total)}টি ইউনিট তৈরি হবে</p>
                <p className="text-xs text-muted">ভাড়া ও রুমের তথ্য পরে একসাথে দেওয়া যাবে।</p>
                <p className="text-xs text-muted">{floorName(totalFloors)} পর্যন্ত। যে নাম আগে থেকেই আছে সেটা বাদ যাবে।</p>
              </>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Units
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default QuickAddUnitsModal;
