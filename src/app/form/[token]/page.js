"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, FileImage, Lock, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { FORM_TYPE_LABELS } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { uploadImage } from "@/lib/uploadImage";
import {
  useGetPublicFormQuery,
  useGetPublicFormSignatureMutation,
  useSubmitPublicFormMutation,
} from "@/redux/features/tenantForm/tenantFormApi";

const MAX_DOCUMENTS = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EMPTY_MEMBER = { name: "", relation: "", phone: "", occupation: "" };

const Shell = ({ children }) => (
  <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
    <div className="flex justify-center">
      <Logo />
    </div>
    {children}
  </main>
);

const Message = ({ icon: Icon, title, text }) => (
  <Shell>
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon className="h-10 w-10 text-muted" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-muted">{text}</p>
    </Card>
  </Shell>
);

const optional = (state, label) => (state === "Required" ? label : `${label} (ঐচ্ছিক)`);

const FormFields = ({ token, form }) => {
  const { config, values } = form;
  const { fields, maxMembers, questions } = config;

  const inputRef = useRef(null);
  const [person, setPerson] = useState({
    name: values.name,
    phone: values.phone,
    nid: "",
    occupation: values.occupation,
    permanentAddress: values.permanentAddress,
    previousAddress: values.previousAddress,
    workplace: values.workplace,
    companyName: values.companyName,
    emergencyName: values.emergencyName,
    emergencyPhone: values.emergencyPhone,
  });
  const [members, setMembers] = useState(values.members);
  const [answers, setAnswers] = useState(questions.map((_, index) => values.answers[index]?.answer || ""));
  const [documents, setDocuments] = useState(values.documents);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const [getSignature] = useGetPublicFormSignatureMutation();
  const [submitForm, { isLoading }] = useSubmitPublicFormMutation();

  const change = (field) => (e) => {
    setPerson((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors(({ [field]: removed, ...rest }) => rest);
  };

  const changeMember = (index, field, value) => {
    setMembers((prev) => prev.map((member, memberIndex) => (memberIndex === index ? { ...member, [field]: value } : member)));
  };

  const handleFiles = async (event) => {
    const chosen = [...event.target.files];
    event.target.value = "";

    const files = chosen.filter((file) => ALLOWED_TYPES.includes(file.type)).slice(0, MAX_DOCUMENTS - documents.length);
    if (files.length < chosen.length) toast.error("শুধু JPG, PNG বা WebP ছবি, সর্বোচ্চ ৪টি");
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: signature } = await getSignature(token).unwrap();
      const uploaded = await Promise.all(files.map((file) => uploadImage(file, signature)));
      setDocuments((prev) => [...prev, ...uploaded]);
      setErrors(({ documents: removed, ...rest }) => rest);
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    const isRequired = (field) => fields[field] === "Required";

    if (!person.name.trim()) newErrors.name = "আপনার নাম লিখুন";
    if (!person.phone.trim()) newErrors.phone = "মোবাইল নম্বর লিখুন";
    if (isRequired("nid") && !person.nid.trim() && !values.nidLast4) newErrors.nid = "NID নম্বর লিখুন";
    if (isRequired("nidPhoto") && documents.length === 0) newErrors.documents = "NID-এর ছবি দিন";
    if (isRequired("occupation") && !person.occupation.trim()) newErrors.occupation = "পেশা লিখুন";
    if (isRequired("workplace") && !person.workplace.trim()) newErrors.workplace = "কর্মস্থলের নাম লিখুন";
    if (isRequired("companyName") && !person.companyName.trim()) newErrors.companyName = "প্রতিষ্ঠানের নাম লিখুন";
    if (isRequired("permanentAddress") && !person.permanentAddress.trim()) newErrors.permanentAddress = "স্থায়ী ঠিকানা লিখুন";
    if (isRequired("previousAddress") && !person.previousAddress.trim()) newErrors.previousAddress = "আগের ঠিকানা লিখুন";
    if (isRequired("emergency") && !person.emergencyName.trim()) newErrors.emergencyName = "জরুরি যোগাযোগের নাম লিখুন";
    if (isRequired("emergency") && !person.emergencyPhone.trim()) newErrors.emergencyPhone = "জরুরি যোগাযোগের মোবাইল লিখুন";
    if (members.some((member) => !member.name.trim() || !member.relation.trim())) newErrors.members = "প্রতিটি সদস্যের নাম ও সম্পর্ক লিখুন";
    if (!consent) newErrors.consent = "সম্মতিতে টিক দিন";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("লাল চিহ্নিত ঘরগুলো ঠিক করুন");
      return;
    }

    try {
      await submitForm({ token, ...person, members, answers, documents, consent }).unwrap();
      setIsDone(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "জমা হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (isDone) {
    return <Message icon={CheckCircle2} title="ধন্যবাদ, ফর্ম জমা হয়েছে" text="বাড়িওয়ালা আপনার তথ্য দেখে নেবেন। এখন এই পেজ বন্ধ করতে পারেন।" />;
  }

  const show = (field) => fields[field] !== "Off";

  return (
    <Shell>
      <div className="text-center">
        <h1 className="text-xl font-semibold">ভাড়াটিয়ার তথ্য ফর্ম</h1>
        <p className="text-sm text-muted">
          {form.propertyName}, {form.unitName} · {FORM_TYPE_LABELS[form.occupantType]}
        </p>
      </div>

      {form.ownerNote && (
        <p className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning-foreground">বাড়িওয়ালার নোট: {form.ownerNote}</p>
      )}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormSection title="আপনার তথ্য">
            <Input id="name" label="পুরো নাম" autoComplete="name" value={person.name} onChange={change("name")} error={errors.name} />
            <Input id="phone" type="tel" inputMode="tel" label="মোবাইল নম্বর" placeholder="01XXXXXXXXX" autoComplete="tel" value={person.phone} onChange={change("phone")} error={errors.phone} />
            {show("nid") && (
              <Input
                id="nid"
                inputMode="numeric"
                autoComplete="off"
                label={optional(fields.nid, "NID নম্বর")}
                placeholder={values.nidLast4 ? `শেষ ৪ সংখ্যা ${values.nidLast4}, বদলাতে নতুন লিখুন` : "১০ থেকে ১৭ সংখ্যা"}
                value={person.nid}
                onChange={change("nid")}
                error={errors.nid}
              />
            )}
            {show("occupation") && <Input id="occupation" label={optional(fields.occupation, "পেশা")} value={person.occupation} onChange={change("occupation")} error={errors.occupation} />}
            {show("workplace") && <Input id="workplace" label={optional(fields.workplace, "কর্মস্থলের নাম")} value={person.workplace} onChange={change("workplace")} error={errors.workplace} />}
            {show("companyName") && <Input id="companyName" label={optional(fields.companyName, "প্রতিষ্ঠানের নাম")} value={person.companyName} onChange={change("companyName")} error={errors.companyName} />}
            {show("permanentAddress") && <Textarea id="permanentAddress" label={optional(fields.permanentAddress, "স্থায়ী ঠিকানা")} value={person.permanentAddress} onChange={change("permanentAddress")} error={errors.permanentAddress} />}
            {show("previousAddress") && <Textarea id="previousAddress" label={optional(fields.previousAddress, "আগের ঠিকানা")} value={person.previousAddress} onChange={change("previousAddress")} error={errors.previousAddress} />}
          </FormSection>

          {show("nidPhoto") && (
            <FormSection title={optional(fields.nidPhoto, "NID-এর ছবি")}>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ছবি গোপন থাকবে, শুধু বাড়িওয়ালা দেখতে পারবেন
              </p>
              <input ref={inputRef} type="file" multiple accept={ALLOWED_TYPES.join(",")} onChange={handleFiles} className="hidden" />
              {documents.map(({ publicId }, index) => (
                <div key={publicId} className="flex items-center justify-between gap-2 rounded-lg border border-border pl-3">
                  <span className="flex items-center gap-2 text-sm">
                    <FileImage className="h-4 w-4 text-muted" aria-hidden="true" />
                    ছবি {toBanglaNumber(index + 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocuments((prev) => prev.filter((document) => document.publicId !== publicId))}
                    aria-label={`ছবি ${index + 1} মুছুন`}
                    className="flex h-11 w-11 items-center justify-center text-muted"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {documents.length < MAX_DOCUMENTS && (
                <Button variant="outline" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  ছবি দিন
                </Button>
              )}
              {errors.documents && <p className="text-sm text-danger">{errors.documents}</p>}
            </FormSection>
          )}

          {show("emergency") && (
            <FormSection title={optional(fields.emergency, "জরুরি যোগাযোগ")}>
              <Input id="emergencyName" label="নাম" value={person.emergencyName} onChange={change("emergencyName")} error={errors.emergencyName} />
              <Input id="emergencyPhone" type="tel" inputMode="tel" label="মোবাইল" placeholder="01XXXXXXXXX" value={person.emergencyPhone} onChange={change("emergencyPhone")} error={errors.emergencyPhone} />
            </FormSection>
          )}

          {maxMembers > 0 && (
            <FormSection title="আপনার সাথে যাঁরা থাকবেন">
              <p className="text-xs text-muted">সর্বোচ্চ {toBanglaNumber(maxMembers)} জন যোগ করা যাবে।</p>
              {members.map((member, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">সদস্য {toBanglaNumber(index + 1)}</p>
                    <button
                      type="button"
                      onClick={() => setMembers((prev) => prev.filter((_, memberIndex) => memberIndex !== index))}
                      aria-label={`সদস্য ${index + 1} মুছুন`}
                      className="-mr-2 flex h-9 w-9 items-center justify-center text-muted"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <Input id={`memberName${index}`} label="নাম" value={member.name} onChange={(e) => changeMember(index, "name", e.target.value)} />
                  <Input id={`memberRelation${index}`} label="সম্পর্ক" placeholder="স্ত্রী, ছেলে, ভাই" value={member.relation} onChange={(e) => changeMember(index, "relation", e.target.value)} />
                  <Input id={`memberPhone${index}`} type="tel" inputMode="tel" label="মোবাইল (ঐচ্ছিক)" value={member.phone} onChange={(e) => changeMember(index, "phone", e.target.value)} />
                </div>
              ))}
              {errors.members && <p className="text-sm text-danger">{errors.members}</p>}
              {members.length < maxMembers ? (
                <Button variant="outline" onClick={() => setMembers((prev) => [...prev, EMPTY_MEMBER])}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  সদস্য যোগ করুন
                </Button>
              ) : (
                <p className="text-sm text-muted">সর্বোচ্চ সংখ্যায় পৌঁছে গেছেন।</p>
              )}
            </FormSection>
          )}

          {questions.length > 0 && (
            <FormSection title="আরও কিছু তথ্য">
              {questions.map((question, index) => (
                <Input
                  key={question}
                  id={`answer${index}`}
                  label={question}
                  value={answers[index]}
                  onChange={(e) => setAnswers((prev) => prev.map((answer, answerIndex) => (answerIndex === index ? e.target.value : answer)))}
                />
              ))}
            </FormSection>
          )}

          <FormSection title="সম্মতি">
            <Checkbox
              id="consent"
              label="আমার দেওয়া তথ্য সঠিক"
              description="আমি জানি এই তথ্য ও ছবি বাড়িওয়ালার কাছে থাকবে।"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setErrors(({ consent: removed, ...rest }) => rest);
              }}
            />
            {errors.consent && <p className="text-sm text-danger">{errors.consent}</p>}
          </FormSection>

          <Button type="submit" size="lg" fullWidth disabled={isUploading} isLoading={isLoading}>
            ফর্ম জমা দিন
          </Button>
        </form>
      </Card>
    </Shell>
  );
};

const PublicFormPage = () => {
  const { token } = useParams();
  const { data, error, isLoading } = useGetPublicFormQuery(token);

  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="h-96 w-full rounded-xl" />
      </Shell>
    );
  }

  const form = data?.data;

  if (error || !form) return <Message icon={X} title="লিংকটি সঠিক নয়" text="বাড়িওয়ালার কাছ থেকে সঠিক লিংকটি নিন।" />;
  if (form.isExpired) return <Message icon={Lock} title="লিংকের মেয়াদ শেষ" text="বাড়িওয়ালাকে বলুন, তিনি আবার মেয়াদ বাড়িয়ে দিতে পারবেন।" />;
  if (!form.canFill) return <Message icon={CheckCircle2} title="এই ফর্মটি বন্ধ হয়ে গেছে" text="ফর্মটি আগেই জমা হয়েছে বা বাতিল হয়েছে। কিছু বদলাতে হলে বাড়িওয়ালাকে বলুন।" />;

  return <FormFields token={token} form={form} />;
};

export default PublicFormPage;
