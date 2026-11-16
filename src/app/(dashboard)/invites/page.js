"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import InviteList from "@/components/share/InviteList";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { bdDateInput } from "@/lib/bdTime";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";
import { useGetSentInvitesQuery, useInviteOwnerMutation } from "@/redux/features/share/shareApi";

// দাওয়াত পাঠানো — শুধু যে বাড়ির আমি মূল মালিক
const AddPartnerModal = ({ houses, initialHouse, onClose }) => {
  const [propertyId, setPropertyId] = useState(initialHouse ?? houses[0]?._id ?? "");
  const [email, setEmail] = useState("");
  const [inviteOwner, { isLoading }] = useInviteOwnerMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!propertyId || !email.trim()) return;
    try {
      await inviteOwner({ propertyId, email: email.trim() }).unwrap();
      toast.success("দাওয়াত পাঠানো হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "দাওয়াত পাঠানো যায়নি"));
    }
  };

  return (
    <Modal title="Add Partner" onClose={onClose}>
      <form data-add-partner onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">অংশীদার Accept করলে বাড়িটি দেখবেন ও দৈনন্দিন কাজ করতে পারবেন। ভাগ পরে বাড়ির Sharing tab থেকে ঠিক করবেন।</p>
        <Select id="partnerHouse" label="কোন বাড়িতে" options={houses.map(({ _id, name }) => ({ value: _id, label: name }))} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
        <Input id="partnerEmail" type="email" label="অংশীদারের ইমেইল" placeholder="partner@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!email.trim()}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            দাওয়াত পাঠান
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ভাগ ঠিক করা আছে কি না — এই মাসে চালু ভাগ
const hasShares = (house) => (house.shares ?? []).some(({ from }) => from <= bdDateInput().slice(0, 7));

// Shared Access — আমার কাছে আসা দাওয়াত, আর সব বাড়ির মালিক ও খোলা দাওয়াত
const SharedAccessPage = () => {
  const [adding, setAdding] = useState(null);
  const { data: profile } = useGetMyProfileQuery();
  const { data, isLoading } = useGetPropertiesQuery({ page: 1, search: "", limit: 100 });
  const { data: sentData } = useGetSentInvitesQuery();

  const me = profile?.data?._id;
  const houses = data?.data?.data || [];
  const mine = houses.filter(({ owner }) => owner === me);
  const sent = sentData?.data || [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Shared Access"
        description="অংশীদারদের সাথে বাড়ি চালানো — দাওয়াত, ভাগ ও দেনা-পাওনা"
        action={
          mine.length > 0 && (
            <Button onClick={() => setAdding({})}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              অংশীদার যোগ করুন
            </Button>
          )
        }
      />
      <InviteList />

      <Card flush className="overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-base font-bold">আমার বাড়ি</h2>
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ) : houses.length === 0 ? (
          <EmptyState icon={UserPlus} title="No houses yet" description="বাড়ি যোগ করার পরে এখান থেকে অংশীদার যোগ করতে পারবেন।" />
        ) : (
          <ul className="divide-y divide-border">
            {houses.map((house) => {
              const isMain = house.owner === me;
              const owners = house.owners?.length ?? 1;
              const pending = sent.filter(({ property }) => property === house._id);
              return (
                <li key={house._id} data-shared-house={house.name} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <Link href={`/properties/${house._id}?tab=sharing`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        <span className="wrap-break-word">{house.name}</span>
                        <Badge variant={isMain ? "success" : "info"}>{isMain ? "আপনি মূল মালিক" : "আপনি অংশীদার"}</Badge>
                      </span>
                      <span className="block text-xs text-muted">
                        {house.area}, {house.city} · {owners > 1 ? `${toBanglaNumber(owners)} জন মালিক · ${hasShares(house) ? "ভাগ ঠিক করা আছে" : "ভাগ ঠিক করা হয়নি"}` : "একা মালিক"}
                      </span>
                      {pending.map((invite) => (
                        <span key={invite._id} data-sent-invite={invite.email} className="block text-xs text-info-foreground">
                          দাওয়াত পাঠানো হয়েছে: {invite.email}
                        </span>
                      ))}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted sm:hidden" aria-hidden="true" />
                  </Link>
                  {isMain && (
                    <Button variant="outline" size="sm" onClick={() => setAdding({ house: house._id })} aria-label={`Add partner to ${house.name}`} className="sm:shrink-0">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      অংশীদার যোগ করুন
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {adding && <AddPartnerModal houses={mine} initialHouse={adding.house} onClose={() => setAdding(null)} />}
    </div>
  );
};

export default SharedAccessPage;
