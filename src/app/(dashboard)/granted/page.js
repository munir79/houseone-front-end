"use client";

import { Suspense } from "react";
import AccessInviteList from "@/components/access/AccessInviteList";
import AssetListPage from "@/components/property/AssetListPage";
import { levelLabel } from "@/lib/accessOptions";

// আমাকে দেওয়া সম্পদ — পরিবারের কেউ অ্যাক্সেস দিয়েছেন; কার, কোন অনুমতিতে
const cardNote = (house) => (
  <span data-granted-house={house.name} className="mt-1 block text-xs font-semibold text-info-foreground">
    {house.myAccess ? levelLabel(house.myAccess.level) : ""}
  </span>
);

const GrantedAssetsPage = () => (
  <Suspense>
    <AssetListPage
      scope="granted"
      title="আমাকে দেওয়া সম্পদ"
      description="পরিবারের কেউ আপনাকে দেখতে বা কাজে সাহায্য করতে দিয়েছেন"
      emptyTitle="কোনো সম্পদ দেওয়া হয়নি"
      emptyText="কেউ আপনাকে অ্যাক্সেস দিলে এখানে দেখাবে।"
      top={<AccessInviteList />}
      cardNote={cardNote}
      canAdd={false}
    />
  </Suspense>
);

export default GrantedAssetsPage;
