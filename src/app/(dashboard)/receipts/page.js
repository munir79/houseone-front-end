"use client";

import ReceiptBoard from "@/components/payment/ReceiptBoard";
import PageHeader from "@/components/ui/PageHeader";
import { useWorkspace } from "@/hooks/useWorkspace";

const ReceiptsPage = () => {
  const { houses } = useWorkspace();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Receipts" description="সব টাকা নেওয়ার রসিদ ও Advance ফেরত, এক জায়গায়" />
      <ReceiptBoard properties={houses} />
    </div>
  );
};

export default ReceiptsPage;
