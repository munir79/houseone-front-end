"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import ImageSlot from "@/components/tenantForm/ImageSlot";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { GENDERS } from "@/lib/tenantFormOptions";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import {
  useGetPublicMemberLinkQuery,
  useGetPublicMemberSignatureMutation,
  useSubmitMemberRequestMutation,
} from "@/redux/features/memberRequest/memberRequestApi";

const SIGNATURE_MINUTES = 50;
const PHONE_REGEX = /^01[3-9]\d{8}$/;
const NID_REGEX = /^\d{10,17}$/;
const EMPTY = { name: "", phone: "", relation: "", gender: "", age: "", occupation: "", workplace: "", permanentAddress: "", nid: "" };

const Shell = ({ children }) => (
  <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
    <div className="flex justify-center">
      <Logo />
    </div>
    {children}
  </main>
);

const Message = ({ icon: Icon, title, text, action }) => (
  <Card className="flex flex-col items-center gap-2 py-10 text-center">
    <Icon className="h-10 w-10 text-muted" strokeWidth={1.5} aria-hidden="true" />
    <h1 className="text-lg font-semibold">{title}</h1>
    <p className="text-sm text-muted">{text}</p>
    {action}
  </Card>
);

// সদস্য নিজের তথ্য দেন — বাড়িওয়ালা Approve করলে তবেই সদস্য তালিকায় যোগ হন
const MemberLinkPage = () => {
  const { token } = useParams();
  const { data, error, isLoading } = useGetPublicMemberLinkQuery(token);
  const [getSignature] = useGetPublicMemberSignatureMutation();
  const [submit, { isLoading: isSending }] = useSubmitMemberRequestMutation();

  const signatureRef = useRef(null);
  const [values, setValues] = useState(EMPTY);
  const [images, setImages] = useState({ nidFront: null, nidBack: null, photo: null });
  const [errors, setErrors] = useState({});
  const [sentName, setSentName] = useState("");

  const flat = data?.data;

  // একই স্বাক্ষরে তিনটি ছবিই যায়
  const signature = async () => {
    const cached = signatureRef.current;
    if (cached && Date.now() - cached.at < SIGNATURE_MINUTES * 60 * 1000) return cached.value;

    const { data: value } = await getSignature(token).unwrap();
    signatureRef.current = { value, at: Date.now() };
    return value;
  };

  const change = (field) => (event) => {
    const value = ["phone", "age", "nid"].includes(field) ? toEnglishNumber(event.target.value) : event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "নাম লিখুন";
    if (!PHONE_REGEX.test(values.phone.replace(/[\s-]/g, ""))) next.phone = "সঠিক মোবাইল নম্বর লিখুন";
    if (!NID_REGEX.test(values.nid.replace(/\s/g, ""))) next.nid = "NID ১০ থেকে ১৭ সংখ্যার হতে হবে";
    if (values.age && !(Number.isInteger(Number(values.age)) && Number(values.age) <= 120)) next.age = "বয়স সঠিক নয়";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await submit({
        token,
        ...values,
        documents: [images.nidFront, images.nidBack].filter(Boolean),
        photo: images.photo,
      }).unwrap();
      setSentName(values.name.trim());
      setValues(EMPTY);
      setImages({ nidFront: null, nidBack: null, photo: null });
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(getErrorMessage(err, "পাঠানো যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="h-96 w-full rounded-xl" />
      </Shell>
    );
  }

  if (error || !flat) {
    return (
      <Shell>
        <Message icon={X} title="লিংকটি সঠিক নয়" text={getErrorMessage(error, "বাড়িওয়ালার কাছ থেকে সঠিক লিংকটি নিন।")} />
      </Shell>
    );
  }

  if (sentName) {
    return (
      <Shell>
        <Message
          icon={CheckCircle2}
          title="তথ্য পাঠানো হয়েছে"
          text={`${sentName}-এর তথ্য বাড়িওয়ালার কাছে গেছে। তিনি Approve করলে আপনি এই ফ্ল্যাটের সদস্য হিসেবে যোগ হবেন।`}
          action={
            <Button variant="outline" size="sm" onClick={() => setSentName("")} className="mt-2">
              আরেকজনের তথ্য দিন
            </Button>
          }
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Card className="flex flex-col gap-1">
        <h1 className="text-lg font-bold">সদস্যের তথ্য</h1>
        <p className="text-sm text-muted">
          {flat.unitName}, {flat.propertyName} · মূল ভাড়াটিয়া {flat.tenantName}
        </p>
        <p className="text-sm">প্রত্যেক সদস্য নিজের তথ্য আলাদা করে দিন। বাড়িওয়ালা দেখে Approve করবেন।</p>
      </Card>

      <Card>
        <form data-member-form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input id="memberName" label="নাম *" value={values.name} onChange={change("name")} error={errors.name} autoComplete="name" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="memberPhone" type="tel" inputMode="tel" label="মোবাইল নম্বর *" placeholder="01XXXXXXXXX" value={values.phone} onChange={change("phone")} error={errors.phone} />
            <Input id="memberRelation" label="মূল ভাড়াটিয়ার সাথে সম্পর্ক" placeholder="যেমন: রুমমেট, ভাই" value={values.relation} onChange={change("relation")} />
            <Select id="memberGender" label="লিঙ্গ" placeholder="বেছে নিন" options={GENDERS} value={values.gender} onChange={change("gender")} />
            <Input id="memberAge" type="number" inputMode="numeric" min="0" label="বয়স" value={values.age} onChange={change("age")} error={errors.age} />
            <Input id="memberOccupation" label="পেশা" value={values.occupation} onChange={change("occupation")} />
            <Input id="memberWorkplace" label="কর্মস্থল / শিক্ষাপ্রতিষ্ঠান" value={values.workplace} onChange={change("workplace")} />
          </div>
          <Input id="memberAddress" label="স্থায়ী ঠিকানা" value={values.permanentAddress} onChange={change("permanentAddress")} />
          <Input id="memberNid" inputMode="numeric" label="NID নম্বর *" value={values.nid} onChange={change("nid")} error={errors.nid} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ImageSlot id="nidFront" label="NID সামনের দিক" value={images.nidFront} getSignature={signature} onChange={(value) => setImages((prev) => ({ ...prev, nidFront: value }))} />
            <ImageSlot id="nidBack" label="NID পেছনের দিক" value={images.nidBack} getSignature={signature} onChange={(value) => setImages((prev) => ({ ...prev, nidBack: value }))} />
            <ImageSlot id="photo" label="নিজের ছবি" value={images.photo} getSignature={signature} onChange={(value) => setImages((prev) => ({ ...prev, photo: value }))} />
          </div>

          <p className="text-xs text-muted">আপনার NID ও ছবি শুধু বাড়িওয়ালা দেখতে পারবেন।</p>
          <Button type="submit" size="lg" fullWidth isLoading={isSending}>
            পাঠান
          </Button>
        </form>
      </Card>
    </Shell>
  );
};

export default MemberLinkPage;
