"use client";

import AccessBoard from "@/components/access/AccessBoard";
import PageHeader from "@/components/ui/PageHeader";

// পরিবারের অ্যাক্সেস — সব সম্পদের, সব মানুষ এক জায়গায় (profile menu থেকে)
const FamilyAccessPage = () => (
  <div className="flex flex-col gap-5">
    <PageHeader title="পরিবারের অ্যাক্সেস" description="কে কোন সম্পদ দেখছেন, কোন অনুমতিতে — দেওয়া, বদলানো বা তুলে নেওয়া" />
    <AccessBoard />
  </div>
);

export default FamilyAccessPage;
