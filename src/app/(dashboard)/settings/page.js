"use client";

import { useRef, useState } from "react";
import { Camera, Download, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import PasswordInput from "@/components/ui/PasswordInput";
import Skeleton from "@/components/ui/Skeleton";
import { setToken } from "@/lib/authStorage";
import { initSocket } from "@/socket/socket";
import { downloadCsv } from "@/lib/csv";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate } from "@/lib/tenancyOptions";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { uploadImage } from "@/lib/uploadImage";
import {
  useChangePasswordMutation,
  useGetAccountQuery,
  useLazyExportAccountDataQuery,
  useUpdateAccountSettingsMutation,
  useUpdateProfileMutation,
} from "@/redux/features/account/accountApi";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";

const TYPE_LABELS = {
  BillsToCreate: { label: "বিল তৈরি করুন", description: "মাসের শুরুতে, যে ফ্ল্যাটের বিল হয়নি" },
  RentOverdue: { label: "ভাড়া বাকি", description: "ভাড়ার শেষ তারিখ পার হলে" },
  LeavingSoon: { label: "শিগগির বাসা ছাড়ছেন", description: "ছাড়ার ৭ দিন আগে" },
  FormExpiring: { label: "ফর্মের লিংক বন্ধ হচ্ছে", description: "মেয়াদ শেষের আগের দিন" },
  ExpenseDue: { label: "খরচ দেওয়ার দিন", description: "প্রতি মাসের খরচের দিন এলে" },
  TenantFormSubmitted: { label: "ফর্ম জমা হয়েছে", description: "ভাড়াটিয়া ফর্ম জমা দিলে" },
  IssueReported: { label: "অভিযোগ বা প্রয়োজন", description: "ভাড়াটিয়া জানালে" },
  MemberRequest: { label: "নতুন সদস্য অপেক্ষায়", description: "সদস্য নিজে তথ্য দিলে" },
};

const Section = ({ title, description, children, ...props }) => (
  <Card className="flex flex-col gap-4" {...props}>
    <div>
      <h2 className="text-base font-bold">{title}</h2>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
    {children}
  </Card>
);

const ProfileSection = ({ account }) => {
  const fileRef = useRef(null);
  const [values, setValues] = useState({ name: account.name, phone: account.phone });
  const [photo, setPhoto] = useState(account.photo ? { url: account.photo, isSaved: true } : null);
  const [isUploading, setIsUploading] = useState(false);
  const [getSignature] = useGetUploadSignatureMutation();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      setPhoto(await uploadImage(file, (await getSignature("avatars").unwrap()).data));
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      await updateProfile({ name: values.name, phone: values.phone, ...(photo?.isSaved ? {} : { photo: photo ?? null }) }).unwrap();
      toast.success("প্রোফাইল সেভ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Section title="প্রোফাইল" data-settings="profile">
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary">
            {photo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8" aria-hidden="true" />
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" aria-label="Profile photo" />
            <Button variant="outline" size="sm" isLoading={isUploading} onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              {photo ? "ছবি বদলান" : "ছবি দিন"}
            </Button>
            {photo && (
              <Button variant="ghost" size="sm" onClick={() => setPhoto(null)} aria-label="Remove photo">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="profileName" label="নাম" value={values.name} onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))} />
          <Input id="profilePhone" type="tel" inputMode="tel" label="মোবাইল নম্বর" value={values.phone} onChange={(e) => setValues((prev) => ({ ...prev, phone: toEnglishNumber(e.target.value) }))} />
          <Input id="profileEmail" label="ইমেইল" value={account.email} disabled />
        </div>
        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Section>
  );
};

