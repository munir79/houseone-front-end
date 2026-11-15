"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import BillBoard from "@/components/bill/BillBoard";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import { useGetPropertiesQuery } from "@/redux/features/property/propertyApi";

const BillingContent = () => {
  const searchParams = useSearchParams();
  const [propertyId, setPropertyId] = useState("");
  const { data } = useGetPropertiesQuery({ page: 1, search: "", limit: 100 });

  const options = [{ value: "", label: "All houses" }, ...(data?.data?.data || []).map(({ _id, name }) => ({ value: _id, label: name }))];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Billing"
        description="মাসের বিল, আর কে দিয়েছেন কে দেননি"
        action={<Select id="billHouse" compact aria-label="Filter by house" options={options} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full sm:w-52" />}
      />
      <BillBoard key={propertyId} propertyId={propertyId || undefined} initialMonth={searchParams.get("month") || undefined} />
    </div>
  );
};

// ?month= পড়তে Suspense লাগে — নইলে পুরো পেজ Server এ আগে তৈরি হতে পারে না
const BillingPage = () => (
  <Suspense>
    <BillingContent />
  </Suspense>
);

export default BillingPage;
