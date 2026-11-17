"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReportBoard from "@/components/report/ReportBoard";
import PageHeader from "@/components/ui/PageHeader";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";

const ReportsContent = () => {
  const searchParams = useSearchParams();
  const { data, isLoading } = useGetPropertiesQuery({ page: 1, search: "", limit: 100 });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Reports" description="যেকোনো সময়ের আয়, খরচ ও লাভ — সব বাড়ি বা নির্দিষ্ট বাড়ি" />
      {/* বাড়ির তালিকা আসার পরে — বাড়ির পেজ থেকে এলে সেই বাড়ি বাছা থাকে */}
      {!isLoading && <ReportBoard properties={data?.data?.data || []} initialHouse={searchParams.get("house") || undefined} />}
    </div>
  );
};

// ?house= পড়তে Suspense লাগে
const ReportsPage = () => (
  <Suspense>
    <ReportsContent />
  </Suspense>
);

export default ReportsPage;
