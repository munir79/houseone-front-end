"use client";

import AssetListPage from "@/components/property/AssetListPage";

// আমার সম্পদ — শুধু একার; অংশীদারি গুলো অংশীদারি সম্পদে
const PropertiesPage = () => (
  <AssetListPage
    scope="own"
    title="আমার সম্পদ"
    description="আপনার একার বাড়ি ও ফ্ল্যাট — যেকোনোটায় ঢুকে তার সব কাজ"
    emptyTitle="No houses yet"
    emptyText="প্রথম বাড়িটি যোগ করুন। তারপর এক ক্লিকে সব ফ্ল্যাট তৈরি করতে পারবেন।"
  />
);

export default PropertiesPage;
