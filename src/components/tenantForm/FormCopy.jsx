"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import TermsCard from "./TermsCard";
import TenantIssues from "@/components/issue/TenantIssues";
import Button from "@/components/ui/Button";
import PdfSheet, { SheetRows, SheetSection } from "@/components/ui/PdfSheet";
import { businessTypeLabel } from "@/lib/marketOptions";
import { downloadPdf } from "@/lib/pdf";
import { formatDate } from "@/lib/tenancyOptions";
import { FORM_TYPE_LABELS, formLink } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

// একজন মানুষের সব তথ্য — NID শুধু শেষ ৪ সংখ্যা, কোনো ছবি নয়
const personRows = (person) => [
  ["মোবাইল", person.phone],
  ["সম্পর্ক", person.relation],
  ["পেশা", person.occupation],
  ["কর্মস্থল", person.workplace],
  ["ঠিকানা", person.permanentAddress],
  ["NID", person.nidLast4 && `শেষ ৪ সংখ্যা ${person.nidLast4}`],
];

// জমা দেওয়ার পরে ভাড়াটিয়া বা ব্যবসায়ীর কপি — watermark, QR আর PDF সহ
const FormCopy = ({ token, form, justSubmitted }) => {
  const { copy, terms } = form;
  const copyRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const isMarket = copy.isMarket;
  const [main, ...others] = copy.people;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadPdf(copyRef.current, `HouseOne-Form-${copy.formNumber}.pdf`);
    } catch {
      toast.error("PDF তৈরি হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {justSubmitted && (
        <p className="flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          ধন্যবাদ, ফর্ম জমা হয়েছে
        </p>
      )}

      <Button size="lg" fullWidth isLoading={isDownloading} onClick={handleDownload}>
        <Download className="h-4 w-4" aria-hidden="true" />
        Download PDF
      </Button>

      {copy.canReport && <TenantIssues token={token} />}

      <PdfSheet
        ref={copyRef}
        title="তথ্য ও সম্মতির কপি"
        subtitle={`${form.propertyName}, ${form.unitName} · ${isMarket ? "দোকান" : FORM_TYPE_LABELS[form.occupantType]} · জমা ${formatDate(copy.submittedAt)}`}
        watermark={`${form.propertyName} · ${copy.formNumber}`}
        docId={copy.formNumber}
        qrValue={formLink(token)}
        qrLabel="Scan করে কপি দেখুন"
        footerNote={`${isMarket ? "ব্যবসায়ী" : "ভাড়াটিয়া"} এই তথ্য দিয়েছেন ও নিয়মে সম্মতি দিয়েছেন। এটি স্ট্যাম্প করা চুক্তিপত্র নয়।`}
      >
        {terms && <TermsCard terms={terms} />}

        {isMarket && (
          <SheetSection title="ব্যবসা">
            <SheetRows
              rows={[
                ["ব্যবসার নাম", copy.companyName],
                ["ধরন", businessTypeLabel(copy)],
                ["Trade License", copy.tradeLicense],
                ["Trade License এর ছবি", copy.hasTradeLicensePhoto ? "দেওয়া হয়েছে" : ""],
              ]}
            />
          </SheetSection>
        )}

        {main && (
          <SheetSection title={isMarket ? "ব্যবসার মালিক" : "প্রধান দায়িত্বশীল"}>
            <p className="text-base font-bold">{main.name}</p>
            <SheetRows rows={personRows(main)} />
          </SheetSection>
        )}

        {others.length > 0 && (
          <SheetSection title={isMarket ? "পরিবারের সদস্য (জরুরি যোগাযোগ)" : `অন্যরা (মোট ${toBanglaNumber(copy.totalPeople)} জন থাকবেন)`}>
            <ul className="flex flex-col gap-3">
              {others.map((person, index) => (
                <li key={index} className="flex flex-col gap-1">
                  <p className="text-sm font-bold">
                    {person.name}
                    {person.isMain && !isMarket && " (প্রধান দায়িত্বশীল)"}
                  </p>
                  <SheetRows rows={personRows(person)} />
                </li>
              ))}
            </ul>
          </SheetSection>
        )}

        {!isMarket && (copy.companyName || copy.tradeLicense || copy.emergencyName) && (
          <SheetSection title="অন্যান্য তথ্য">
            <SheetRows
              rows={[
                ["প্রতিষ্ঠান", copy.companyName],
                ["Trade License", copy.tradeLicense],
                ["জরুরি যোগাযোগ", [copy.emergencyName, copy.emergencyPhone].filter(Boolean).join(", ")],
              ]}
            />
          </SheetSection>
        )}

        {copy.answers?.length > 0 && (
          <SheetSection title="প্রশ্নের উত্তর">
            <SheetRows rows={copy.answers.map(({ question, answer }) => [question, answer])} />
          </SheetSection>
        )}

        {copy.rules.length > 0 && (
          <SheetSection title={isMarket ? "মার্কেটের নিয়ম" : "বাড়ির নিয়ম"}>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
              {copy.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ol>
            {copy.rulesAcceptedAt && <p className="text-xs text-neutral-500">{formatDate(copy.rulesAcceptedAt)} তারিখে সম্মতি দিয়েছেন</p>}
          </SheetSection>
        )}
      </PdfSheet>
    </div>
  );
};

export default FormCopy;
