"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import PayModal from "./PayModal";
import PaymentList from "./PaymentList";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatMoney } from "@/lib/formatMoney";
import { useGetAdvanceSummaryQuery } from "@/redux/features/payment/paymentApi";

// Advance — চুক্তি কত, কত পেয়েছেন, কত বাকি, কিস্তির রসিদ
const AdvanceCard = ({ tenancy, canReceive }) => {
  const [isPaying, setIsPaying] = useState(false);
  const { data } = useGetAdvanceSummaryQuery(tenancy._id);

  const summary = data?.data;
  if (!summary || summary.agreed === 0) return null;

  const status = summary.due === 0 ? { label: "Received", variant: "success" } : summary.received > 0 ? { label: "Partly received", variant: "info" } : { label: "Not received", variant: "warning" };

  return (
    <Card data-advance className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
          Advance
          <Badge variant={status.variant}>{status.label}</Badge>
        </h2>
        {canReceive && summary.due > 0 && (
          <Button size="sm" onClick={() => setIsPaying(true)}>
            Receive Advance
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-muted">চুক্তি</dt>
          <dd className="font-bold tabular-nums">{formatMoney(summary.agreed)}</dd>
        </div>
        <div>
          <dt className="text-muted">পেয়েছেন</dt>
          <dd className="font-bold tabular-nums">{formatMoney(summary.received)}</dd>
        </div>
        <div>
          <dt className="text-muted">বাকি</dt>
          <dd className="font-bold tabular-nums">{formatMoney(summary.due)}</dd>
        </div>
      </dl>
      {summary.used > 0 && <p className="text-sm text-muted">বিলে সমন্বয় হয়েছে {formatMoney(summary.used)}</p>}

      <PaymentList query={{ tenancyId: tenancy._id }} kind="Advance" />

      {isPaying && <PayModal advance={{ tenancyId: tenancy._id, due: summary.due, label: `${tenancy.tenantName} · Advance` }} onClose={() => setIsPaying(false)} />}
    </Card>
  );
};

export default AdvanceCard;
