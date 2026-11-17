"use client";

import { useParams } from "next/navigation";
import TenancyDetails from "@/components/tenant/TenancyDetails";

const TenancyDetailsPage = () => {
  const { tenancyId } = useParams();
  return <TenancyDetails tenancyId={tenancyId} />;
};

export default TenancyDetailsPage;
