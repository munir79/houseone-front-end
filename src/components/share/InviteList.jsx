"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate } from "@/lib/tenancyOptions";
import { useAnswerInviteMutation, useGetMyInvitesQuery } from "@/redux/features/share/shareApi";

// আমাকে পাঠানো অংশীদার হওয়ার দাওয়াত — Dashboard এর উপরে ও /invites পাতায়
const InviteList = ({ showEmpty = false }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const { data, isLoading } = useGetMyInvitesQuery();
  const [answerInvite] = useAnswerInviteMutation();

  const invites = data?.data || [];
  if (isLoading) return null;
  if (invites.length === 0) {
    return showEmpty ? (
      <Card className="text-sm text-muted">
        এখন কোনো দাওয়াত নেই। কেউ আপনাকে তাঁর বাড়ির অংশীদার করতে চাইলে এখানে দেখাবে।
      </Card>
    ) : null;
  }

  const answer = async (invite, action) => {
    setBusy(`${invite._id}-${action}`);
    try {
      const response = await answerInvite({ inviteId: invite._id, action }).unwrap();
      if (action === "accept") {
        toast.success(`আপনি এখন "${invite.propertyName}" বাড়ির অংশীদার`);
        router.push(`/properties/${response.data.propertyId}`);
      } else {
        toast.success("দাওয়াত ফিরিয়ে দিয়েছেন");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {invites.map((invite) => (
        <Card key={invite._id} data-my-invite={invite.propertyName} className="flex flex-col gap-3 border-primary bg-primary-soft sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Handshake className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold wrap-break-word">{invite.propertyName}</p>
            <p className="text-sm">
              {invite.invitedByName} আপনাকে এই বাড়ির অংশীদার হতে বলেছেন · {formatDate(invite.expiresAt)} পর্যন্ত
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" isLoading={busy === `${invite._id}-decline`} disabled={Boolean(busy)} onClick={() => answer(invite, "decline")} className="flex-1 sm:flex-none">
              Decline
            </Button>
            <Button size="sm" isLoading={busy === `${invite._id}-accept`} disabled={Boolean(busy)} onClick={() => answer(invite, "accept")} className="flex-1 sm:flex-none">
              Accept
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default InviteList;