const PasswordSection = () => {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSave = async (event) => {
    event.preventDefault();
    if (values.next.length < 8) return setError("নতুন পাসওয়ার্ড অন্তত ৮ অক্ষরের দিন");
    if (values.next !== values.confirm) return setError("দুটো নতুন পাসওয়ার্ড মেলেনি");
    setError("");
    try {
      const response = await changePassword({ currentPassword: values.current, newPassword: values.next }).unwrap();
      // এই Device চালু থাকে, বাকি সব Device থেকে Logout
      setToken(response.data.token);
      initSocket(response.data.token);
      setValues({ current: "", next: "", confirm: "" });
      toast.success("পাসওয়ার্ড বদলেছে, অন্য সব Device থেকে Logout হয়েছে");
    } catch (err) {
      setError(getErrorMessage(err, "পাসওয়ার্ড বদলানো যায়নি"));
    }
  };

  const change = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

  return (
    <Section title="পাসওয়ার্ড বদলান" description="বদলালে অন্য সব ফোন ও কম্পিউটার থেকে নিজে থেকে Logout হবে" data-settings="password">
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <PasswordInput id="currentPassword" label="এখনকার পাসওয়ার্ড" autoComplete="current-password" value={values.current} onChange={change("current")} />
          <PasswordInput id="newPassword" label="নতুন পাসওয়ার্ড" autoComplete="new-password" value={values.next} onChange={change("next")} />
          <PasswordInput id="confirmPassword" label="আবার নতুন পাসওয়ার্ড" autoComplete="new-password" value={values.confirm} onChange={change("confirm")} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} disabled={!values.current || !values.next}>
            Change Password
          </Button>
        </div>
      </form>
    </Section>
  );
};

const ReceiptSection = ({ settings }) => {
  const [values, setValues] = useState({ receiptName: settings.receiptName, receiptPhone: settings.receiptPhone });
  const [updateSettings, { isLoading }] = useUpdateAccountSettingsMutation();

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      await updateSettings(values).unwrap();
      toast.success("রসিদের তথ্য সেভ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Section title="রসিদ ও বিলের তথ্য" description="সব বাড়ির রসিদ ও বিলে এই নাম ও ফোন বসবে। কোনো বাড়ির Edit-এ আলাদা দেওয়া থাকলে সেটাই আগে।" data-settings="receipt">
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="receiptDefaultName" label="রসিদে নাম" placeholder="খালি থাকলে আপনার নাম" value={values.receiptName} onChange={(e) => setValues((prev) => ({ ...prev, receiptName: e.target.value }))} />
          <Input
            id="receiptDefaultPhone"
            type="tel"
            inputMode="tel"
            label="রসিদে ফোন"
            placeholder="খালি থাকলে আপনার ফোন"
            value={values.receiptPhone}
            onChange={(e) => setValues((prev) => ({ ...prev, receiptPhone: toEnglishNumber(e.target.value) }))}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Section>
  );
};

