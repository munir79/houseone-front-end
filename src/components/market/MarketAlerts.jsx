"use client";

import Link from "next/link";
import { FileSignature, HandCoins, MessageCircle, TrendingUp } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { formatMoney } from "@/lib/formatMoney";
import { installmentMessage, whatsappLink } from "@/lib/marketOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetMarketAlertsQuery } from "@/redux/features/tenancy/tenancyApi";

const MAX_ROWS = 5;
const shopPath = ({ property, unit }, tab) => `/properties/${property}/units/${unit}${tab ? `?tab=${tab}` : ""}`;

const ShopLabel = ({ item }) => (
  <span className="min-w-0">
    <span className="block text-sm font-medium wrap-break-word">
      {item.unitName}
      {item.businessName && <span className="text-muted"> · {item.businessName}</span>}
    </span>
  </span>
);

const daysText = (daysLeft) => (daysLeft > 0 ? `${toBanglaNumber(daysLeft)} দিন পর` : daysLeft === 0 ? "আজ" : `${toBanglaNumber(-daysLeft)} দিন পেরিয়েছে`);

// মার্কেটের কাজ — কিস্তির তারিখ, ভাড়া বৃদ্ধির সময়, চুক্তি নবায়ন; কিছু না থাকলে কিছুই দেখায় না
// propertyId — একটা মার্কেটের Overview; না দিলে মার্কেটের জগতের সব
const MarketAlerts = ({ propertyId }) => {
  const { data } = useGetMarketAlertsQuery(propertyId ? { propertyId } : { world: "market" });
  const alerts = data?.data;
  if (!alerts) return null;
  const { installments, increases, renewals } = alerts;
  if (installments.length + increases.length + renewals.length === 0) return null;

  return (
    <Card flush data-market-alerts className="overflow-hidden">
      <h2 className="border-b border-border px-4 py-3 text-base font-bold">মার্কেটের কাজ</h2>

      {installments.length > 0 && (
        <section className="border-b border-border last:border-b-0">
          <p className="flex items-center gap-2 px-4 pt-3 text-sm font-semibold">
            <HandCoins className="h-4 w-4 text-warning" aria-hidden="true" />
            পজিশন মানির কিস্তি
          </p>
          <ul className="divide-y divide-border">
            {installments.slice(0, MAX_ROWS).map((item) => (
              <li key={`${item.tenancyId}-${item.index}`} data-alert-installment className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <Link href={shopPath(item, "installments")} className="min-w-0 hover:underline">
                  <ShopLabel item={item} />
                  <span className="block text-xs text-muted">
                    {toBanglaNumber(item.index + 1)}নং কিস্তি {formatMoney(item.amount)} · {formatDate(item.dueDate)}
                  </span>
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant={item.daysLeft < 0 ? "danger" : "warning"}>{daysText(item.daysLeft)}</Badge>
                  <a
                    href={whatsappLink(item.tenantPhone, installmentMessage({ ...item, isLate: item.daysLeft < 0 }))}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp reminder to ${item.unitName}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {increases.length > 0 && (
        <section className="border-b border-border last:border-b-0">
          <p className="flex items-center gap-2 px-4 pt-3 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-info" aria-hidden="true" />
            ভাড়া বৃদ্ধির সময়
          </p>
          <ul className="divide-y divide-border">
            {increases.slice(0, MAX_ROWS).map((item) => (
              <li key={`${item.tenancyId}-${item.step}`} data-alert-increase>
                <Link href={`/tenants/${item.tenancyId}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-background">
                  <span className="min-w-0">
                    <ShopLabel item={item} />
                    <span className="block text-xs text-muted">
                      {formatMoney(item.currentRent)} থেকে {formatMoney(item.suggestedRent)} · {formatDate(item.dueOn)}
                    </span>
                  </span>
                  <Badge variant="info">সিদ্ধান্ত নিন</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {renewals.length > 0 && (
        <section>
          <p className="flex items-center gap-2 px-4 pt-3 text-sm font-semibold">
            <FileSignature className="h-4 w-4 text-warning" aria-hidden="true" />
            চুক্তি শেষ হচ্ছে
          </p>
          <ul className="divide-y divide-border">
            {renewals.slice(0, MAX_ROWS).map((item) => (
              <li key={item.tenancyId} data-alert-renewal>
                <Link href={`/tenants/${item.tenancyId}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-background">
                  <ShopLabel item={item} />
                  <span className="shrink-0 text-sm text-muted">{formatDate(item.contractEnd)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
};

export default MarketAlerts;
