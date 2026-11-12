"use client";

import ReceiptBoard from "@/components/payment/ReceiptBoard";
import PageHeader from "@/components/ui/PageHeader";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";

const ReceiptsPage = () => {
  const { data } = useGetPropertiesQuery({ page: 1, search: "" });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Receipts" description="সব টাকা নেওয়ার রসিদ ও Advance ফেরত, এক জায়গায়" />
      <ReceiptBoard properties={data?.data?.data || []} />
    </div>
  );
};

export default ReceiptsPage;
