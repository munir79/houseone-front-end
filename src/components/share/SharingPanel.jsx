"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, PieChart, User, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import SharesEditor from "./SharesEditor";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import { monthLabel } from "@/lib/billOptions";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetReportQuery } from "@/redux/features/report/reportApi";
import { useCancelInviteMutation, useGetSharingQuery, useInviteOwnerMutation, useRemoveOwnerMutation } from "@/redux/features/share/shareApi";
import { useGetPropertyUnitsQuery } from "@/redux/features/unit/unitApi";

const monthRange = (month) => {
  const [year, number] = month.split("-").map(Number);
  return { from: `${month}-01`, to: `${month}-${String(new Date(Date.UTC(year, number, 0)).getUTCDate()).padStart(2, "0")}` };
};

// একটি ভাগের সারাংশ — শতাংশে: নাম ও %, ফ্ল্যাটে: নাম ও কয়টি ফ্ল্যাট
const ShareSummary = ({ entry, members }) => {
  const nameOf = (id) => members.find(({ _id }) => _id === id)?.name ?? "সাবেক অংশীদার";
  const rows =
    entry.mode === "percent"
      ? entry.percents.map(({ user, percent }) => ({ id: user, text: `${toBanglaNumber(percent)}%` }))
      : Object.entries(entry.flats.reduce((all, { owner }) => ({ ...all, [owner]: (all[owner] || 0) + 1 }), {})).map(([id, count]) => ({ id, text: `${toBanglaNumber(count)}টি ফ্ল্যাট` }));
  return (
    <ul className="flex flex-wrap gap-2">
      {rows.map(({ id, text }) => (
        <li key={id} className="rounded-full bg-background px-3 py-1 text-sm">
          {nameOf(id)}: <span className="font-semibold">{text}</span>
        </li>
      ))}
    </ul>
  );
};

