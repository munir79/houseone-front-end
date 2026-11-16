"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, Building2, CalendarClock, CircleAlert, Home, PiggyBank, TrendingUp, UserPlus, UserX, Users, Wallet } from "lucide-react";
import CollectionChart from "@/components/dashboard/CollectionChart";
import HouseCollection from "@/components/dashboard/HouseCollection";
import RecentReceipts from "@/components/dashboard/RecentReceipts";
import PropertyCard from "@/components/property/PropertyCard";
import InviteList from "@/components/share/InviteList";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useGetDashboardMoneyQuery } from "@/redux/features/dashboard/dashboardApi";
import { useGetPropertiesQuery, useGetPropertySummaryQuery } from "@/redux/features/property/propertyApi";
import { useGetTenancySummaryQuery } from "@/redux/features/tenancy/tenancyApi";

const MAX_HOUSES = 3;
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
  const { data: propertiesData, isLoading: isListLoading } = useGetPropertiesQuery({ page: 1, search: "" });
  const { data: moneyData, isLoading: isMoneyLoading } = useGetDashboardMoneyQuery();

  const firstName = profile?.data?.name?.split(" ")[0];
  const propertySummary = propertySummaryData?.data;
  const tenancySummary = tenancySummaryData?.data;
  const houses = (propertiesData?.data?.data || []).slice(0, MAX_HOUSES);
  const leavingSoon = tenancySummary?.leavingSoon || [];
  const money = moneyData?.data;
  const monthName = money ? monthLabel(money.month).split(" ")[0] : "";

  return (
    <div className="flex flex-col gap-5">
      <section className="relative isolate overflow-hidden rounded-2xl border border-border bg-primary-soft shadow-card">
        <Image
          src="/images/dashboard/dahsboard1.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 80vw, 100vw"
          className="-z-20 object-cover object-[75%_58%]"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-surface via-surface/90 to-surface/55 md:via-surface/75 md:to-transparent" />

        <div className="flex max-w-xl flex-col items-start gap-3 p-5 sm:p-7 lg:py-9">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
            {greeting()}, {firstName}!
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Welcome back to HouseOne</h1>
          <p className="text-base font-medium text-foreground/80">আপনার বাড়ি, ভাড়াটিয়া আর ভাড়ার হিসাব এক জায়গায়।</p>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/properties" size="sm">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Properties
            </LinkButton>
            <LinkButton href="/tenants" size="sm" variant="outline">
              <Users className="h-4 w-4" aria-hidden="true" />
              Tenants
            </LinkButton>
          </div>
        </div>
      </section>

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
          {money && <HouseCollection houses={money.houses} monthName={monthName} />}
          <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">My Properties</h2>
            <Link href="/properties" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary md:min-h-0">
              View All
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {isListLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-72 w-full rounded-2xl" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          ) : houses.length === 0 ? (
            <Card>
              <EmptyState
                icon={Building2}
                title="No properties yet"
                description="প্রথম বাড়িটি যোগ করুন, তারপর এখানে সব হিসাব দেখবেন।"
                action={<LinkButton href="/properties">Go to Properties</LinkButton>}
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {houses.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
              <Card className="flex flex-col items-start justify-center gap-2 bg-primary-soft">
                <p className="text-base font-bold">Need to add a new property?</p>
                <p className="text-sm text-muted">বাড়ি যোগ করুন, তারপর এক ক্লিকে সব ফ্ল্যাট তৈরি হবে।</p>
                <LinkButton href="/properties" size="sm">
                  Add Property
                </LinkButton>
              </Card>
            </div>
          )}
          </div>
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

          {leavingSoon.length > 0 && (
            <Card flush className="overflow-hidden">
              <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-base font-bold">
                <CalendarClock className="h-5 w-5 text-warning" aria-hidden="true" />
                Leaving Soon
              </h2>
              <ul className="divide-y divide-border">
                {leavingSoon.slice(0, MAX_HOUSES).map((item) => (
                  <li key={item._id}>
                    <Link href={`/tenants/${item._id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background">
                      <span className="min-w-0 text-sm font-medium wrap-break-word">{item.unitName}</span>
                      <span className="shrink-0 text-sm text-muted">{formatDate(item.notice.leavingDate)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
