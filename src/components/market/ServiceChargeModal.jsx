"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Button, { buttonClasses } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { serviceChargeMessage, whatsappLink } from "@/lib/marketOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { floorName } from "@/lib/unitOptions";
import { useChangeServiceChargeMutation } from "@/redux/features/property/propertyApi";

const SCOPES = { all: "সব দোকান", floor: "একটা তলা", block: "একটা ব্লক" };
const MODES = { set: "নতুন অঙ্ক", add: "এত টাকা বাড়ান" };
const keyOf = (map, label) => Object.keys(map).find((key) => map[key] === label);

const Row = ({ row, children }) => (
  <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
    <span className="min-w-0">
      <span className="font-medium">{row.unitName}</span>
      {row.businessName && <span className="text-muted"> · {row.businessName}</span>}
    </span>
    {children}
  </li>
);

// একসাথে সার্ভিস চার্জ বদল — আগে দেখা, তারপর নিশ্চিত; পরের বিল থেকে কার্যকর
const ServiceChargeModal = ({ property, units, onClose }) => {
  const floors = [...new Set(units.map(({ floor }) => floor))].sort((a, b) => a - b);
  const blocks = property.blocks ?? [];
  const scopes = blocks.length > 0 ? SCOPES : { all: SCOPES.all, floor: SCOPES.floor };

  const [form, setForm] = useState({ scope: "all", floor: String(floors[0] ?? 0), block: blocks[0] ?? "", mode: "set", amount: "", skipDifferent: true });
  const [include, setInclude] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [change, { isLoading }] = useChangeServiceChargeMutation();

  const set = (update) => {
    setForm((prev) => ({ ...prev, ...update }));
    setPreview(null);
  };

  const bodyOf = (extra = {}) => ({ id: property._id, ...form, floor: Number(form.floor), amount: Number(form.amount), include, ...extra });

  const handlePreview = async (nextInclude = include) => {
    if (form.amount === "" || (form.mode === "add" && Number(form.amount) === 0)) {
      toast.error("টাকার অঙ্ক লিখুন");
      return;
    }
    try {
      const { data } = await change(bodyOf({ include: nextInclude })).unwrap();
      setPreview(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "দেখানো যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  const toggleInclude = (unitId) => {
    const next = include.includes(unitId) ? include.filter((id) => id !== unitId) : [...include, unitId];
    setInclude(next);
    handlePreview(next);
  };

  const handleApply = async () => {
    try {
      const { data } = await change(bodyOf({ apply: true })).unwrap();
      toast.success(`${toBanglaNumber(data.changed)}টি দোকানের সার্ভিস চার্জ বদলেছে`);
      setResult(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "বদলানো যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  const changing = preview?.rows.filter(({ status }) => status === "change") ?? [];
  const zeroShops = preview?.rows.filter(({ current }) => current === 0) ?? [];
  const different = preview?.rows.filter(({ status }) => status === "different") ?? [];

  if (result) {
    const rented = result.rows.filter(({ status, tenancyId }) => status === "change" && tenancyId);
    return (
      <Modal title="সার্ভিস চার্জ বদল" onClose={onClose} size="lg">
        <div data-service-done className="flex flex-col gap-4">
          <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success-foreground">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            {toBanglaNumber(result.changed)}টি দোকানে বদলেছে, পরের বিল থেকে কার্যকর
          </p>
          {rented.length > 0 && (
            <>
              <p className="text-sm text-muted">ব্যবসায়ীদের জানিয়ে দিন:</p>
              <ul className="divide-y divide-border">
                {rented.map((row) => (
                  <Row key={row.unitId} row={row}>
                    <a
                      href={whatsappLink(row.tenantPhone, serviceChargeMessage({ ...row, propertyName: property.name }))}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses({ variant: "outline", size: "sm" })}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      WhatsApp
                    </a>
                  </Row>
                ))}
              </ul>
            </>
          )}
          <Button onClick={onClose} className="w-full sm:w-fit sm:self-end">
            বন্ধ করুন
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="সার্ভিস চার্জ বদল" onClose={onClose} size="lg">
      <div data-service-charge className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">কোথায়</p>
          <SegmentedControl label="Where to change" options={Object.values(scopes)} value={scopes[form.scope]} onChange={(label) => set({ scope: keyOf(scopes, label) })} />
        </div>
        {form.scope === "floor" && <Select id="serviceFloor" label="তলা" options={floors.map((floor) => ({ value: String(floor), label: floorName(floor) }))} value={form.floor} onChange={(e) => set({ floor: e.target.value })} />}
        {form.scope === "block" && <Select id="serviceBlock" label="ব্লক" options={blocks.map((block) => ({ value: block, label: `ব্লক ${block}` }))} value={form.block} onChange={(e) => set({ block: e.target.value })} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">কীভাবে</p>
            <SegmentedControl label="How to change" options={Object.values(MODES)} value={MODES[form.mode]} onChange={(label) => set({ mode: keyOf(MODES, label) })} />
          </div>
          <Input
            id="serviceAmount"
            type="number"
            inputMode="numeric"
            label={form.mode === "set" ? "নতুন সার্ভিস চার্জ (৳)" : "কত টাকা বাড়বে (কমাতে − দিন)"}
            value={form.amount}
            onChange={(e) => set({ amount: e.target.value })}
          />
        </div>

        <Checkbox
          id="skipDifferent"
          label="যে দোকানের সার্ভিস চার্জ বাকিদের থেকে আলাদা, সেগুলো বাদ রাখুন"
          checked={form.skipDifferent}
          onChange={(e) => set({ skipDifferent: e.target.checked })}
        />

        {!preview ? (
          <Button variant="outline" isLoading={isLoading} onClick={() => handlePreview()} className="w-full sm:w-fit">
            আগে দেখুন
          </Button>
        ) : (
          <div data-service-preview className="flex flex-col gap-3">
            <div className="rounded-xl border border-border px-4 py-2">
              <p className="pt-1 text-sm font-semibold">বদলাবে ({toBanglaNumber(changing.length)}টি)</p>
              {changing.length === 0 ? (
                <p className="py-2 text-sm text-muted">কোনো দোকানে বদল নেই।</p>
              ) : (
                <ul className="divide-y divide-border">
                  {changing.map((row) => (
                    <Row key={row.unitId} row={row}>
                      <span className="tabular-nums">
                        {formatMoney(row.current)} → <span className="font-semibold">{formatMoney(row.next)}</span>
                      </span>
                    </Row>
                  ))}
                </ul>
              )}
            </div>

            {zeroShops.length > 0 && (
              <div data-zero-suggest className="rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-info-foreground">
                <p className="text-sm font-semibold">
                  এই {toBanglaNumber(zeroShops.length)}টি দোকানে সার্ভিস চার্জ নেই। এদেরও যোগ করবেন?
                </p>
                {zeroShops.map((row) => (
                  <Checkbox
                    key={row.unitId}
                    id={`include-${row.unitId}`}
                    label={`${row.unitName}${row.businessName ? ` · ${row.businessName}` : ""}`}
                    checked={include.includes(String(row.unitId))}
                    onChange={() => toggleInclude(String(row.unitId))}
                  />
                ))}
              </div>
            )}

            {different.length > 0 && (
              <p className="text-sm text-muted">
                আলাদা অঙ্ক বলে বাদ: {different.map((row) => `${row.unitName} (${formatMoney(row.current)})`).join(", ")}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted">পরের বিল থেকে কার্যকর হবে, আগের বিল বদলাবে না। যেকোনো দোকানের সার্ভিস চার্জ পরে আলাদা করেও বদলানো যায়।</p>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} disabled={changing.length === 0} onClick={handleApply}>
            নিশ্চিত করুন ({toBanglaNumber(changing.length)}টি দোকান)
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceChargeModal;
