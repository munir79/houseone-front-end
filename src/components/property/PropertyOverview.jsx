"use client";

import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle2, CircleAlert, PiggyBank, Plus, ReceiptText, TrendingUp, UserX } from "lucide-react";
import HouseStats from "./HouseStats";
import CollectionChart from "@/components/dashboard/CollectionChart";
import LeavingSoon from "@/components/dashboard/LeavingSoon";
import PageHero from "@/components/dashboard/PageHero";
import RecentReceipts from "@/components/dashboard/RecentReceipts";
import UnitList, { NEEDS_ACTION, RENT_PENDING } from "@/components/unit/UnitList";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { propertyPath } from "@/lib/navigation";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { unitActivity } from "@/lib/unitActivity";
import { useGetDashboardMoneyQuery } from "@/redux/features/dashboard/dashboardApi";
import { useGetTenancySummaryQuery } from "@/redux/features/tenancy/tenancyApi";
import { useGetPropertyUnitsQuery } from "@/redux/features/unit/unitApi";

// একটা সম্পদের Dashboard — Dashboard এর একই হিসাব, শুধু এই সম্পদের
const PropertyOverview = ({ property, badge, menu, onAddAsset }) => {
  const router = useRouter();
  const id = property._id;
  const { data: moneyData, isLoading: isMoneyLoading } = useGetDashboardMoneyQuery({ propertyId: id });
  const { data: tenancySummaryData } = useGetTenancySummaryQuery({ propertyId: id });
  const { data: unitsData } = useGetPropertyUnitsQuery(id);

  const money = moneyData?.data;
  const monthName = money ? monthLabel(money.month).split(" ")[0] : "";
  const units = unitsData?.data || [];
  const actionCount = units.filter((unit) => unitActivity(unit)?.needsAction).length;
  const kindText = property.kind === "flats" ? "অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট" : "পুরো বাড়ি";

  return (
    <>
      <PageHero
        eyebrow={`${kindText} · ${property.area}, ${property.city}`}
        title={property.name}
        badge={badge}
        description="এই সম্পদের ভাড়া, খরচ আর লাভের হিসাব এক জায়গায়।"
        aside={menu}
        actions={
          <>
            <LinkButton href={propertyPath(id, "billing")} size="sm">
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
              বিল ও রসিদ
            </LinkButton>
            <LinkButton href={propertyPath(id, "reports")} size="sm" variant="outline">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              রিপোর্ট
            </LinkButton>
          </>
        }
      />

      <HouseStats property={property} onOpenRent={() => router.push(propertyPath(id, "billing"))} onOpenPending={() => router.push(propertyPath(id, `units?filter=${RENT_PENDING}`))} />

      {/* এই মাসের আদায় উপরের কার্ডে — এখানে বাকি, জমা, লাভ আর পুরোনো বকেয়া */}
      <StatStrip
        isLoading={isMoneyLoading}
        items={[
          { key: "due", label: `${monthName} বাকি`, value: formatMoney(money?.thisMonth.due || 0), hint: money?.thisMonth.dueFlats ? `${money.thisMonth.dueFlats} flats` : undefined, icon: CircleAlert, tone: "amber", onClick: () => router.push(propertyPath(id, "billing")) },
          { key: "advance", label: "Advance জমা", value: formatMoney(money?.advanceHeld || 0), hint: "হাতে আছে", icon: PiggyBank, tone: "blue" },
          {
            key: "profit",
            label: `${monthName} লাভ`,
            value: formatMoney(money?.thisMonth.profit || 0),
            hint: money ? `খরচ ${formatMoney(money.thisMonth.expenses)}` : undefined,
            icon: TrendingUp,
            tone: (money?.thisMonth.profit || 0) < 0 ? "red" : "green",
            onClick: () => router.push(propertyPath(id, "expenses")),
          },
          {
            key: "notCollected",
            label: "আদায় হয়নি",
            value: formatMoney(money?.notCollected.amount || 0),
            hint: money?.notCollected.tenants ? `${toBanglaNumber(money.notCollected.tenants)} জন সাবেক ভাড়াটিয়া` : "কোনো বকেয়া নেই",
            icon: UserX,
            tone: (money?.notCollected.amount || 0) > 0 ? "red" : "green",
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          {money ? <CollectionChart chart={money.chart} /> : <Skeleton className="h-72 w-full rounded-2xl" />}

          {actionCount > 0 ? (
            <div data-overview-actions className="flex flex-col gap-2">
              <h2 className="text-base font-bold">করণীয় ({toBanglaNumber(actionCount)})</h2>
              <UnitList property={property} initialFilter={NEEDS_ACTION} />
            </div>
          ) : (
            <Card data-overview-clear className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                এই সম্পদে এখন কোনো কাজ বাকি নেই
              </p>
              <LinkButton href={propertyPath(id, "units")} variant="outline" size="sm">
                {property.kind === "flats" ? "আমার ফ্ল্যাট" : "সব ইউনিট"}
              </LinkButton>
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {money ? <RecentReceipts payments={money.recent} allHref={propertyPath(id, "billing?view=receipts")} /> : <Skeleton className="h-44 w-full rounded-2xl" />}
          <LeavingSoon items={tenancySummaryData?.data?.leavingSoon} />
          {onAddAsset && (
            <Button data-add-asset variant="outline" size="sm" onClick={onAddAsset} className="w-fit">
              <Plus className="h-4 w-4" aria-hidden="true" />
              আরেকটা সম্পদ যোগ করুন
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default PropertyOverview;
