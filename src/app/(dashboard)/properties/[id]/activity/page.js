"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import PropertyWorkspace from "@/components/property/PropertyWorkspace";

// সম্পদের ভেতরে — activity
const Page = () => {
  const { id } = useParams();
  return (
    <Suspense>
      <PropertyWorkspace id={id} section="activity" />
    </Suspense>
  );
};

export default Page;
