"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import PersonEditor from "./PersonEditor";
import TermsCard from "./TermsCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import { emptyPerson, extraErrors, isBlankPerson, isPersonComplete, personLabel } from "@/lib/formPeople";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { FORM_TYPE_LABELS, GENDERS } from "@/lib/tenantFormOptions";
import { toBanglaNumber, toEnglishNumber } from "@/lib/toBanglaNumber";
import { useGetPublicFormSignatureMutation, useSubmitPublicFormMutation } from "@/redux/features/tenantForm/tenantFormApi";

const SIGNATURE_MINUTES = 30;
const draftKey = (token) => `houseone-form-${token}`;

// নেট কেটে গেলে বা পেজ বন্ধ হলেও লেখা থাকে। NID নম্বর ফোনে রাখা হয় না
const readDraft = (token, status) => {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey(token)));
    return draft?.status === status ? draft : null;
  } catch {
    return null;
  }
};

const saveDraft = (token, draft) => {
  try {
    localStorage.setItem(draftKey(token), JSON.stringify({ ...draft, people: draft.people.map((person) => ({ ...person, nid: "" })) }));
  } catch {
    // Private window এ জায়গা না থাকলেও ফর্ম চলবে
  }
};

const clearDraft = (token) => {
  try {
    localStorage.removeItem(draftKey(token));
  } catch {
    // কিছু করার নেই
  }
};

const initialPeople = (values, mainCount) => {
  const saved = values.people.map((person) => ({ ...emptyPerson(), ...person, key: person._id, age: person.age ?? "" }));
  return [...saved, ...Array.from({ length: Math.max(0, mainCount - saved.length) }, emptyPerson)];
};

const BackLink = ({ onClick }) => (
  <button type="button" onClick={onClick} className="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-muted">
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    সবার তালিকা
  </button>
);

const EditLink = ({ onClick }) => (
  <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-muted">
    <Pencil className="h-4 w-4" aria-hidden="true" />
    সম্পাদনা
  </button>
);

const Summary = ({ label, value }) =>
  value ? (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm wrap-break-word">{value}</dd>
    </div>
  ) : null;

