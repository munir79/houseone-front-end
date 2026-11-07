"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import TermsCard from "./TermsCard";
import TenantIssues from "@/components/issue/TenantIssues";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/tenancyOptions";
import { FORM_TYPE_LABELS } from "@/lib/tenantFormOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const MARGIN_MM = 8;
const PDF_WIDTH_PX = 760;
const SHRINK_TO_ONE_PAGE = 1.3;

// ফোনেও A4 এর মাপে তৈরি হয় — পর্দার বাইরে একটি কপি বানিয়ে ছবি নেওয়া হয়
const captureAtPdfWidth = async (node, toJpeg) => {
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_WIDTH_PX}px`;

  const clone = node.cloneNode(true);
  holder.appendChild(clone);
  document.body.appendChild(holder);

  try {
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--color-surface").trim();
    const image = await toJpeg(clone, { quality: 0.92, pixelRatio: 2, backgroundColor });
    return { image, ratio: clone.offsetHeight / clone.offsetWidth };
  } finally {
    holder.remove();
  }
};

// পাতাটাই ছবি হয়ে PDF হয়, তাই বাংলা যুক্তাক্ষর ঠিক থাকে। প্যাকেজ শুধু চাপলে লোড হয়
const downloadPdf = async (node, fileName) => {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const { image, ratio } = await captureAtPdfWidth(node, toJpeg);

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth() - MARGIN_MM * 2;
  const pageHeight = pdf.internal.pageSize.getHeight() - MARGIN_MM * 2;
  const imageHeight = ratio * pageWidth;

  // সামান্য বড় হলে এক পাতায় ছোট করে বসে, অনেক বড় হলে তবেই কয়েক পাতা
  if (imageHeight <= pageHeight * SHRINK_TO_ONE_PAGE) {
    const scale = Math.min(1, pageHeight / imageHeight);
    const width = pageWidth * scale;
    pdf.addImage(image, "JPEG", MARGIN_MM + (pageWidth - width) / 2, MARGIN_MM, width, imageHeight * scale);
  } else {
    for (let top = 0, page = 0; top < imageHeight; top += pageHeight, page += 1) {
      if (page > 0) pdf.addPage();
      pdf.addImage(image, "JPEG", MARGIN_MM, MARGIN_MM - top, pageWidth, imageHeight);
    }
  }

  pdf.save(fileName);
};

// জমা দেওয়ার পরে ভাড়াটিয়ার কপি — NID এর শেষ ৪ সংখ্যা, কোনো ছবি নেই
const FormCopy = ({ token, form, justSubmitted }) => {
  const { copy, terms } = form;
  const copyRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

      <div ref={copyRef} data-form-copy className="flex flex-col gap-4 bg-background p-1">
        <div className="text-center">
          <h1 className="text-xl font-bold">তথ্য ও সম্মতির কপি</h1>
          <p className="text-sm text-muted">
            {form.propertyName}, {form.unitName} · {FORM_TYPE_LABELS[form.occupantType]}
          </p>
          <p className="text-sm text-muted">
            ফর্ম নম্বর {copy.formNumber} · {formatDate(copy.submittedAt)}
          </p>
        </div>

        {terms && <TermsCard terms={terms} />}

        <Card className="flex flex-col gap-2">
          <h2 className="text-base font-bold">যাঁরা থাকবেন (মোট {toBanglaNumber(copy.totalPeople)} জন)</h2>
          {copy.companyName && <p className="text-sm">প্রতিষ্ঠান: {copy.companyName}</p>}
          <ul className="flex flex-col gap-1 text-sm">
            {copy.people.map(({ name, relation, isMain, nidLast4 }, index) => (
              <li key={index}>
                <span className="font-semibold">{name}</span>
                {isMain && " (প্রধান দায়িত্বশীল)"}
                {relation && ` · ${relation}`}
                {nidLast4 && ` · NID শেষ ৪ সংখ্যা ${nidLast4}`}
              </li>
            ))}
          </ul>
        </Card>

        {copy.rules.length > 0 && (
          <Card className="flex flex-col gap-2">
            <h2 className="text-base font-bold">বাড়ির নিয়ম</h2>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
              {copy.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ol>
          </Card>
        )}

        <p className="text-center text-sm text-muted">ভাড়াটিয়া এই হিসাব ও নিয়মে সম্মতি দিয়েছেন। এটি স্ট্যাম্প করা চুক্তিপত্র নয়। HouseOne থেকে তৈরি।</p>
      </div>
    </div>
  );
};

export default FormCopy;
