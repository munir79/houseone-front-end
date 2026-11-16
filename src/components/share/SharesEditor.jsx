"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber, toEnglishNumber } from "@/lib/toBanglaNumber";
import { floorName } from "@/lib/unitOptions";
import { useSetSharesMutation } from "@/redux/features/share/shareApi";

const MODES = { percent: "শতাংশে", flat: "ফ্ল্যাট ভাগে" };

// ভাগ ঠিক করা — প্রথমবার এই মাস থেকে, পরে বদলালে পরের মাস থেকে
const SharesEditor = ({ propertyId, members, units, start, isFirst, onClose }) => {
  const [mode, setMode] = useState(start?.mode ?? "percent");
  const [percents, setPercents] = useState(() =>
    Object.fromEntries(members.map(({ _id }) => [_id, String(start?.percents?.find(({ user }) => user === _id)?.percent ?? (members.length === 2 ? 50 : ""))]))
  );
  const [flats, setFlats] = useState(() => Object.fromEntries(units.map(({ _id }) => [_id, start?.flats?.find(({ unit }) => unit === _id)?.owner ?? members.find(({ isMain }) => isMain)?._id])));
  const [picked, setPicked] = useState([]);
  const [setShares, { isLoading }] = useSetSharesMutation();

  const total = Object.values(percents).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const ownerOptions = members.map(({ _id, name }) => ({ value: _id, label: name }));
  const countOf = (ownerId) => Object.values(flats).filter((owner) => owner === ownerId).length;
  const sortedUnits = [...units].sort((a, b) => b.floor - a.floor || a.name.localeCompare(b.name));

  const assignPicked = (ownerId) => {
    setFlats((prev) => ({ ...prev, ...Object.fromEntries(picked.map((id) => [id, ownerId])) }));
    setPicked([]);
  };

  const handleSave = async () => {
    if (mode === "percent" && total !== 100) {
      toast.error("সবার ভাগ মিলিয়ে ১০০% হতে হবে");
      return;
    }
    const body =
      mode === "percent"
        ? { mode, percents: members.map(({ _id }) => ({ user: _id, percent: Number(percents[_id] || 0) })) }
        : { mode, flats: units.map(({ _id }) => ({ unit: _id, owner: flats[_id] })) };
    try {
      await setShares({ propertyId, ...body }).unwrap();
      toast.success(isFirst ? "ভাগ ঠিক হয়েছে, এই মাস থেকে চালু" : "ভাগ সেভ হয়েছে, পরের মাস থেকে চালু হবে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Set Shares" onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">{isFirst ? "প্রথম ভাগ এই মাস থেকেই চালু হবে।" : "বদলালে পরের মাসের ১ তারিখ থেকে চালু হবে। আগের মাসের হিসাব আগের ভাগেই থাকবে।"}</p>
        <SegmentedControl label="Share mode" options={Object.values(MODES)} value={MODES[mode]} onChange={(label) => setMode(label === MODES.flat ? "flat" : "percent")} />

        {mode === "percent" ? (
          <div className="flex flex-col gap-3">
            {members.map(({ _id, name, isMain }) => (
              <div key={_id} className="flex items-end gap-3">
                <p className="min-w-0 flex-1 pb-3 text-sm font-medium wrap-break-word">
                  {name}
                  {isMain && <span className="text-muted"> · মূল মালিক</span>}
                </p>
                <Input
                  id={`percent-${_id}`}
                  inputMode="numeric"
                  label="ভাগ (%)"
                  value={percents[_id]}
                  onChange={(e) => setPercents((prev) => ({ ...prev, [_id]: toEnglishNumber(e.target.value).replace(/\D/g, "").slice(0, 3) }))}
                  className="w-28 shrink-0"
                />
              </div>
            ))}
            <p data-percent-total className={cn("text-sm font-semibold", total === 100 ? "text-success-foreground" : "text-danger")}>
              মোট {toBanglaNumber(total)}% {total === 100 ? "✓" : "— ১০০% হতে হবে"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              {members.map(({ _id, name }) => (
                <span key={_id} className="rounded-full bg-background px-3 py-1">
                  {name}: <span className="font-semibold">{toBanglaNumber(countOf(_id))}টি ফ্ল্যাট</span>
                </span>
              ))}
            </div>
            {picked.length > 0 && (
              <div data-assign-bar className="flex flex-wrap items-center gap-2 rounded-xl bg-primary-soft px-3 py-2">
                <span className="text-sm font-semibold">{toBanglaNumber(picked.length)}টি বাছা হয়েছে →</span>
                {members.map(({ _id, name }) => (
                  <Button key={_id} variant="outline" size="sm" onClick={() => assignPicked(_id)}>
                    {name}-কে দিন
                  </Button>
                ))}
              </div>
            )}
            <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-xl border border-border">
              {sortedUnits.map((unit) => (
                <li key={unit._id} data-share-flat={unit.name} className="flex items-center gap-2 pr-2 pl-3">
                  <Checkbox
                    id={`pick-${unit._id}`}
                    label={unit.name}
                    description={floorName(unit.floor)}
                    checked={picked.includes(unit._id)}
                    onChange={(e) => setPicked((prev) => (e.target.checked ? [...prev, unit._id] : prev.filter((id) => id !== unit._id)))}
                  />
                  <Select
                    id={`owner-${unit._id}`}
                    compact
                    aria-label={`Owner of ${unit.name}`}
                    options={ownerOptions}
                    value={flats[unit._id]}
                    onChange={(e) => setFlats((prev) => ({ ...prev, [unit._id]: e.target.value }))}
                    className="ml-auto w-40 shrink-0"
                  />
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">যার ফ্ল্যাট তার আয় ও সেই ফ্ল্যাটের খরচ। পুরো বাড়ির খরচ ফ্ল্যাটের সংখ্যা হারে ভাগ হবে। কয়েকটি টিক দিয়ে একবারে মালিক বাছা যায়।</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} onClick={handleSave} disabled={mode === "flat" && units.length === 0}>
            Save Shares
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SharesEditor;
