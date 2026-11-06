"use client";

import { useState } from "react";
import { ChevronRight, Crown, LogOut, Pencil, RotateCcw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import DateActionModal from "./DateActionModal";
import MemberFormModal from "./MemberFormModal";
import PersonDetailsModal from "@/components/tenantForm/PersonDetailsModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate, todayInput } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetMemberDocumentsMutation, useMemberActionMutation, useRevealMemberNidMutation } from "@/redux/features/tenancy/tenancyApi";

const MemberRow = ({ member, onOpen }) => (
  <li>
    <button type="button" onClick={onOpen} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-background">
      <span className="min-w-0">
        <span className="block text-sm font-medium wrap-break-word">{member.name}</span>
        <span className="block text-xs text-muted">
          {member.leftAt ? `${formatDate(member.leftAt)} তারিখে চলে গেছেন` : [member.relation, member.occupation, member.phone].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {member.isMain && <Badge variant="info">প্রধান</Badge>}
        <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
      </span>
    </button>
  </li>
);

// ফ্ল্যাটের সবাই — প্রধান ওপরে, যাঁরা চলে গেছেন নিচে আলাদা
const MembersPanel = ({ tenancy }) => {
  const [openId, setOpenId] = useState(null);
  const [formMember, setFormMember] = useState(undefined);
  const [dialog, setDialog] = useState(null);

  const [memberAction, { isLoading: isActing }] = useMemberActionMutation();
  const [revealNid, { isLoading: isRevealing }] = useRevealMemberNidMutation();
  const [getDocuments] = useGetMemberDocumentsMutation();

  const isActive = tenancy.status === "Active";
  const current = tenancy.members.filter(({ leftAt }) => !leftAt).sort((a, b) => Number(b.isMain) - Number(a.isMain));
  const former = tenancy.members.filter(({ leftAt }) => leftAt);
  const hiddenPeople = Math.max(0, tenancy.declaredPeople - current.length - 1);
  const openMember = tenancy.members.find(({ _id }) => _id === openId);

  const run = async (action, body, message) => {
    try {
      await memberAction({ id: tenancy._id, memberId: openMember._id, action, ...body }).unwrap();
      toast.success(message);
      setDialog(null);
      setOpenId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Card flush className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <h2 className="text-sm font-semibold">এই ফ্ল্যাটে যাঁরা আছেন</h2>
        {isActive && (
          <Button size="sm" onClick={() => setFormMember(null)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add Member
          </Button>
        )}
      </div>

      <ul className="divide-y divide-border">
        <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5">
          <span className="min-w-0">
            <span className="block text-sm font-medium wrap-break-word">{tenancy.tenantName}</span>
            <span className="block text-xs text-muted">মূল ভাড়াটিয়া · {tenancy.tenantPhone}</span>
          </span>
          <Badge variant="info">প্রধান</Badge>
        </li>
        {current.map((member) => (
          <MemberRow key={member._id} member={member} onOpen={() => setOpenId(member._id)} />
        ))}
      </ul>

      {hiddenPeople > 0 && <p className="border-t border-border px-4 py-2.5 text-sm text-muted">আরও {toBanglaNumber(hiddenPeople)} জনের তথ্য দেওয়া হয়নি।</p>}

      {former.length > 0 && (
        <>
          <h3 className="border-t border-border bg-background px-4 py-2 text-xs font-medium text-muted">সাবেক সদস্য ({toBanglaNumber(former.length)})</h3>
          <ul className="divide-y divide-border">
            {former.map((member) => (
              <MemberRow key={member._id} member={member} onOpen={() => setOpenId(member._id)} />
            ))}
          </ul>
        </>
      )}

      {openMember && !dialog && (
        <PersonDetailsModal
          key={openMember._id}
          person={openMember}
          isMain={openMember.isMain}
          hasImages={openMember.documents.length > 0 || Boolean(openMember.photo)}
          isRevealing={isRevealing}
          onReveal={() => revealNid({ id: tenancy._id, memberId: openMember._id }).unwrap()}
          loadImages={() => getDocuments({ id: tenancy._id, memberId: openMember._id }).unwrap()}
          onClose={() => setOpenId(null)}
          actions={
            isActive && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormMember(openMember);
                    setOpenId(null);
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
                {openMember.leftAt ? (
                  <Button variant="outline" size="sm" isLoading={isActing} onClick={() => run("returned", {}, "সদস্য আবার তালিকায় এসেছেন")}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Bring Back
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setDialog("left")}>
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Mark as Left
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDialog("primary")}>
                      <Crown className="h-4 w-4" aria-hidden="true" />
                      Make Primary Tenant
                    </Button>
                  </>
                )}
              </>
            )
          }
        />
      )}

      {dialog === "left" && (
        <DateActionModal
          title="Member Left"
          description="তথ্য মুছবে না, সাবেক সদস্য হিসেবে তারিখসহ থাকবে।"
          label="Leaving date"
          initialDate={todayInput()}
          confirmLabel="Confirm"
          isLoading={isActing}
          onConfirm={(leftDate) => run("left", { leftDate }, "সদস্যকে সাবেক তালিকায় নেওয়া হয়েছে")}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === "primary" && (
        <ConfirmDialog
          title="Make primary tenant?"
          message={`${openMember.name} মূল ভাড়াটিয়া হবেন, আর ${tenancy.tenantName} সদস্য হিসেবে থাকবেন।`}
          confirmLabel="Change"
          isLoading={isActing}
          onConfirm={() => run("primary", {}, "মূল ভাড়াটিয়া বদলানো হয়েছে")}
          onClose={() => setDialog(null)}
        />
      )}

      {formMember !== undefined && <MemberFormModal tenancyId={tenancy._id} member={formMember} onClose={() => setFormMember(undefined)} />}
    </Card>
  );
};

export default MembersPanel;
