"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import PropertyWorkspace from "@/components/property/PropertyWorkspace";

// সম্পদের ভেতরে — billing
const Page = () => {
  const { id } = useParams();
  return (
    <Suspense>
      <PropertyWorkspace id={id} section="billing" />
    </Suspense>
  );
};

export default Page;
