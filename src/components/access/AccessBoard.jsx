"use client";

import { useState } from "react";
import { KeyRound, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AccessFormModal from "./AccessFormModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { levelLabel } from "@/lib/accessOptions";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate } from "@/lib/tenancyOptions";
import { useGetAccessGrantsQuery, useRevokeAccessMutation } from "@/redux/features/access/accessApi";

// যাঁদের অ্যাক্সেস দিয়েছি — propertyId দিলে শুধু সেই সম্পদের (সম্পদের ভেতরের অ্যাক্সেস পাতা)
const AccessBoard = ({ propertyId }) => {
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const { data, isLoading } = useGetAccessGrantsQuery(propertyId ? { propertyId } : undefined);
  const [revokeAccess, { isLoading: isRevoking }] = useRevokeAccessMutation();
  const grants = data?.data || [];

  const handleRevoke = async () => {
    try {
      await revokeAccess(removing._id).unwrap();
      toast.success(removing.status === "Pending" ? "দাওয়াত বাতিল হয়েছে" : "অ্যাক্সেস তুলে নেওয়া হয়েছে");
      setRemoving(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const addButton = (
    <Button onClick={() => setEditing({})}>
      <UserPlus className="h-4 w-4" aria-hidden="true" />
      অ্যাক্সেস দিন
    </Button>
  );

  return (
    <div data-access-board className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">ভাই, স্ত্রী, মা-বাবার মতো পরিবারের কেউ login করে আপনার সম্পদ দেখবেন — শুধু দেখা, অথবা দেখা ও কাজ। মালিকানা বা লাভের ভাগ পাবেন না, যেকোনো সময় তুলে নিতে পারবেন।</p>
        <div className="shrink-0">{addButton}</div>
      </Card>

      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : grants.length === 0 ? (
        <Card>
          <EmptyState icon={KeyRound} title="কাউকে অ্যাক্সেস দেওয়া হয়নি" description="অ্যাক্সেস দিলে তাঁদের এখানে দেখবেন।" />
        </Card>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {grants.map((grant) => (
            <li key={grant._id} data-access-grant={grant.email} className="min-w-0">
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-bold wrap-break-word">{grant.user?.name || grant.email}</p>
                    <p className="text-xs text-muted wrap-break-word">
                      {grant.relation}
                      {grant.user && ` · ${grant.email}`}
                    </p>
                  </div>
                  <Badge variant={grant.level === "work" ? "primary" : "info"}>{levelLabel(grant.level)}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {grant.properties.map((house) => (
                    <span key={house._id} className="rounded-full bg-background px-2.5 py-1 text-xs font-medium">
                      {house.name}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  {grant.status === "Pending" ? (
                    <Badge variant="warning">দাওয়াত অপেক্ষায় · {formatDate(grant.expiresAt)} পর্যন্ত</Badge>
                  ) : (
                    <Badge variant="success">চালু</Badge>
                  )}
                  <span className="ml-auto flex gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Edit access for ${grant.email}`} onClick={() => setEditing(grant)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label={`Remove access for ${grant.email}`} onClick={() => setRemoving(grant)}>
                      <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                    </Button>
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing && <AccessFormModal grant={editing._id ? editing : null} propertyId={propertyId} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDialog
          title={removing.status === "Pending" ? "দাওয়াত বাতিল?" : "অ্যাক্সেস তুলে নেবেন?"}
          message={`${removing.user?.name || removing.email} আর এই সম্পদগুলো দেখতে পারবেন না। আগে যা করেছেন তার হিসাব থেকে যাবে।`}
          confirmLabel="তুলে নিন"
          isLoading={isRevoking}
          onConfirm={handleRevoke}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  );
};

export default AccessBoard;
