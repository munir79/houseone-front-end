"use client";

import { useRef, useState } from "react";
import { Camera, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { CONTRACT_MONTH_OPTIONS, CONTRACT_YEAR_OPTIONS, INCREASE_YEAR_OPTIONS, autoAdvance, installmentSum } from "@/lib/marketOptions";
import { RENT_DAY_OPTIONS } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { uploadImage } from "@/lib/uploadImage";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";

const MAX_PHOTOS = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const POSITION_MODES = { Once: "একবারে", Installments: "কিস্তিতে" };
const modeOf = (label) => Object.keys(POSITION_MODES).find((key) => POSITION_MODES[key] === label);

const MoneyInput = (props) => <Input type="number" inputMode="numeric" min="0" {...props} />;

const LinkAction = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="w-fit text-sm font-semibold text-primary underline-offset-2 hover:underline">
    {children}
  </button>
);

// চুক্তিপত্র বা Trade License এর ছবি — Private, পরে শুধু মালিক চাইলে দেখা যায়
export const PrivatePhotos = ({ id, label, photos, onChange, max = MAX_PHOTOS, itemLabel = "পাতা" }) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [getSignature] = useGetUploadSignatureMutation();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("JPG, PNG বা WebP ছবি বেছে নিন");
      return;
    }

    setIsUploading(true);
    try {
      const { data: signature } = await getSignature("nid").unwrap();
      onChange([...photos, await uploadImage(file, signature)]);
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div data-private-photos={id} className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((photo, index) => (
          <span key={photo.publicId} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-background pr-1 pl-3 text-sm">
            {max === 1 ? "ছবি দেওয়া হয়েছে" : `${itemLabel} ${toBanglaNumber(index + 1)}`}
            <button type="button" aria-label={`Remove page ${index + 1}`} onClick={() => onChange(photos.filter((_, i) => i !== index))} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-danger">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        ))}
        {photos.length < max && (
          <Button variant="outline" size="sm" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
            <Camera className="h-4 w-4" aria-hidden="true" />
            ছবি যোগ
          </Button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden" onChange={handleFile} />
    </div>
  );
};

// দোকানের চুক্তি — মেয়াদ, ভাড়া, সার্ভিস চার্জ, অগ্রিম, সিকিউরিটি, পজিশন মানি, ভাড়া বৃদ্ধি
// value/onChange — পুরো চুক্তি একটি object এ; errors — validateContract এর ফল
const ContractFields = ({ value, onChange, errors = {}, showPhotos = true }) => {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });
  const expected = autoAdvance(value);
  const positionTotal = Number(value.positionTotal || 0);
  const left = positionTotal - installmentSum(value);

  const setInstallment = (index, field) => (e) =>
    onChange({ ...value, installments: value.installments.map((item, i) => (i === index ? { ...item, [field]: e.target.value } : item)) });

  // প্রথম কিস্তি আজ, বাকিগুলো একেক মাস পরে — মালিক বদলে নিতে পারেন
  const addInstallment = () => {
    const last = value.installments.at(-1)?.dueDate || value.startDate;
    const next = last ? new Date(last) : new Date();
    if (value.installments.length > 0) next.setMonth(next.getMonth() + 1);
    onChange({ ...value, installments: [...value.installments, { amount: left > 0 ? String(left) : "", dueDate: next.toISOString().slice(0, 10) }] });
  };

  return (
    <>
      <FormSection title="চুক্তির মেয়াদ ও ভাড়া">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input id="contractStart" type="date" label="শুরুর তারিখ" value={value.startDate} onChange={set("startDate")} error={errors.startDate} className="col-span-2 sm:col-span-1" />
          <Select id="contractYears" label="মেয়াদ (বছর)" options={CONTRACT_YEAR_OPTIONS} value={value.years} onChange={set("years")} error={errors.duration} />
          <Select id="contractMonths" label="আর (মাস)" options={CONTRACT_MONTH_OPTIONS} value={value.months} onChange={set("months")} />
          <MoneyInput id="contractRent" label="মাসিক ভাড়া (৳)" placeholder="40000" value={value.rent} onChange={set("rent")} error={errors.rent} />
          <MoneyInput id="contractServiceCharge" label="সার্ভিস চার্জ (৳)" placeholder="1500" value={value.serviceCharge} onChange={set("serviceCharge")} />
          <Select id="contractDueDay" label="ভাড়া দেওয়ার তারিখ" options={RENT_DAY_OPTIONS} value={value.dueDay} onChange={set("dueDay")} />
        </div>
      </FormSection>

      <FormSection title="অগ্রিম ও সিকিউরিটি">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MoneyInput id="contractAdvanceMonths" label="অগ্রিম ভাড়া (মাস)" max="36" value={value.advanceMonths} onChange={set("advanceMonths")} />
          <div className="flex flex-col gap-1">
            <MoneyInput
              id="contractAdvance"
              label="অগ্রিম ভাড়া (৳)"
              readOnly={value.advance === null}
              value={value.advance ?? expected}
              onChange={set("advance")}
              className={value.advance === null ? "[&_input]:font-semibold" : undefined}
            />
            <LinkAction onClick={() => onChange({ ...value, advance: value.advance === null ? String(expected) : null })}>{value.advance === null ? "হাতে লিখুন" : "হিসাবে ফিরুন"}</LinkAction>
          </div>
          <MoneyInput id="contractSecurity" label="সিকিউরিটি মানি (৳)" placeholder="200000" value={value.security} onChange={set("security")} className="col-span-2 sm:col-span-1" />
        </div>
        <p className="text-xs text-muted">অগ্রিম ভাড়া দোকান ছাড়ার সময় শেষ মাসের ভাড়ায় যাবে। সিকিউরিটি মানি আলাদা, ছাড়ার সময় ফেরত দেবেন।</p>
      </FormSection>

      <FormSection title="পজিশন মানি (সালামি)">
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyInput id="positionTotal" label="মোট পজিশন মানি (৳)" placeholder="500000" value={value.positionTotal} onChange={set("positionTotal")} />
          {positionTotal > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">কীভাবে নেবেন</p>
              <SegmentedControl label="Position money mode" options={Object.values(POSITION_MODES)} value={POSITION_MODES[value.positionMode]} onChange={(label) => onChange({ ...value, positionMode: modeOf(label) })} />
            </div>
          )}
        </div>

        {positionTotal > 0 && value.positionMode === "Installments" && (
          <div data-installments className="flex flex-col gap-2">
            {value.installments.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <MoneyInput id={`installmentAmount-${index}`} label={`কিস্তি ${toBanglaNumber(index + 1)} (৳)`} value={item.amount} onChange={setInstallment(index, "amount")} />
                <Input id={`installmentDate-${index}`} type="date" label="তারিখ" value={item.dueDate} onChange={setInstallment(index, "dueDate")} />
                <button
                  type="button"
                  aria-label={`Remove installment ${index + 1}`}
                  onClick={() => onChange({ ...value, installments: value.installments.filter((_, i) => i !== index) })}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={addInstallment}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                কিস্তি যোগ
              </Button>
              <p data-installment-left className={left === 0 ? "text-sm text-success" : "text-sm text-warning-foreground"}>
                {left === 0 ? "যোগফল মিলেছে" : left > 0 ? `আরও ${formatMoney(left)} কিস্তিতে বসান` : `${formatMoney(-left)} বেশি হয়ে গেছে`}
              </p>
            </div>
            {errors.installments && <p className="text-sm text-danger">{errors.installments}</p>}
          </div>
        )}
      </FormSection>

      <FormSection title="ভাড়া বৃদ্ধির নিয়ম">
        <div className="grid grid-cols-2 gap-4">
          <MoneyInput id="increaseAmount" label="কত টাকা বাড়বে (৳)" placeholder="2000" value={value.increaseAmount} onChange={set("increaseAmount")} />
          <Select id="increaseYears" label="কত দিন পর পর" options={INCREASE_YEAR_OPTIONS} value={value.increaseYears} onChange={set("increaseYears")} />
        </div>
        <p className="text-xs text-muted">চুক্তির শুরুর তারিখ থেকে হিসাব। সময় হলে ৩০ দিন আগে মনে করাব, আপনি রাজি হলে তবেই বাড়বে। বাড়বে না, এমন হলে খালি রাখুন।</p>
      </FormSection>

      {showPhotos && (
        <FormSection title="চুক্তিপত্র">
          <PrivatePhotos id="contract" label="চুক্তিপত্রের ছবি (ঐচ্ছিক)" photos={value.contractPhotos} onChange={(contractPhotos) => onChange({ ...value, contractPhotos })} />
        </FormSection>
      )}
    </>
  );
};

export default ContractFields;
