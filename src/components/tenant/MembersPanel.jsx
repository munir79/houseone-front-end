"use client";

import { useState } from "react";
import { Crown, Eye, LogOut, MessageCircle, Pencil, Phone, RotateCcw, UserPlus } from "lucide-react";
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
import { useGetDocumentLinksMutation, useGetMemberDocumentsMutation, useMemberActionMutation, useRevealMemberNidMutation, useRevealNidMutation } from "@/redux/features/tenancy/tenancyApi";

const iconLink = "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary";

// সারি থেকেই সরাসরি কল ও WhatsApp
const ContactLinks = ({ name, phone }) =>
  phone ? (
    <>
      <a href={`tel:${phone}`} aria-label={`Call ${name}`} className={iconLink}>
        <Phone className="h-4 w-4" aria-hidden="true" />
      </a>
      <a href={`https://wa.me/88${phone}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${name}`} className={iconLink}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
      </a>
    </>
  ) : null;

const PersonRow = ({ name, phone, isMain, showContacts, onOpen, children }) => (
  <li className="flex items-center gap-0.5 pr-1 hover:bg-background">
    <button type="button" onClick={onOpen} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 py-2.5 pl-4 text-left">
      <span className="min-w-0">
        <span className="block text-sm font-medium wrap-break-word">{name}</span>
        <span className="block text-xs text-muted">{children}</span>
      </span>
      {isMain && <Badge variant="info">প্রধান</Badge>}
    </button>
    {showContacts && <ContactLinks name={name} phone={phone} />}
    <button type="button" aria-label={`View ${name}`} onClick={onOpen} className={iconLink}>
      <Eye className="h-4 w-4" aria-hidden="true" />
    </button>
  </li>
);

const MemberRow = ({ member, onOpen }) => (
  <PersonRow name={member.name} phone={member.phone} isMain={member.isMain} showContacts={!member.leftAt} onOpen={onOpen}>
    {member.leftAt ? `${formatDate(member.leftAt)} তারিখে চলে গেছেন` : [member.relation, member.occupation, member.phone].filter(Boolean).join(" · ")}
  </PersonRow>
);

// ফ্ল্যাটের সবাই — প্রধান ওপরে, যাঁরা চলে গেছেন নিচে আলাদা
const MembersPanel = ({ tenancy }) => {
  const [openId, setOpenId] = useState(null);
  const [formMember, setFormMember] = useState(undefined);
  const [dialog, setDialog] = useState(null);

  const [memberAction, { isLoading: isActing }] = useMemberActionMutation();
  const [revealNid, { isLoading: isRevealing }] = useRevealMemberNidMutation();
  const [getDocuments] = useGetMemberDocumentsMutation();
  const [revealTenantNid, { isLoading: isRevealingTenant }] = useRevealNidMutation();
  const [getTenantDocuments] = useGetDocumentLinksMutation();
  const [isTenantOpen, setIsTenantOpen] = useState(false);

  const { tenant } = tenancy;

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
        <PersonRow name={tenancy.tenantName} phone={tenancy.tenantPhone} isMain showContacts onOpen={() => setIsTenantOpen(true)}>
          মূল ভাড়াটিয়া · {tenancy.tenantPhone}
        </PersonRow>
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

      {isTenantOpen && (
        <PersonDetailsModal
          person={tenant}
          isMain
          hasImages={(tenant.documents?.length || 0) > 0 || Boolean(tenant.photo)}
          isRevealing={isRevealingTenant}
          onReveal={() => revealTenantNid(tenant._id).unwrap()}
          loadImages={() => getTenantDocuments(tenant._id).unwrap()}
          onClose={() => setIsTenantOpen(false)}
        />
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
