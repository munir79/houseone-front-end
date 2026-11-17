"use client";

import AssetListPage from "@/components/property/AssetListPage";
import InviteList from "@/components/share/InviteList";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useGetSentInvitesQuery } from "@/redux/features/share/shareApi";

// অংশীদারি সম্পদ — মূল মালিক বা অংশীদার, দুজনের কাছেই; আমাকে পাঠানো দাওয়াত উপরে
const SharedAssetsPage = () => {
  const { data: profile } = useGetMyProfileQuery();
  const { data: sentData } = useGetSentInvitesQuery();
  const me = profile?.data?._id;
  const sent = sentData?.data || [];

  const cardNote = (house) => {
    const isMain = house.owner === me;
    const pending = sent.filter(({ property }) => property === house._id);
    return (
      <span data-shared-house={house.name} className="mt-1 flex flex-col gap-0.5 text-xs">
        <span className="font-semibold text-info-foreground">{isMain ? "আপনি মূল মালিক" : "আপনি অংশীদার"}</span>
        {pending.map((invite) => (
          <span key={invite._id} data-sent-invite={invite.email} className="truncate text-muted">
            দাওয়াত অপেক্ষায়: {invite.email}
          </span>
        ))}
      </span>
    );
  };

  return (
    <AssetListPage
      scope="shared"
      title="অংশীদারি সম্পদ"
      description="কয়েকজন মিলে মালিক এমন বাড়ি ও ফ্ল্যাট — দাওয়াত, ভাগ ও দেনা-পাওনা ভেতরের অংশীদারি পাতায়"
      emptyTitle="No shared assets yet"
      emptyText="অংশীদারি সম্পদ যোগ করুন, তারপর অংশীদারদের দাওয়াত দিন। আগের কোনো সম্পদে অংশীদার যোগ করলে সেটাও এখানে আসবে।"
      top={<InviteList />}
      cardNote={cardNote}
    />
  );
};

export default SharedAssetsPage;
