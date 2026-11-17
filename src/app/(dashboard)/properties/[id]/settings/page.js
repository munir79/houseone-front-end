"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import PropertyWorkspace from "@/components/property/PropertyWorkspace";

// সম্পদের ভেতরে — settings
const Page = () => {
  const { id } = useParams();
  return (
    <Suspense>
      <PropertyWorkspace id={id} section="settings" />
    </Suspense>
  );
};

export default Page;
