"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import ShareForm from "./ShareForm";
import MarketFormLink from "@/components/market/MarketFormLink";
import TermsEditor from "./TermsEditor";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { expectedAdvance, termsTotal } from "@/lib/formTerms";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { FORM_TYPES, MAIN_COUNT_OPTIONS } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useCreateTenantFormMutation, useGetFormSettingsQuery } from "@/redux/features/tenantForm/tenantFormApi";

const TERM_KEYS = ["charges", "advanceMonths", "advanceBase", "electricity", "gas", "dueDay"];
const pickTerms = (source) => Object.fromEntries(TERM_KEYS.map((key) => [key, source[key]]));
const sameTerms = (a, b) => JSON.stringify(pickTerms(a)) === JSON.stringify(pickTerms(b));

const LinkAction = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
    {children}
  </button>
);

// onCreated — লিংক তৈরি হলে; তখন খোলা ফর্ম থাকলেও Modal বন্ধ হয় না, যাতে লিংক শেয়ার করা যায়
const HouseSendForm = ({ unit, onClose, onCreated }) => {
  const [occupantType, setOccupantType] = useState("Family");
  const [limits, setLimits] = useState({});
  const [editedTerms, setEditedTerms] = useState({});
  const [rent, setRent] = useState(unit.rent ?? "");
  // null মানে হিসাব নিজে থেকে চলছে, বাড়িওয়ালা "হাতে লিখুন" চাপলে তবেই সংখ্যা
  const [manualAdvance, setManualAdvance] = useState(null);
  const [saveTo, setSaveTo] = useState("Unit");
  const [form, setForm] = useState(null);

  const propertyId = unit.property._id;
  const { data } = useGetFormSettingsQuery(propertyId);
  const [createForm, { isLoading }] = useCreateTenantFormMutation();

  // ধরন বদলালে সেই ধরনের হিসাব — ফ্ল্যাটের নিজের হিসাব থাকলে সেটাই
  const config = data?.data?.[occupantType];
  const maxMembers = limits.maxMembers ?? unit.maxPeople ?? config?.maxMembers ?? "";
  const mainCount = limits.mainCount ?? config?.mainCount ?? 2;
  const flatTerms = unit.formTerms?.[occupantType];
  const terms = editedTerms[occupantType] ?? (config && { ...pickTerms(config), ...flatTerms });

  const changeTerms = (next) => setEditedTerms((prev) => ({ ...prev, [occupantType]: next }));

  const isEdited = Boolean(terms && config && !sameTerms(terms, flatTerms ? { ...config, ...flatTerms } : config));
  const isOwnTerms = Boolean(terms && config && !sameTerms(terms, config));
  const hasNoCharges = Boolean(terms && terms.charges.every(({ amount }) => !Number(amount)));

  const expected = terms ? expectedAdvance({ ...terms, rent }) : 0;
  const baseAmount = terms?.advanceBase === "Total" ? termsTotal(rent, terms.charges) : Number(rent || 0);

  const handleWriteHere = () => {
    if (terms.charges.length === 0) changeTerms({ ...terms, charges: [{ name: "", amount: 0 }] });
    // নতুন সারি বসার পরে ঘরটি পাওয়া যায়
    setTimeout(() => document.getElementById(terms.charges.length === 0 ? "chargeName-0" : "chargeAmount-0")?.focus());
  };

  const handleCreate = async () => {
    const max = Number(maxMembers);
    if (!max || max < Number(mainCount)) {
      toast.error("সর্বোচ্চ সদস্য সংখ্যা ঠিক করে লিখুন");
      return;
    }
    if (rent === "") {
      toast.error("বাসা ভাড়া লিখুন");
      return;
    }
    if (terms.advanceMonths === "" || terms.charges.some(({ name, amount }) => !name.trim() || amount === "")) {
      toast.error("Advance-এর মাস দিন, আর প্রতিটি চার্জের নাম ও টাকা লিখুন, অথবা মুছে দিন");
      return;
    }

    try {
      const response = await createForm({
        unitId: unit._id,
        occupantType,
        maxMembers: max,
        mainCount: Number(mainCount),
        saveTo: isEdited ? saveTo : "Unit",
        terms: { ...terms, rent, advance: manualAdvance ?? "" },
      }).unwrap();
      onCreated?.();
      setForm(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "লিংক তৈরি হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={`Send Form for ${unit.name}`} onClose={onClose} size="lg">
      {form ? (
        <ShareForm form={form} />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">ভাড়াটিয়া এই হিসাব দেখে রাজি হয়ে নিজের তথ্য দেবেন। আপনি দেখে Approve করলে সব এই ইউনিটে বসে যাবে।</p>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Tenant type</p>
            <div>
              <SegmentedControl
                label="Tenant type"
                options={FORM_TYPES}
                value={occupantType}
                onChange={(next) => {
                  setOccupantType(next);
                  setLimits(({ maxMembers: keep }) => (keep === undefined ? {} : { maxMembers: keep }));
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input id="sendMax" type="number" inputMode="numeric" min="1" max="30" label="Maximum people" value={maxMembers} onChange={(e) => setLimits((prev) => ({ ...prev, maxMembers: e.target.value }))} />
            <Select id="sendMain" label="প্রধান দায়িত্বশীল" options={MAIN_COUNT_OPTIONS} value={String(mainCount)} onChange={(e) => setLimits((prev) => ({ ...prev, mainCount: e.target.value }))} />
            <Input id="sendRent" type="number" inputMode="numeric" min="0" label="বাসা ভাড়া (৳)" value={rent} onChange={(e) => setRent(e.target.value === "" ? "" : Number(e.target.value))} className="col-span-2 sm:col-span-1" />
          </div>

          {terms ? (
            <>
              {hasNoCharges && (
                <div className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-warning-foreground">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {occupantType}-এর চার্জ এখনো সেট করা হয়নি
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <LinkAction onClick={handleWriteHere}>এখানেই লিখুন</LinkAction>
                    <Link href={`/properties/${propertyId}/settings?view=charges&type=${occupantType}`} target="_blank" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
                      Charges tab-এ যান
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span>{isOwnTerms ? "এই ফ্ল্যাটের নিজের হিসাব" : "বাড়ির সেটিং থেকে"}</span>
                {isOwnTerms && <LinkAction onClick={() => changeTerms(pickTerms(config))}>বাড়ির সেটিংয়ে ফিরুন</LinkAction>}
              </div>

              <TermsEditor value={terms} onChange={changeTerms} />

              <div className="flex flex-col gap-1">
                <Input
                  id="sendAdvance"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  label="Advance (৳)"
                  readOnly={manualAdvance === null}
                  value={manualAdvance ?? expected}
                  onChange={(e) => setManualAdvance(e.target.value)}
                  className={manualAdvance === null ? "[&_input]:font-semibold" : undefined}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p data-advance-sum className="text-sm text-muted">
                    {manualAdvance === null ? "" : "হিসাব অনুযায়ী "}
                    {formatMoney(baseAmount)} ({terms.advanceBase === "Total" ? "মোট ভাড়া" : "বাসা ভাড়া"}) × {toBanglaNumber(terms.advanceMonths || 0)} মাস
                    {manualAdvance === null ? "" : ` = ${formatMoney(expected)}`}
                  </p>
                  <LinkAction onClick={() => setManualAdvance(manualAdvance === null ? String(expected) : null)}>{manualAdvance === null ? "হাতে লিখুন" : "ফিরিয়ে আনুন"}</LinkAction>
                </div>
              </div>

              <p data-send-total className="flex justify-between gap-3 rounded-xl bg-primary-soft px-3 py-2 text-base font-bold">
                <span>মোট প্রতি মাসে</span>
                <span className="tabular-nums">{formatMoney(termsTotal(rent, terms.charges))}</span>
              </p>

              {isEdited && (
                <Select
                  id="saveTo"
                  label="এই বদল কোথায় মনে থাকবে"
                  options={[
                    { value: "Unit", label: "শুধু এই ফ্ল্যাট" },
                    { value: "House", label: `পুরো বাড়ির সব ${occupantType} ফ্ল্যাট` },
                  ]}
                  value={saveTo}
                  onChange={(e) => setSaveTo(e.target.value)}
                />
              )}
            </>
          ) : (
            <Skeleton className="h-40 w-full rounded-xl" />
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isLoading} disabled={!terms} onClick={handleCreate}>
              Create Link
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// মার্কেটের দোকানে চার্জের হিসাব নেই — শুধু ব্যবসায়ীর তথ্যের লিংক
const SendFormModal = ({ unit, onClose, onCreated }) =>
  unit.property?.kind === "market" ? <MarketFormLink unit={unit} onClose={onClose} onCreated={onCreated} /> : <HouseSendForm unit={unit} onClose={onClose} onCreated={onCreated} />;

export default SendFormModal;
