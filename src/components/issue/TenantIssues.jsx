"use client";

import { useRef, useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import IssueFields, { EMPTY_ISSUE } from "./IssueFields";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { ISSUE_STATUS, issueTypeLabel } from "@/lib/issueOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { useCreatePublicIssueMutation, useGetPublicIssuesQuery } from "@/redux/features/issue/issueApi";
import { useGetPublicFormSignatureMutation } from "@/redux/features/tenantForm/tenantFormApi";

// লগইন ছাড়া ভাড়াটিয়া নিজের লিংক থেকে জানান — বাড়িওয়ালা সাথে সাথে Notification পান
const TenantIssues = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_ISSUE);
  const [error, setError] = useState("");
  const signatureRef = useRef(null);

  const { data } = useGetPublicIssuesQuery(token);
  const [getSignature] = useGetPublicFormSignatureMutation();
  const [createIssue, { isLoading }] = useCreatePublicIssueMutation();

  const issues = data?.data || [];

  const signature = async () => {
    if (!signatureRef.current) signatureRef.current = (await getSignature(token).unwrap()).data;
    return signatureRef.current;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.description.trim()) {
      setError("বিস্তারিত লিখুন");
      return;
    }

    try {
      await createIssue({ token, ...values, photos: values.photos.filter(Boolean) }).unwrap();
      toast.success("বাড়িওয়ালাকে জানানো হয়েছে");
      setValues(EMPTY_ISSUE);
      setIsOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "পাঠানো যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">অভিযোগ বা প্রয়োজন</h2>
        {!isOpen && (
          <Button size="sm" onClick={() => setIsOpen(true)}>
            <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
            জানান
          </Button>
        )}
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <IssueFields value={values} error={error} getSignature={signature} onChange={(next) => { setValues(next); setError(""); }} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              বাতিল
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              পাঠান
            </Button>
          </div>
        </form>
      )}

      {issues.length > 0 && (
        <ul className="flex flex-col gap-2">
          {issues.map((issue) => {
            const status = ISSUE_STATUS[issue.status];
            return (
              <li key={issue._id} data-tenant-issue className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {issueTypeLabel(issue.type)} · {issue.category}
                  </p>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="mt-1 text-sm wrap-break-word">{issue.description}</p>
                <p className="text-xs text-muted">{formatDate(issue.createdAt)}</p>
                {issue.resolution && <p className="mt-1 text-sm">বাড়িওয়ালা: {issue.resolution}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default TenantIssues;
