"use client";

import ImageSlot from "@/components/tenantForm/ImageSlot";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { ISSUE_CATEGORY_OPTIONS, ISSUE_TYPES } from "@/lib/issueOptions";

export const EMPTY_ISSUE = { type: "Complain", category: ISSUE_CATEGORY_OPTIONS[0].value, description: "", photos: [null, null, null] };

// বাড়িওয়ালা ও ভাড়াটিয়া দুজনের ফর্মেই একই ঘর
const IssueFields = ({ value, error, getSignature, onChange }) => (
  <>
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">কী ধরনের</p>
      <div>
        <SegmentedControl
          label="ধরন"
          options={ISSUE_TYPES.map(({ label }) => label)}
          value={ISSUE_TYPES.find(({ value: type }) => type === value.type)?.label}
          onChange={(next) => onChange({ ...value, type: ISSUE_TYPES.find(({ label }) => label === next).value })}
        />
      </div>
    </div>
    <Select id="issueCategory" label="বিষয়" options={ISSUE_CATEGORY_OPTIONS} value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} />
    <Textarea id="issueDescription" label="বিস্তারিত" placeholder="কী সমস্যা বা কী দরকার লিখুন" value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} error={error} />
    <div className="grid grid-cols-3 gap-2">
      {value.photos.map((photo, index) => (
        <ImageSlot
          key={index}
          id={`issuePhoto${index}`}
          label={`ছবি ${index + 1} (ঐচ্ছিক)`}
          value={photo}
          getSignature={getSignature}
          onChange={(next) => onChange((current) => ({ ...current, photos: current.photos.map((item, itemIndex) => (itemIndex === index ? next : item)) }))}
        />
      ))}
    </div>
  </>
);

export default IssueFields;
