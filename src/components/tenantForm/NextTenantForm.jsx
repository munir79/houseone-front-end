"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Send } from "lucide-react";
import SendFormModal from "./SendFormModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { FORM_STATUS } from "@/lib/tenantFormOptions";
import { useGetUnitFormQuery } from "@/redux/features/tenantForm/tenantFormApi";

// ভাড়াটিয়া বাসা ছাড়ার নোটিশ দিলে — পরের ভাড়াটিয়া আগেই ফর্ম পূরণ করে রাখেন, Approve হয় Move Out এর পরে
const NextTenantForm = ({ unit }) => {
  const [isSendOpen, setIsSendOpen] = useState(false);
  const { data, isLoading } = useGetUnitFormQuery(unit._id);
  const form = data?.data;

  if (isLoading) return null;

  return (
    <div data-next-tenant className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {form ? (
        <Link href={`/tenants/forms/${form._id}`} className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-semibold">পরের ভাড়াটিয়ার ফর্ম</span>
              <span className="block truncate text-muted">{form.name || "এখনো পূরণ হয়নি"}</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <Badge variant={FORM_STATUS[form.status].variant}>{FORM_STATUS[form.status].label}</Badge>
            <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </span>
        </Link>
      ) : (
        <>
          <p className="text-sm">
            <span className="block font-semibold">পরের ভাড়াটিয়া পেয়েছেন?</span>
            <span className="text-muted">এখনই ফর্ম পাঠান। তিনি আগে পূরণ করে রাখবেন, এখনকার ভাড়াটিয়া বের হলে Approve করবেন।</span>
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsSendOpen(true)} className="shrink-0">
            <Send className="h-4 w-4" aria-hidden="true" />
            Send Form
          </Button>
        </>
      )}

      {isSendOpen && <SendFormModal unit={unit} onClose={() => setIsSendOpen(false)} />}
    </div>
  );
};

export default NextTenantForm;
