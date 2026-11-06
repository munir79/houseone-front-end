"use client";

import { Building2 } from "lucide-react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";

const DashboardPage = () => {
  const { data } = useGetMyProfileQuery();
  const firstName = data?.data?.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          Welcome back, <span className="text-primary">{firstName}</span>!
        </h1>
        <p className="mt-1 text-sm text-muted">Here is what is happening with your properties today.</p>
      </div>

      <Card>
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Your houses, flats and rent summary will show here."
          action={<LinkButton href="/properties">Go to Properties</LinkButton>}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
