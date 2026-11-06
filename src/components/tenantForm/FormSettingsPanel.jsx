"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { FIELD_STATE_OPTIONS, FORM_FIELDS, FORM_TYPES, MAIN_COUNT_OPTIONS } from "@/lib/tenantFormOptions";
import { useGetFormSettingsQuery, useUpdateFormSettingsMutation } from "@/redux/features/tenantForm/tenantFormApi";

const MAX_QUESTIONS = 5;
const MAX_RULES = 15;

const SettingsEditor = ({ propertyId, initial }) => {
  const [types, setTypes] = useState(initial);
  const [type, setType] = useState("Family");
  const [updateSettings, { isLoading }] = useUpdateFormSettingsMutation();

  const current = types[type];

  const change = (update) => setTypes((prev) => ({ ...prev, [type]: { ...prev[type], ...update } }));

  const handleSave = async () => {
    // তিন ধরনই একসাথে সেভ হয়, তাই যে ধরনে ভুল সেটাই সামনে আনা হয়
    const invalidType = FORM_TYPES.find((item) => Number(types[item].maxMembers) < types[item].mainCount || [...types[item].questions, ...types[item].rules].some((text) => !text.trim()));
    if (invalidType) {
      setType(invalidType);
      toast.error(`${invalidType}: সদস্য সংখ্যা দিন, আর খালি প্রশ্ন বা নিয়ম লিখুন অথবা মুছে দিন`);
      return;
    }

    try {
      await updateSettings({ propertyId, types }).unwrap();
      toast.success("ফর্মের সেটিং সেভ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Card flush className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3 sm:p-4">
        <SegmentedControl label="Tenant type" options={FORM_TYPES} value={type} onChange={setType} />
        <Button size="sm" isLoading={isLoading} onClick={handleSave}>
          Save Settings
        </Button>
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <p className="text-sm text-muted">ভাড়াটিয়া কোন তথ্য দেবেন ঠিক করুন। নাম ও মোবাইল সবসময় লাগবে। Off করলে সেই ঘর ফর্মে দেখাবে না।</p>

        <div className="grid max-w-md grid-cols-2 gap-4">
          <Input
            id="maxMembers"
            type="number"
            inputMode="numeric"
            min="1"
            max="30"
            label="Maximum people"
            value={current.maxMembers}
            onChange={(e) => change({ maxMembers: e.target.value === "" ? "" : Number(e.target.value) })}
          />
          <Select
            id="mainCount"
            label="প্রধান দায়িত্বশীল"
            options={MAIN_COUNT_OPTIONS}
            value={String(current.mainCount)}
            onChange={(e) => change({ mainCount: Number(e.target.value) })}
          />
        </div>

        <Checkbox
          id="othersFull"
          label="বাকি সবাইকেও পুরো তথ্য দিতে হবে"
          description="না দিলে শুধু প্রধানদের তথ্য বাধ্যতামূলক। প্রতিটি ফ্ল্যাটের আলাদা সীমা Send Form-এর সময় দেওয়া যাবে।"
          checked={current.othersFull}
          onChange={(e) => change({ othersFull: e.target.checked })}
        />

        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          {FORM_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="min-w-0 text-sm">{label}</span>
              <Select
                id={`field-${key}`}
                compact
                aria-label={label}
                options={FIELD_STATE_OPTIONS}
                value={current.fields[key]}
                onChange={(e) => change({ fields: { ...current.fields, [key]: e.target.value } })}
                className="w-32 shrink-0"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm font-medium">নিজের প্রশ্ন</p>
          {current.questions.map((question, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                id={`question-${index}`}
                aria-label={`Question ${index + 1}`}
                placeholder="যেমন: গ্রামের বাড়ির থানা"
                value={question}
                onChange={(e) => change({ questions: current.questions.map((item, itemIndex) => (itemIndex === index ? e.target.value : item)) })}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => change({ questions: current.questions.filter((_, itemIndex) => itemIndex !== index) })}
                aria-label={`Remove question ${index + 1}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {current.questions.length < MAX_QUESTIONS && (
            <Button variant="outline" size="sm" onClick={() => change({ questions: [...current.questions, ""] })} className="w-fit">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Question
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium">বাড়ির নিয়ম</p>
            <p className="text-sm text-muted">ভাড়াটিয়া জমা দেওয়ার আগে পড়ে সম্মতি দেবেন। সংখ্যা, সময় বা পুরো লেখা বদলাতে পারবেন।</p>
          </div>
          {current.rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                id={`rule-${index}`}
                aria-label={`Rule ${index + 1}`}
                value={rule}
                onChange={(e) => change({ rules: current.rules.map((item, itemIndex) => (itemIndex === index ? e.target.value : item)) })}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => change({ rules: current.rules.filter((_, itemIndex) => itemIndex !== index) })}
                aria-label={`Remove rule ${index + 1}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {current.rules.length < MAX_RULES && (
            <Button variant="outline" size="sm" onClick={() => change({ rules: [...current.rules, ""] })} className="w-fit">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Rule
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const FormSettingsPanel = ({ propertyId }) => {
  const { data, isFetching } = useGetFormSettingsQuery(propertyId);

  if (isFetching || !data) return <Skeleton className="h-64 w-full rounded-xl" />;

  return <SettingsEditor propertyId={propertyId} initial={data.data} />;
};

export default FormSettingsPanel;