// চাপলেই সেভ — পর্দায় সাথে সাথে বদলায়, সেভ না হলে আগের অবস্থায় ফেরে
// তাড়াতাড়ি পরপর চাপলেও প্রতিটি চাপ নিজের হিসাবে যায়, পুরনো Server ডেটা দেখে নয়
const NotificationSection = ({ account }) => {
  const [updateSettings] = useUpdateAccountSettingsMutation();
  const [emailNotifications, setEmailNotifications] = useState(account.settings.emailNotifications);
  const [mutedTypes, setMutedTypes] = useState(account.settings.mutedTypes);

  const save = async (update, message, undo) => {
    try {
      await updateSettings(update).unwrap();
      toast.success(message);
    } catch (err) {
      undo();
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const toggleEmail = (isOn) => {
    setEmailNotifications(isOn);
    save({ emailNotifications: isOn }, isOn ? "ইমেইল চালু হয়েছে" : "ইমেইল বন্ধ হয়েছে", () => setEmailNotifications(!isOn));
  };

  const toggleType = (type, isOn) => {
    const before = mutedTypes;
    const next = isOn ? mutedTypes.filter((item) => item !== type) : [...mutedTypes, type];
    setMutedTypes(next);
    save({ mutedTypes: next }, isOn ? "চালু হয়েছে" : "বন্ধ হয়েছে", () => setMutedTypes(before));
  };

  return (
    <Section title="নোটিফিকেশন" description="প্রতিদিন সকাল ৯টায় সেদিনের কাজ মনে করানো হয়। বন্ধ করা ধরন app ও ইমেইল দুটোতেই আসবে না।" data-settings="notifications">
      <div className="rounded-xl bg-background px-3">
        <Checkbox
          id="emailNotifications"
          label="ইমেইলেও পাঠান"
          description={`${account.email} — সকালের কাজ একটি ইমেইলে, জরুরিগুলো সাথে সাথে`}
          checked={emailNotifications}
          onChange={(e) => toggleEmail(e.target.checked)}
        />
      </div>
      <div className="grid gap-x-6 sm:grid-cols-2">
        {account.notificationTypes.map((type) => (
          <Checkbox
            key={type}
            id={`notify-${type}`}
            label={TYPE_LABELS[type]?.label ?? type}
            description={TYPE_LABELS[type]?.description}
            checked={!mutedTypes.includes(type)}
            onChange={(e) => toggleType(type, e.target.checked)}
          />
        ))}
      </div>
    </Section>
  );
};

const DataSection = () => {
  const [loadData, { isFetching }] = useLazyExportAccountDataQuery();

  const handleExport = async () => {
    try {
      const data = (await loadData().unwrap()).data;
      const blank = [""];
      downloadCsv(`HouseOne-data-${data.exportedAt.slice(0, 10)}.csv`, ["HouseOne data export", formatDate(data.exportedAt)], [
        blank,
        ["Properties"],
        ["Name", "Area", "City", "Address", "Floors"],
        ...data.properties.map((p) => [p.name, p.area, p.city, p.address, p.totalFloors]),
        blank,
        ["Units"],
        ["House", "Unit", "Floor", "Type", "Status", "Rent", "Bedrooms", "Bathrooms"],
        ...data.units.map((u) => [u.propertyName, u.name, u.floor, u.type, u.status, u.rent ?? "", u.bedrooms ?? "", u.bathrooms ?? ""]),
        blank,
        ["Tenants"],
        ["Tenant", "Phone", "House", "Unit", "Type", "Status", "Rent", "Advance", "Moved in", "Moved out", "People"],
        ...data.tenancies.map((t) => [t.tenantName, t.tenantPhone, t.propertyName, t.unitName, t.occupantType, t.status, t.rent, t.advance, t.startDate?.slice(0, 10), t.endDate?.slice(0, 10) ?? "", t.peopleCount]),
        blank,
        ["Bills"],
        ["Month", "Tenant", "House", "Unit", "Total", "Paid", "Status"],
        ...data.bills.map((b) => [b.month, b.tenantName, b.propertyName, b.unitName, b.total, b.paid, b.status]),
        blank,
        ["Receipts"],
        ["Receipt No", "Date", "Tenant", "House", "Unit", "For", "Amount", "Method", "Transaction ID", "Status", "Collected by"],
        ...data.payments.map((p) => [p.receiptNo, p.paidAt?.slice(0, 10), p.tenantName, p.propertyName, p.unitName, p.kind === "Advance" ? "Advance" : p.month, p.amount, p.method, p.trxId, p.status, p.collectorName]),
        blank,
        ["Expenses"],
        ["Month", "Date", "Category", "House", "Unit", "Amount", "Method", "Paid to", "Status", "Note"],
        ...data.expenses.map((e) => [e.month, e.paidAt?.slice(0, 10) ?? "", e.category, e.propertyName || "All houses", e.unitName, e.amount, e.method, e.paidTo, e.status, e.note]),
      ]);
      toast.success("আপনার সব ডেটা ডাউনলোড হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "ডাউনলোড হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Section title="আপনার সব ডেটা" description="বাড়ি, ফ্ল্যাট, ভাড়াটিয়া, বিল, রসিদ ও খরচ — এক Excel ফাইলে, ব্যাকআপ হিসেবে" data-settings="data">
      <div>
        <Button variant="outline" isLoading={isFetching} onClick={handleExport}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download All Data
        </Button>
      </div>
    </Section>
  );
};

const SettingsPage = () => {
  const { data, isLoading } = useGetAccountQuery();
  const account = data?.data;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" description="প্রোফাইল, পাসওয়ার্ড, রসিদের তথ্য ও নোটিফিকেশন" />
      {isLoading || !account ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="flex flex-col gap-4">
          <ProfileSection key={`profile-${account.name}-${account.phone}-${account.photo}`} account={account} />
          <PasswordSection />
          <ReceiptSection key={`receipt-${account.settings.receiptName}-${account.settings.receiptPhone}`} settings={account.settings} />
          <NotificationSection account={account} />
          <DataSection />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
