"use client";

import { useState } from "react";
import { ArrowLeft, Lock, Trash2 } from "lucide-react";
import ImageSlot from "./ImageSlot";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Textarea from "@/components/ui/Textarea";
import { stepErrors, visibleSteps } from "@/lib/formPeople";
import { GENDERS } from "@/lib/tenantFormOptions";
import { toBanglaNumber, toEnglishNumber } from "@/lib/toBanglaNumber";

// একজন মানুষের তথ্য, ধাপে ধাপে — প্রতি ধাপে পরীক্ষা হয়, তাই শেষে গিয়ে ভুল ধরা পড়ে না
const PersonEditor = ({ person, index, title, isFull, fields, canRemove, getSignature, onChange, onRemove, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState({});

  const steps = visibleSteps(fields);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const show = (field) => fields[field] !== "Off";
  const hint = (field, label) => (isFull && fields[field] === "Required" ? label : `${label} (ঐচ্ছিক)`);

  const update = (key, value) => {
    onChange({ ...person, [key]: value });
    setErrors(({ [key]: removed, ...rest }) => rest);
  };
  const change = (key) => (e) => update(key, e.target.value);
  const changeNumber = (key) => (e) => update(key, toEnglishNumber(e.target.value));

  const handleNext = () => {
    const found = stepErrors(step.key, person, fields, isFull);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (isLast) {
      onClose();
      return;
    }
    setStepIndex(stepIndex + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onClose} className="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-muted">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        সবার তালিকা
      </button>

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span data-step-count className="shrink-0 text-sm text-muted">
            ধাপ {toBanglaNumber(stepIndex + 1)} / {toBanglaNumber(steps.length)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-primary-soft">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{step.title}</h2>

        {step.key === "personal" && (
          <>
            <Input id="name" label="পুরো নাম" autoComplete="off" value={person.name} onChange={change("name")} error={errors.name} />
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              label={isFull ? "মোবাইল নম্বর" : "মোবাইল নম্বর (ঐচ্ছিক)"}
              placeholder="01XXXXXXXXX"
              autoComplete="off"
              value={person.phone}
              onChange={changeNumber("phone")}
              error={errors.phone}
            />
            {show("gender") && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">{hint("gender", "লিঙ্গ")}</p>
                <div>
                  <SegmentedControl
                    label="লিঙ্গ"
                    options={GENDERS.map(({ label }) => label)}
                    value={GENDERS.find(({ value }) => value === person.gender)?.label}
                    onChange={(next) => update("gender", GENDERS.find(({ label }) => label === next).value)}
                  />
                </div>
                {errors.gender && <p className="text-sm text-danger">{errors.gender}</p>}
              </div>
            )}
            <Input id="age" type="number" inputMode="numeric" min="0" max="120" label="বয়স (ঐচ্ছিক)" value={person.age} onChange={change("age")} className="max-w-32" />
            {index > 0 && <Input id="relation" label="সম্পর্ক (ঐচ্ছিক)" placeholder="স্ত্রী, ছেলে, ভাই, বন্ধু" value={person.relation} onChange={change("relation")} />}
          </>
        )}

        {step.key === "address" && (
          <>
            {show("occupation") && <Input id="occupation" label={hint("occupation", "পেশা")} value={person.occupation} onChange={change("occupation")} error={errors.occupation} />}
            {show("workplace") && <Input id="workplace" label={hint("workplace", "কর্মস্থলের নাম")} value={person.workplace} onChange={change("workplace")} error={errors.workplace} />}
            {show("permanentAddress") && (
              <Textarea id="permanentAddress" label={hint("permanentAddress", "স্থায়ী ঠিকানা")} value={person.permanentAddress} onChange={change("permanentAddress")} error={errors.permanentAddress} />
            )}
            {show("previousAddress") && (
              <Textarea id="previousAddress" label={hint("previousAddress", "আগের ঠিকানা")} value={person.previousAddress} onChange={change("previousAddress")} error={errors.previousAddress} />
            )}
          </>
        )}

        {step.key === "papers" && (
          <>
            {show("nid") && (
              <Input
                id="nid"
                inputMode="numeric"
                autoComplete="off"
                label={hint("nid", "NID নম্বর")}
                placeholder={person.nidLast4 ? `শেষ ৪ সংখ্যা ${person.nidLast4}, বদলাতে নতুন লিখুন` : "১০ থেকে ১৭ সংখ্যা"}
                value={person.nid}
                onChange={changeNumber("nid")}
                error={errors.nid}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              {show("nidPhoto") && (
                <>
                  <ImageSlot id="nidFront" label={hint("nidPhoto", "NID সামনের পিঠ")} value={person.nidFront} error={errors.nidFront} getSignature={getSignature} onChange={(value) => update("nidFront", value)} />
                  <ImageSlot id="nidBack" label={hint("nidPhoto", "NID পেছনের পিঠ")} value={person.nidBack} error={errors.nidBack} getSignature={getSignature} onChange={(value) => update("nidBack", value)} />
                </>
              )}
              {show("photo") && <ImageSlot id="photo" label={hint("photo", "Passport size ছবি")} value={person.photo} error={errors.photo} getSignature={getSignature} onChange={(value) => update("photo", value)} />}
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              ছবি গোপন থাকবে, শুধু বাড়িওয়ালা দেখতে পারবেন
            </p>
          </>
        )}
      </Card>

      <div className="flex gap-2">
        {stepIndex > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStepIndex(stepIndex - 1)} className="flex-1">
            আগে
          </Button>
        )}
        <Button size="lg" onClick={handleNext} className="flex-1">
          {isLast ? "সম্পন্ন" : "পরে"}
        </Button>
      </div>

      {canRemove && (
        <button type="button" onClick={onRemove} className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm text-danger">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          এই সদস্যকে বাদ দিন
        </button>
      )}
    </div>
  );
};

export default PersonEditor;