// অংশীদার বাদ দেওয়ার আগে — এই মাসের দেনা-পাওনা বাকি থাকলে সতর্ক
const RemoveDialog = ({ propertyId, member, month, onClose }) => {
  const [removeOwner, { isLoading }] = useRemoveOwnerMutation();
  const { data } = useGetReportQuery({ ...monthRange(month), propertyIds: propertyId });
  const open = (data?.data?.shares?.transfers || []).filter(({ from, to }) => from === member._id || to === member._id);
  const owed = open.reduce((sum, { amount }) => sum + amount, 0);

  const handleRemove = async () => {
    try {
      await removeOwner({ propertyId, userId: member._id }).unwrap();
      toast.success(`${member.name} আর অংশীদার নন`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "বাদ দেওয়া যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <ConfirmDialog
      title="Remove partner?"
      message={`${member.name} এখনই এই বাড়ি আর দেখতে পারবেন না। তাঁর তোলা রসিদ ও খরচ ইতিহাসে থাকবে, আর পরের মাস থেকে তাঁর ভাগ আপনার।${owed > 0 ? ` ⚠️ এই মাসে ${member.name}-এর সাথে ${formatMoney(owed)} মেলানো বাকি — রিপোর্ট থেকে আগে মিটিয়ে নিন।` : ""}`}
      confirmLabel="Remove"
      isLoading={isLoading}
      onConfirm={handleRemove}
      onClose={onClose}
    />
  );
};

// বাড়ির Sharing tab — সদস্য, দাওয়াত, ভাগ; বদলানো শুধু মূল মালিকের
const SharingPanel = ({ propertyId }) => {
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [removing, setRemoving] = useState(null);

  const { data, isLoading } = useGetSharingQuery(propertyId);
  const { data: unitsData } = useGetPropertyUnitsQuery(propertyId);
  const [inviteOwner, { isLoading: isInviting }] = useInviteOwnerMutation();
  const [cancelInvite] = useCancelInviteMutation();

  if (isLoading || !data) return <Skeleton className="h-64 w-full rounded-2xl" />;
  const sharing = data.data;
  const { isMain, members, invites, current, pending } = sharing;
  const units = unitsData?.data || [];

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      await inviteOwner({ propertyId, email: email.trim() }).unwrap();
      toast.success("দাওয়াত পাঠানো হয়েছে");
      setEmail("");
    } catch (err) {
      toast.error(getErrorMessage(err, "দাওয়াত পাঠানো যায়নি"));
    }
  };

  const handleCancel = async (inviteId) => {
    try {
      await cancelInvite({ propertyId, inviteId }).unwrap();
      toast.success("দাওয়াত বাতিল হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "বাতিল হয়নি"));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card flush data-sharing-members className="overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-base font-bold">মালিকেরা</h2>
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li key={member._id} data-member={member.name} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary">
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold wrap-break-word">{member.name}</span>
                <span className="block truncate text-xs text-muted">{member.email}</span>
              </span>
              <Badge variant={member.isMain ? "success" : "info"}>{member.isMain ? "মূল মালিক" : "অংশীদার"}</Badge>
              {isMain && !member.isMain && (
                <button
                  type="button"
                  onClick={() => setRemoving(member)}
                  aria-label={`Remove ${member.name}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                >
                  <UserMinus className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>

        {invites.length > 0 && (
          <div className="border-t border-border">
            <h3 className="bg-background px-4 py-2 text-xs font-semibold text-muted">দাওয়াত পাঠানো হয়েছে, এখনো Accept করেননি</h3>
            <ul className="divide-y divide-border">
              {invites.map((invite) => (
                <li key={invite._id} data-invite={invite.email} className="flex items-center gap-3 py-2 pr-2 pl-4">
                  <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{invite.email}</span>
                    <span className="block text-xs text-muted">{formatDate(invite.expiresAt)} পর্যন্ত খোলা</span>
                  </span>
                  {isMain && (
                    <button type="button" onClick={() => handleCancel(invite._id)} aria-label={`Cancel invite ${invite.email}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isMain && (
          <form data-invite-form onSubmit={handleInvite} noValidate className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-end">
            <Input id="inviteEmail" type="email" label="অংশীদারের ইমেইল" placeholder="partner@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="sm:flex-1" />
            <Button type="submit" isLoading={isInviting} disabled={!email.trim()}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              দাওয়াত পাঠান
            </Button>
          </form>
        )}
      </Card>

      <Card data-sharing-shares className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <PieChart className="h-5 w-5 text-primary" aria-hidden="true" />
            ভাগ
          </h2>
          {isMain && members.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              {current || pending ? "ভাগ বদলান" : "ভাগ ঠিক করুন"}
            </Button>
          )}
        </div>

        {members.length < 2 ? (
          <p className="text-sm text-muted">একা মালিক। অংশীদার যোগ হলে এখানে ভাগ ঠিক করবেন — শতাংশে বা ফ্ল্যাট ভাগে।</p>
        ) : !current && !pending ? (
          <p className="text-sm text-warning-foreground">ভাগ এখনো ঠিক করা হয়নি। ঠিক না করা পর্যন্ত সব লাভ মূল মালিকের হিসাবে দেখাবে।</p>
        ) : (
          <>
            {current && (
              <div data-share-current className="flex flex-col gap-2">
                <p className="text-sm text-muted">
                  এখন চালু · {current.mode === "percent" ? "শতাংশে" : "ফ্ল্যাট ভাগে"} · {monthLabel(current.from)} থেকে
                </p>
                <ShareSummary entry={current} members={members} />
              </div>
            )}
            {pending && (
              <div data-share-pending className="flex flex-col gap-2 rounded-xl border border-info/40 bg-info-soft/40 p-3">
                <p className="text-sm font-semibold">
                  {monthLabel(pending.from)} থেকে চালু হবে · {pending.mode === "percent" ? "শতাংশে" : "ফ্ল্যাট ভাগে"}
                </p>
                <ShareSummary entry={pending} members={members} />
              </div>
            )}
          </>
        )}

        {members.length > 1 && (
          <Link href={`/reports?house=${propertyId}`} className="inline-flex min-h-9 w-fit items-center gap-1 text-sm font-semibold text-primary">
            ভাগের হিসাব ও দেনা-পাওনা দেখুন
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </Card>

      {isEditing && (
        <SharesEditor
          propertyId={propertyId}
          members={members}
          units={units}
          start={pending ?? current}
          isFirst={!current && !pending}
          onClose={() => setIsEditing(false)}
        />
      )}
      {removing && <RemoveDialog propertyId={propertyId} member={removing} month={sharing.currentMonth} onClose={() => setRemoving(null)} />}
    </div>
  );
};

export default SharingPanel;
