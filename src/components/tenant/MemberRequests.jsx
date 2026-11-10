"use client";

import { useState } from "react";
import { Check, User, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useDecideMemberRequestMutation, useGetMemberRequestsQuery } from "@/redux/features/memberRequest/memberRequestApi";

// ছবিগুলো কয়েক মিনিটের Private লিংক — চাপলে বড় করে খোলে
const Thumb = ({ url, label }) => (
  <a href={url} target="_blank" rel="noreferrer" aria-label={label} className="block h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={label} className="h-full w-full object-cover" />
  </a>
);

const RequestRow = ({ request, isBusy, onApprove, onReject }) => (
  <li data-member-request={request.name} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {request.photo ? (
        <Thumb url={request.photo.url} label={`${request.name} photo`} />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
          <User className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold wrap-break-word">{request.name}</p>
        <p className="text-xs text-muted">
          {[request.relation, request.phone, `NID ••••${request.nidLast4}`, request.occupation].filter(Boolean).join(" · ")}
        </p>
        <p className="text-xs text-muted">{formatDate(request.createdAt)} তারিখে পাঠিয়েছেন</p>
      </div>
    </div>
    {request.documents.length > 0 && (
      <div className="flex gap-2">
        {request.documents.map(({ url }, index) => (
          <Thumb key={index} url={url} label={`${request.name} NID ${index === 0 ? "front" : "back"}`} />
        ))}
      </div>
    )}
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={isBusy} onClick={onReject} className="flex-1 lg:flex-none" aria-label={`Reject ${request.name}`}>
        <X className="h-4 w-4" aria-hidden="true" />
        Reject
      </Button>
      <Button size="sm" isLoading={isBusy} onClick={onApprove} className="flex-1 lg:flex-none" aria-label={`Approve ${request.name}`}>
        <Check className="h-4 w-4" aria-hidden="true" />
        Approve
      </Button>
    </div>
  </li>
);

// লিংক থেকে আসা সদস্য — Approve না করা পর্যন্ত তালিকায় যোগ হয় না
const MemberRequests = ({ tenancy }) => {
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const { data } = useGetMemberRequestsQuery(tenancy._id);
  const [decide] = useDecideMemberRequestMutation();

  const requests = data?.data || [];
  if (requests.length === 0) return null;

  const run = async (request, action) => {
    setBusyId(request._id);
    try {
      await decide({ tenancyId: tenancy._id, requestId: request._id, action }).unwrap();
      toast.success(action === "approve" ? `${request.name} সদস্য হিসেবে যোগ হয়েছেন` : "অনুরোধ বাতিল হয়েছে");
      setRejecting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div data-member-requests className="border-b border-border bg-warning-soft/40">
      <h3 className="px-4 pt-3 text-sm font-semibold text-warning-foreground">অনুমোদনের অপেক্ষায় ({toBanglaNumber(requests.length)})</h3>
      <ul className="divide-y divide-border">
        {requests.map((request) => (
          <RequestRow key={request._id} request={request} isBusy={busyId === request._id} onApprove={() => run(request, "approve")} onReject={() => setRejecting(request)} />
        ))}
      </ul>

      {rejecting && (
        <ConfirmDialog
          title="Reject request?"
          message={`${rejecting.name}-এর পাঠানো তথ্য ও ছবি মুছে যাবে।`}
          confirmLabel="Reject"
          isLoading={busyId === rejecting._id}
          onConfirm={() => run(rejecting, "reject")}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
};

export default MemberRequests;