const PublicFormFlow = ({ token, form, onDone }) => {
  const { config, values } = form;
  const { fields, mainCount, maxMembers, othersFull, questions, rules = [] } = config;
  const labelFor = (index) => personLabel(index, { mainCount, occupantType: form.occupantType });

  const [draft] = useState(() => readDraft(token, form.status));
  const [people, setPeople] = useState(draft?.people || initialPeople(values, mainCount));
  const [totalPeople, setTotalPeople] = useState(draft?.totalPeople ?? (values.totalPeople || ""));
  const [extra, setExtra] = useState(
    draft?.extra || { companyName: values.companyName, tradeLicense: values.tradeLicense, emergencyName: values.emergencyName, emergencyPhone: values.emergencyPhone }
  );
  const [answers, setAnswers] = useState(draft?.answers || questions.map((_, index) => values.answers[index]?.answer || ""));
  const [consent, setConsent] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [view, setView] = useState({ name: "list" });

  const signatureRef = useRef(null);
  const [getSignature] = useGetPublicFormSignatureMutation();
  const [submitForm, { isLoading }] = useSubmitPublicFormMutation();

  useEffect(() => {
    saveDraft(token, { status: form.status, people, totalPeople, extra, answers });
  }, [token, form.status, people, totalPeople, extra, answers]);

  // ফোনের Back বোতাম ফর্ম থেকে বের না করে তালিকায় ফেরায়
  useEffect(() => {
    const handleBack = () => {
      setView({ name: "list" });
      // খুলে খালি রেখে ফিরে এলে কার্ডটা থাকে না
      setPeople((prev) => prev.filter((person, index) => index < mainCount || !isBlankPerson(person)));
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [mainCount]);

  const open = (next) => {
    if (view.name === "list") window.history.pushState({ formView: true }, "");
    setView(next);
    window.scrollTo({ top: 0 });
  };
  const close = () => window.history.back();

  // একই স্বাক্ষরে অনেক ছবি যায়, তাই ২০টি ছবিতেও Limit এ পড়ে না
  const signature = async () => {
    const cached = signatureRef.current;
    if (cached && Date.now() - cached.at < SIGNATURE_MINUTES * 60 * 1000) return cached.value;

    const { data } = await getSignature(token).unwrap();
    signatureRef.current = { value: data, at: Date.now() };
    return data;
  };

  const isFull = (index) => index < mainCount || othersFull;
  const hasExtra = fields.emergency !== "Off" || fields.companyName !== "Off" || fields.tradeLicense !== "Off" || questions.length > 0;
  const isExtraComplete = Object.keys(extraErrors(extra, fields)).length === 0;

  const doneCount = people.filter((person, index) => isPersonComplete(person, fields, isFull(index))).length;

  const changeExtra = (key, value) => {
    setExtra((prev) => ({ ...prev, [key]: value }));
    setErrors(({ [key]: removed, ...rest }) => rest);
  };

  const handleAdd = () => {
    const person = emptyPerson();
    setPeople((prev) => [...prev, person]);
    open({ name: "person", key: person.key });
  };

  const handleRemove = (key) => {
    setPeople((prev) => prev.filter((person) => person.key !== key));
    close();
  };

  const handlePreview = () => {
    const newErrors = {};
    const count = people.length;
    if (!othersFull && (Number(totalPeople) < count || Number(totalPeople) > maxMembers)) {
      newErrors.totalPeople = `মোট সংখ্যা ${toBanglaNumber(count)} থেকে ${toBanglaNumber(maxMembers)} এর মধ্যে লিখুন`;
    }
    setErrors(newErrors);

    const unfinished = people.findIndex((person, index) => !isPersonComplete(person, fields, isFull(index)));
    if (unfinished !== -1) {
      toast.error(`${labelFor(unfinished)} এর তথ্য বাকি আছে`);
      return;
    }
    if (hasExtra && !isExtraComplete) {
      toast.error("অন্যান্য তথ্য অংশটি পূরণ করুন");
      return;
    }
    if (Object.keys(newErrors).length > 0) return;

    open({ name: "preview" });
  };

  const handleSubmit = async () => {
    if (form.terms && !termsAccepted) {
      setErrors({ terms: "ভাড়ার হিসাবে সম্মতি দিন" });
      return;
    }
    if (rules.length > 0 && !rulesAccepted) {
      setErrors({ rules: "নিয়মে সম্মতি দিন" });
      return;
    }
    if (!consent) {
      setErrors({ consent: "সম্মতিতে টিক দিন" });
      return;
    }

    try {
      const payload = people.map(({ key, nidLast4, ...person }) => person);
      await submitForm({ token, people: payload, totalPeople: Number(totalPeople), ...extra, answers, consent, rulesAccepted, termsAccepted }).unwrap();
      clearDraft(token);
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, "জমা হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (view.name === "person") {
    const index = people.findIndex((person) => person.key === view.key);
    if (index === -1) return null;

    return (
      <PersonEditor
        key={view.key}
        person={people[index]}
        index={index}
        title={labelFor(index)}
        isFull={isFull(index)}
        fields={fields}
        canRemove={index >= mainCount}
        getSignature={signature}
        onChange={(next) => setPeople((prev) => prev.map((person) => (person.key === view.key ? next : person)))}
        onRemove={() => handleRemove(view.key)}
        onClose={close}
      />
    );
  }

  if (view.name === "extra") {
    const handleExtraDone = () => {
      const found = extraErrors(extra, fields);
      setErrors(found);
      if (Object.keys(found).length === 0) close();
    };
    const optional = (field, label) => (fields[field] === "Required" ? label : `${label} (ঐচ্ছিক)`);

    return (
      <div className="flex flex-col gap-4">
        <BackLink onClick={close} />
        <h1 className="text-lg font-semibold">অন্যান্য তথ্য</h1>
        <Card className="flex flex-col gap-4">
          {fields.companyName !== "Off" && (
            <Input id="companyName" label={optional("companyName", "প্রতিষ্ঠান বা দোকানের নাম")} value={extra.companyName} onChange={(e) => changeExtra("companyName", e.target.value)} error={errors.companyName} />
          )}
          {fields.tradeLicense !== "Off" && (
            <Input id="tradeLicense" label={optional("tradeLicense", "Trade License নম্বর")} value={extra.tradeLicense} onChange={(e) => changeExtra("tradeLicense", e.target.value)} error={errors.tradeLicense} />
          )}
          {fields.emergency !== "Off" && (
            <>
              <Input id="emergencyName" label={optional("emergency", "জরুরি যোগাযোগের নাম")} value={extra.emergencyName} onChange={(e) => changeExtra("emergencyName", e.target.value)} error={errors.emergencyName} />
              <Input
                id="emergencyPhone"
                type="tel"
                inputMode="tel"
                label={optional("emergency", "জরুরি যোগাযোগের মোবাইল")}
                placeholder="01XXXXXXXXX"
                value={extra.emergencyPhone}
                onChange={(e) => changeExtra("emergencyPhone", toEnglishNumber(e.target.value))}
                error={errors.emergencyPhone}
              />
            </>
          )}
          {questions.map((question, index) => (
            <Input
              key={index}
              id={`answer${index}`}
              label={question}
              value={answers[index]}
              onChange={(e) => setAnswers((prev) => prev.map((answer, answerIndex) => (answerIndex === index ? e.target.value : answer)))}
            />
          ))}
        </Card>
        <Button size="lg" fullWidth onClick={handleExtraDone}>
          সম্পন্ন
        </Button>
      </div>
    );
  }

  if (view.name === "preview") {
    return (
      <div className="flex flex-col gap-4">
        <BackLink onClick={close} />
        <div>
          <h1 className="text-lg font-semibold">একবার দেখে নিন</h1>
          <p className="text-sm text-muted">সব ঠিক থাকলে নিচে জমা দিন।</p>
        </div>

        {!othersFull && <p className="text-sm">মোট {toBanglaNumber(totalPeople)} জন থাকবেন</p>}

        {people.map((person, index) => {
          const images = [person.nidFront && "NID সামনে", person.nidBack && "NID পেছনে", person.photo && "ছবি"].filter(Boolean);
          const last4 = person.nid ? person.nid.slice(-4) : person.nidLast4;
          return (
            <Card key={person.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{labelFor(index)}</h2>
                <EditLink onClick={() => setView({ name: "person", key: person.key })} />
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <Summary label="নাম" value={person.name} />
                <Summary label="মোবাইল" value={person.phone} />
                <Summary label="লিঙ্গ" value={GENDERS.find(({ value }) => value === person.gender)?.label} />
                <Summary label="বয়স" value={person.age && toBanglaNumber(person.age)} />
                <Summary label="সম্পর্ক" value={person.relation} />
                <Summary label="পেশা" value={person.occupation} />
                <Summary label="কর্মস্থল" value={person.workplace} />
                <Summary label="স্থায়ী ঠিকানা" value={person.permanentAddress} />
                <Summary label="আগের ঠিকানা" value={person.previousAddress} />
                <Summary label="NID" value={last4 && `শেষ ৪ সংখ্যা ${last4}`} />
                <Summary label="ছবি" value={images.join(", ")} />
              </dl>
            </Card>
          );
        })}

        {hasExtra && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">অন্যান্য তথ্য</h2>
              <EditLink onClick={() => setView({ name: "extra" })} />
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <Summary label="প্রতিষ্ঠান" value={extra.companyName} />
              <Summary label="Trade License" value={extra.tradeLicense} />
              <Summary label="জরুরি যোগাযোগ" value={[extra.emergencyName, extra.emergencyPhone].filter(Boolean).join(", ")} />
              {questions.map((question, index) => (
                <Summary key={index} label={question} value={answers[index]} />
              ))}
            </dl>
          </Card>
        )}

        {form.terms && (
          <>
            <TermsCard terms={form.terms} />
            <Card>
              <Checkbox
                id="termsAccepted"
                label="আমি এই ভাড়া ও চার্জে রাজি"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  setErrors({});
                }}
              />
              {errors.terms && <p className="text-sm text-danger">{errors.terms}</p>}
            </Card>
          </>
        )}

        {rules.length > 0 && (
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">বাড়ির নিয়ম</h2>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
              {rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ol>
            <Checkbox
              id="rulesAccepted"
              label="আমি সব নিয়ম পড়েছি এবং মেনে চলব"
              checked={rulesAccepted}
              onChange={(e) => {
                setRulesAccepted(e.target.checked);
                setErrors({});
              }}
            />
            {errors.rules && <p className="text-sm text-danger">{errors.rules}</p>}
          </Card>
        )}

        <Card>
          <Checkbox
            id="consent"
            label="আমার দেওয়া তথ্য সঠিক"
            description="আমি জানি এই তথ্য ও ছবি বাড়িওয়ালার কাছে থাকবে।"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setErrors({});
            }}
          />
          {errors.consent && <p className="text-sm text-danger">{errors.consent}</p>}
        </Card>

        <Button size="lg" fullWidth isLoading={isLoading} onClick={handleSubmit}>
          ফর্ম জমা দিন
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold">ভাড়াটিয়ার তথ্য ফর্ম</h1>
        <p className="text-sm text-muted">
          {form.propertyName}, {form.unitName} · {FORM_TYPE_LABELS[form.occupantType]}
        </p>
      </div>

      {form.terms && <TermsCard terms={form.terms} />}

      {form.ownerNote && (
        <p className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning-foreground">বাড়িওয়ালার নোট: {form.ownerNote}</p>
      )}

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">প্রত্যেকের কার্ডে চেপে তথ্য দিন</p>
          <span data-done-count className="shrink-0 text-sm text-muted">
            {toBanglaNumber(doneCount)} / {toBanglaNumber(people.length)} সম্পূর্ণ
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-primary-soft">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / people.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {people.map((person, index) => {
          const isDone = isPersonComplete(person, fields, isFull(index));
          return (
            <button
              key={person.key}
              type="button"
              data-person-card={index}
              onClick={() => open({ name: "person", key: person.key })}
              className="flex min-h-28 min-w-0 flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-3 text-left shadow-card"
            >
              <span className="flex flex-col items-start gap-1">
                {index < mainCount && <Badge variant="info">প্রধান</Badge>}
                <span className="block w-full text-sm font-medium wrap-break-word">{person.name || labelFor(index)}</span>
              </span>
              {isDone ? (
                <span className="flex items-center gap-1 text-xs text-foreground">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  সম্পূর্ণ
                </span>
              ) : (
                <span className="text-xs text-muted">{isFull(index) ? "তথ্য বাকি" : "ঐচ্ছিক"}</span>
              )}
            </button>
          );
        })}

        {people.length < maxMembers && (
          <button
            type="button"
            data-add-person
            onClick={handleAdd}
            className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border p-3 text-sm text-muted"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {form.occupantType === "Shop" ? "অংশীদার যোগ করুন" : "সদস্য যোগ করুন"}
          </button>
        )}
      </div>

      <p className="text-sm text-muted">
        সর্বোচ্চ {toBanglaNumber(maxMembers)} জন।
        {othersFull ? " যাঁরা থাকবেন, সবার তথ্য দিন।" : " প্রধানদের তথ্য লাগবে, বাকিদের তথ্য না দিলেও চলবে।"}
      </p>

      {!othersFull && (
        <Input
          id="totalPeople"
          type="number"
          inputMode="numeric"
          min="1"
          max={maxMembers}
          label="মোট কতজন থাকবেন"
          value={totalPeople}
          onChange={(e) => {
            setTotalPeople(e.target.value);
            setErrors(({ totalPeople: removed, ...rest }) => rest);
          }}
          error={errors.totalPeople}
        />
      )}

      {hasExtra && (
        <button
          type="button"
          data-extra-card
          onClick={() => open({ name: "extra" })}
          className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 text-left shadow-card"
        >
          <span className="text-sm font-medium">অন্যান্য তথ্য</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
            {isExtraComplete && <Check className="h-4 w-4" aria-hidden="true" />}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      )}

      <Button size="lg" fullWidth onClick={handlePreview}>
        Preview দেখুন
      </Button>
    </div>
  );
};

export default PublicFormFlow;
