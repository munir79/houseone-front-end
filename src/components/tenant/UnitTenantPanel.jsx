"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Send, UserPlus, Users } from "lucide-react";
import AddTenantModal from "./AddTenantModal";
import SendFormModal from "@/components/tenantForm/SendFormModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/formatMoney";
import { formatDate, formatStay } from "@/lib/tenancyOptions";
import { FORM_STATUS } from "@/lib/tenantFormOptions";
import { useGetUnitTenanciesQuery } from "@/redux/features/tenancy/tenancyApi";
import { useGetUnitFormQuery } from "@/redux/features/tenantForm/tenantFormApi";

const TenancyRow = ({ tenancy }) => (
  <li>
    <Link href={`/tenants/${tenancy._id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background">
      <span className="min-w-0">
        <span className="block text-sm font-medium wrap-break-word">{tenancy.tenantName}</span>
        <span className="block text-xs text-muted">
          {formatDate(tenancy.startDate)} {tenancy.endDate ? `থেকে ${formatDate(tenancy.endDate)}` : "থেকে"} · {formatStay(tenancy.startDate, tenancy.endDate)}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="hidden text-sm tabular-nums sm:block">{formatMoney(tenancy.rent)}</span>
        <Badge variant={tenancy.status === "Active" ? "success" : "primary"}>{tenancy.status === "Active" ? tenancy.occupantType : "Former"}</Badge>
        <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
      </span>
    </Link>
  </li>
);

const UnitTenantPanel = ({ unit }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const { data, isLoading } = useGetUnitTenanciesQuery(unit._id);
  const { data: formData } = useGetUnitFormQuery(unit._id);

  const tenancies = data?.data || [];
  const hasActive = tenancies.some(({ status }) => status === "Active");
  const openForm = formData?.data;

  const addButton = (
    <div className="flex flex-wrap justify-center gap-2">
      {!openForm && (
        <Button variant="outline" size="sm" onClick={() => setIsSendOpen(true)}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Send Form
        </Button>
      )}
      <Button size="sm" onClick={() => setIsAddOpen(true)}>
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Add Tenant
      </Button>
    </div>
  );

  return (
    <Card flush className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <h2 className="text-sm font-semibold">Tenants</h2>
        {!hasActive && tenancies.length > 0 && addButton}
      </div>

      {openForm && (
        <Link href={`/tenants/forms/${openForm._id}`} className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{openForm.name || "Tenant form"}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <Badge variant={FORM_STATUS[openForm.status].variant}>{FORM_STATUS[openForm.status].label}</Badge>
            <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </span>
        </Link>
      )}

      {isLoading ? (
        <div className="p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ) : tenancies.length === 0 ? (
        <EmptyState icon={Users} title="No tenant yet" description="নিজে যোগ করুন, অথবা ফর্ম পাঠান, ভাড়াটিয়া নিজেই তথ্য দেবেন।" action={addButton} />
      ) : (
        <ul className="divide-y divide-border">
          {tenancies.map((tenancy) => (
            <TenancyRow key={tenancy._id} tenancy={tenancy} />
          ))}
        </ul>
      )}

      {isAddOpen && <AddTenantModal unit={unit} onClose={() => setIsAddOpen(false)} />}
      {isSendOpen && <SendFormModal unit={unit} onClose={() => setIsSendOpen(false)} />}
    </Card>
  );
};

export default UnitTenantPanel;
