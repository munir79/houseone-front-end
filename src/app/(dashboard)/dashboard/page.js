"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, BellRing, Building2, CircleAlert, Home, PiggyBank, TrendingUp, UserPlus, UserX, Users, Wallet } from "lucide-react";
import CollectionChart from "@/components/dashboard/CollectionChart";
import AssetGlance from "@/components/dashboard/AssetGlance";
import LeavingSoon from "@/components/dashboard/LeavingSoon";
import PageHero from "@/components/dashboard/PageHero";
import RecentReceipts from "@/components/dashboard/RecentReceipts";
import InviteList from "@/components/share/InviteList";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useGetDashboardMoneyQuery } from "@/redux/features/dashboard/dashboardApi";
import { useGetPropertySummaryQuery } from "@/redux/features/property/propertyApi";
import { useGetTenancySummaryQuery } from "@/redux/features/tenancy/tenancyApi";

const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const QUICK_ACTIONS = [
  { label: "Add Property", href: "/properties", icon: Home },
  { label: "Add Tenant", href: "/properties", icon: UserPlus },
  { label: "View Tenants", href: "/tenants", icon: Users },
];

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

// কত ভাগ ইউনিটে ভাড়াটিয়া আছে — আসল সংখ্যা থেকে
const OccupancyCard = ({ summary }) => {
  const percent = summary.units ? Math.round((summary.occupied / summary.units) * 100) : 0;

  return (
    <Card>
      <h2 className="text-base font-bold">Occupancy</h2>
      <div className="mt-3 flex items-center gap-5 lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
        <div className="relative h-28 w-28 shrink-0 lg:self-center xl:self-auto">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" strokeWidth="11" className="stroke-primary-soft" />
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
              className="stroke-primary"
            />
          </svg>
          <span data-occupancy className="absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums">
            {percent}%
          </span>
        </div>
        <dl className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Occupied</dt>
            <dd className="font-bold tabular-nums">{summary.occupied}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Vacant</dt>
            <dd className="font-bold tabular-nums">{summary.vacant}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Total units</dt>
            <dd className="font-bold tabular-nums">{summary.units}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Properties</dt>
            <dd data-houses className="font-bold tabular-nums">{summary.houses}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
};

// সব বাড়ি মিলিয়ে যা করতে হবে — শূন্য হলে বাড়তি জায়গা নেয় না
const NeedsActionCard = ({ needsAction }) => {
  const rows = [
    { key: "overdue", label: "Rent overdue", count: needsAction.overdue, href: "/billing" },
    { key: "notBilled", label: "Bills to create", count: needsAction.notBilled, href: "/billing" },
    { key: "unsentBills", label: "Bills not sent", count: needsAction.unsentBills, href: "/billing" },
    { key: "memberRequests", label: "Member approvals", count: needsAction.memberRequests, href: "/tenants" },
    { key: "approvals", label: "Needs approval", count: needsAction.approvals, href: "/tenants" },
    { key: "sentBack", label: "Sent back", count: needsAction.sentBack, href: "/tenants" },
    { key: "expired", label: "Link expired", count: needsAction.expired, href: "/tenants" },
    { key: "leaving", label: "Leaving soon", count: needsAction.leaving, href: "/tenants" },
    { key: "openIssues", label: "Complain & Needs", count: needsAction.openIssues, href: "/issues" },
  ].filter(({ count }) => count > 0);

  return (
    <Card flush data-needs-action={needsAction.total} className="overflow-hidden">
      <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-base font-bold">
        <BellRing className="h-5 w-5 text-danger" aria-hidden="true" />
        Needs Action
        <span className="ml-auto text-lg tabular-nums">{needsAction.total}</span>
      </h2>
      {rows.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">এখন আপনার কোনো কাজ বাকি নেই।</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map(({ key, label, count, href }) => (
            <li key={key}>
              <Link href={href} data-action-row={key} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 text-sm font-medium hover:bg-background">
                {label}
                <span className="font-bold tabular-nums">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

// এই মাসের আদায়ের কার্ডে লক্ষ্য ও ফ্ল্যাটের Progress
const CollectedExtra = ({ thisMonth }) => {
  const percent = thisMonth.flats ? Math.round((thisMonth.paidFlats / thisMonth.flats) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div role="progressbar" aria-label="Flats paid this month" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-border/70">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted sm:text-sm">
        <span className="whitespace-nowrap">লক্ষ্য {formatMoney(thisMonth.target)}</span>
        {thisMonth.isEstimate && " (আনুমানিক)"} · <span className="whitespace-nowrap">{toBanglaNumber(thisMonth.paidFlats)}/{toBanglaNumber(thisMonth.flats)} ফ্ল্যাট</span>
      </p>
    </div>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const { data: profile } = useGetMyProfileQuery();
  const { data: propertySummaryData } = useGetPropertySummaryQuery();
  const { data: tenancySummaryData } = useGetTenancySummaryQuery();
  const { data: moneyData, isLoading: isMoneyLoading } = useGetDashboardMoneyQuery();

  const firstName = profile?.data?.name?.split(" ")[0];
  const propertySummary = propertySummaryData?.data;
  const tenancySummary = tenancySummaryData?.data;
  const leavingSoon = tenancySummary?.leavingSoon || [];
  const money = moneyData?.data;
  const monthName = money ? monthLabel(money.month).split(" ")[0] : "";

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={`${greeting()}, ${firstName}!`}
        title="Welcome back to HouseOne"
        description="আপনার বাড়ি, ভাড়াটিয়া আর ভাড়ার হিসাব এক জায়গায়।"
        actions={
          <>
            <LinkButton href="/properties" size="sm">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              আমার সম্পদ
            </LinkButton>
            {/* সব জায়গার লাভ-ক্ষতি একসাথে — বছরের শেষে কাজে লাগে */}
            <LinkButton href="/reports" size="sm" variant="outline" data-all-reports>
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              সব সম্পদের রিপোর্ট
            </LinkButton>
          </>
        }
      />

      <InviteList />

      <StatStrip
        isLoading={isMoneyLoading}
        items={[
          {
            key: "collected",
            label: `${monthName} আদায়`,
            value: formatMoney(money?.thisMonth.collected || 0),
            icon: Wallet,
            onClick: () => router.push("/billing"),
            extra: money && money.thisMonth.flats > 0 ? <CollectedExtra thisMonth={money.thisMonth} /> : null,
            highlight: money && money.thisMonth.flats > 0 && money.thisMonth.paidFlats === money.thisMonth.flats,
          },
          { key: "due", label: `${monthName} বাকি`, value: formatMoney(money?.thisMonth.due || 0), hint: money?.thisMonth.dueFlats ? `${money.thisMonth.dueFlats} flats` : undefined, icon: CircleAlert, tone: "amber", onClick: () => router.push("/billing") },
          { key: "advance", label: "Advance জমা", value: formatMoney(money?.advanceHeld || 0), hint: "হাতে আছে", icon: PiggyBank, tone: "blue" },
          {
            key: "profit",
            label: `${monthName} লাভ`,
            value: formatMoney(money?.thisMonth.profit || 0),
            hint: money ? `খরচ ${formatMoney(money.thisMonth.expenses)}` : undefined,
            icon: TrendingUp,
            tone: (money?.thisMonth.profit || 0) < 0 ? "red" : "green",
            onClick: () => router.push("/expenses"),
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          {money ? <CollectionChart chart={money.chart} /> : <Skeleton className="h-72 w-full rounded-2xl" />}
          <AssetGlance houses={money?.houses || []} byHouse={propertySummary?.byHouse} monthName={monthName} isLoading={!money} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {money?.notCollected.amount > 0 && (
            <Card data-not-collected className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger text-primary-foreground">
                <UserX className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">আদায় হয়নি</span>
                <span className="block text-xl font-bold tabular-nums">{formatMoney(money.notCollected.amount)}</span>
                <span className="block text-xs text-muted">{toBanglaNumber(money.notCollected.tenants)} জন সাবেক ভাড়াটিয়ার বকেয়া</span>
              </span>
            </Card>
          )}
          {propertySummary && <NeedsActionCard needsAction={propertySummary.needsAction} />}
          {money && <RecentReceipts payments={money.recent} />}
          {propertySummary ? <OccupancyCard summary={propertySummary} /> : <Skeleton className="h-44 w-full rounded-2xl" />}

          <Card>
            <h2 className="text-base font-bold">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-1 xl:grid-cols-3">
              {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href} className="flex min-h-22 flex-col items-center justify-center gap-1.5 rounded-xl bg-primary-soft p-2 text-center text-sm font-semibold text-primary lg:min-h-11 lg:flex-row lg:justify-start lg:gap-2 lg:px-3 xl:min-h-22 xl:flex-col xl:justify-center xl:gap-1.5 xl:px-2">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          <LeavingSoon items={leavingSoon} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
