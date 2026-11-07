"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/Button";
import { formatDate } from "@/lib/tenancyOptions";
import { formLink } from "@/lib/tenantFormOptions";

// লিংক, WhatsApp বা QR — ভাড়াটিয়া সামনে থাকলে QR সবচেয়ে সহজ
// message, note — আগে জমা দেওয়া ফর্মের কপি পাঠানোর সময় আলাদা লেখা
const ShareForm = ({ form, message: customMessage, note }) => {
  const [copied, setCopied] = useState(false);

  const link = formLink(form.token);
  const message = `${customMessage ?? `${form.propertyName}, ${form.unitName} এর ভাড়াটিয়া ফর্ম। এই লিংকে গিয়ে পূরণ করুন:`} ${link}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("কপি হয়নি। লিংকটি নিজে সিলেক্ট করে কপি করুন।");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto shrink-0 rounded-lg border border-border bg-surface p-3 sm:mx-0">
        <QRCodeSVG value={link} size={140} aria-label="QR code for the form" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p data-form-link className="rounded-lg bg-background px-3 py-2 text-xs break-all text-muted">
          {link}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className={buttonClasses({ size: "sm" })}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>
        <p className="text-xs text-muted">{note ?? `${formatDate(form.expiresAt)} পর্যন্ত লিংকটি কাজ করবে। জমা দিলে লিংক বন্ধ হয়ে যাবে।`}</p>
      </div>
    </div>
  );
};

export default ShareForm;
