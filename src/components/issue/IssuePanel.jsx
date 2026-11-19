"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import Link from "next/link";
import { ChevronRight, MessageSquareWarning, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import IssueFields, { EMPTY_ISSUE } from "./IssueFields";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { ISSUE_STATUS, ISSUE_STATUS_OPTIONS, issueTypeLabel } from "@/lib/issueOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";
import { useCreateIssueMutation, useDeleteIssueMutation, useGetIssuePhotosMutation, useGetIssuesQuery, useUpdateIssueMutation } from "@/redux/features/issue/issueApi";

const ALL = "All";
const OPEN = "Open";
const DONE = "Done";

const AddIssueModal = ({ tenancyId, onClose }) => {
  const [values, setValues] = useState(EMPTY_ISSUE);
  const [error, setError] = useState("");
  const [getSignature] = useGetUploadSignatureMutation();
  const [createIssue, { isLoading }] = useCreateIssueMutation();

  const signature = async () => (await getSignature("nid").unwrap()).data;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.description.trim()) {
      setError("বিস্তারিত লিখুন");
      return;
    }

    try {
      await createIssue({ ...values, tenancyId, photos: values.photos.filter(Boolean) }).unwrap();
      toast.success("যোগ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="Add Complain or Need" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <IssueFields value={values} error={error} getSignature={signature} onChange={(next) => { setValues(next); setError(""); }} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const IssueDetailsModal = ({ issue, onClose }) => {
  const [status, setStatus] = useState(issue.status);
  const [resolution, setResolution] = useState(issue.resolution);
  const [links, setLinks] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [updateIssue, { isLoading }] = useUpdateIssueMutation();
  const [deleteIssue, { isLoading: isRemoving }] = useDeleteIssueMutation();
  const [getPhotos] = useGetIssuePhotosMutation();

  useEffect(() => {
    if (issue.photos.length === 0) return;

    getPhotos(issue._id)
      .unwrap()
      .then((response) => setLinks(response.data))
      .catch((err) => toast.error(getErrorMessage(err, "ছবি খোলা যায়নি।")));
    // Modal খুললে একবারই
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      await updateIssue({ id: issue._id, status, resolution }).unwrap();
      toast.success("সেভ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIssue(issue._id).unwrap();
      toast.success("মুছে গেছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "মোছা যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <>
      <Modal title={`${issueTypeLabel(issue.type)} · ${issue.category}`} onClose={onClose} size="lg">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted">
              {formatDate(issue.createdAt)} · {issue.reportedBy === "Tenant" ? "ভাড়াটিয়া জানিয়েছেন" : "আপনি লিখেছেন"} · {issue.unitName}
            </p>
            <p className="mt-1 text-sm wrap-break-word whitespace-pre-line">{issue.description}</p>
          </div>

          {links.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {links.map(({ publicId, url }, index) => (
                <a key={publicId} href={url} target="_blank" rel="noreferrer">
                  {/* Private ছবির স্বাক্ষরিত লিংক, CDN এর ভেতর দিয়ে যায় না */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${index + 1}`} className="h-28 w-full rounded-lg border border-border object-cover" />
                </a>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <Select id="issueStatus" label="Status" options={ISSUE_STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
            <Input id="issueResolution" label="কী করা হলো (ঐচ্ছিক)" placeholder="যেমন: মিস্ত্রি ঠিক করেছে" value={resolution} onChange={(e) => setResolution(e.target.value)} />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            <Button variant="ghost" onClick={() => setIsDeleting(true)} className="mr-auto text-danger">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
            <Button isLoading={isLoading} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {isDeleting && (
        <ConfirmDialog title="Delete this?" message="এটি পুরোপুরি মুছে যাবে।" confirmLabel="Delete" isLoading={isRemoving} onConfirm={handleDelete} onClose={() => setIsDeleting(false)} />
      )}
    </>
  );
};

// tenancyId দিলে এক ভাড়াটিয়ার, না দিলে সব বাড়ির খোলা তালিকা
const IssuePanel = ({ tenancyId, canAdd = true }) => {
  const [filter, setFilter] = useState(tenancyId ? ALL : OPEN);
  const [isAdding, setIsAdding] = useState(false);
  const [openId, setOpenId] = useState(null);

  const { world } = useWorkspace();
  const { data, isLoading } = useGetIssuesQuery(tenancyId ? { tenancyId } : { open: "true", world });

  const issues = useMemo(() => data?.data || [], [data]);
  const shown = useMemo(() => issues.filter(({ status }) => filter === ALL || (filter === DONE ? status === "Done" : status !== "Done")), [issues, filter]);
  const openIssue = issues.find(({ _id }) => _id === openId);

  return (
    <Card flush className="overflow-hidden">
      {tenancyId && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
          <SegmentedControl label="Filter" options={[ALL, OPEN, DONE]} value={filter} onChange={setFilter} />
          {canAdd && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="p-4">
          <Skeleton className="h-14 w-full" />
        </div>
      ) : shown.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="Nothing here" description="এখন কোনো অভিযোগ বা প্রয়োজন নেই।" />
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((issue) => {
            const status = ISSUE_STATUS[issue.status];
            return (
              <li key={issue._id} data-issue-row className="flex items-center gap-2 pr-2 hover:bg-background">
                <button type="button" onClick={() => setOpenId(issue._id)} className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2.5 text-left">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold wrap-break-word">
                      {issueTypeLabel(issue.type)} · {issue.category}
                    </span>
                    <span className="block truncate text-sm text-muted">{issue.description}</span>
                    <span className="block text-xs text-muted">
                      {formatDate(issue.createdAt)}
                      {!tenancyId && ` · ${issue.unitName}, ${issue.propertyName}`}
                      {issue.reportedBy === "Tenant" && " · ভাড়াটিয়া জানিয়েছেন"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {tenancyId && <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />}
                  </span>
                </button>
                {!tenancyId && (
                  <Link href={`/properties/${issue.property}/units/${issue.unit}?tab=issues`} aria-label={`Open ${issue.unitName}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft">
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isAdding && <AddIssueModal tenancyId={tenancyId} onClose={() => setIsAdding(false)} />}
      {openIssue && <IssueDetailsModal key={openIssue._id} issue={openIssue} onClose={() => setOpenId(null)} />}
    </Card>
  );
};

export default IssuePanel;
