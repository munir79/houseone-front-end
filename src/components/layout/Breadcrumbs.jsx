"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { isNavActive, navItems } from "@/lib/navigation";
import { useGetPropertyQuery } from "@/redux/features/property/propertyApi";
import { useGetTenancyQuery } from "@/redux/features/tenancy/tenancyApi";
import { useGetUnitQuery } from "@/redux/features/unit/unitApi";

// Page এর নিজের Query ই ব্যবহার করে, তাই আলাদা Request যায় না
const Breadcrumbs = () => {
  const pathname = usePathname();
  const { id, unitId, tenancyId } = useParams();

  const { data: property } = useGetPropertyQuery(id, { skip: !id });
  const { data: unit } = useGetUnitQuery(unitId, { skip: !unitId });
  const { data: tenancy } = useGetTenancyQuery(tenancyId, { skip: !tenancyId });

  const page = navItems.find(({ href }) => isNavActive(pathname, href));

  const crumbs = [
    { label: page?.label, href: page?.href },
    id && { label: property?.data?.name, href: `/properties/${id}` },
    unitId && { label: unit?.data?.name },
    tenancyId && { label: tenancy?.data?.tenantName },
  ].filter((crumb) => crumb?.label);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      {crumbs.map(({ label, href }, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <Fragment key={label}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />}
            {isLast ? (
              <span aria-current="page" className="truncate font-medium text-foreground">
                {label}
              </span>
            ) : (
              <Link href={href} className="truncate text-muted hover:text-foreground">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
