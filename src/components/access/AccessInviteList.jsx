"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { levelLabel } from "@/lib/accessOptions";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { propertyPath } from "@/lib/navigation";
import { formatDate } from "@/lib/tenancyOptions";
import { useAnswerAccessInviteMutation, useGetMyAccessInvitesQuery } from "@/redux/features/access/accessApi";

// আমাকে দেওয়া অ্যাক্সেসের দাওয়াত — Dashboard আর "আমাকে দেওয়া সম্পদ" এর উপরে; না থাকলে কিছুই না
const AccessInviteList = () => {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const { data } = useGetMyAccessInvitesQuery();
  const [answerInvite] = useAnswerAccessInviteMutation();
  const invites = data?.data || [];
  if (invites.length === 0) return null;

  const answer = async (invite, action) => {
    setBusy(`${invite._id}-${action}`);
    try {
      const response = await answerInvite({ grantId: invite._id, action }).unwrap();
      if (action === "accept") {
        toast.success("অ্যাক্সেস নেওয়া হয়েছে");
        router.push(propertyPath(response.data.propertyId));
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
        <Card key={invite._id} data-access-invite={invite.ownerName} className="flex flex-col gap-3 border-primary bg-primary-soft sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold wrap-break-word">{invite.properties.map(({ name }) => name).join(", ")}</p>
            <p className="text-sm">
              {invite.ownerName} আপনাকে অ্যাক্সেস দিয়েছেন ({levelLabel(invite.level)}) · {formatDate(invite.expiresAt)} পর্যন্ত
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" isLoading={busy === `${invite._id}-accept`} disabled={!!busy} onClick={() => answer(invite, "accept")}>
              Accept
            </Button>
            <Button size="sm" variant="outline" isLoading={busy === `${invite._id}-decline`} disabled={!!busy} onClick={() => answer(invite, "decline")}>
              Decline
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AccessInviteList;
