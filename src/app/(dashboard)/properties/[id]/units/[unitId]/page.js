"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Banknote, Bath, BedDouble, DoorOpen, Layers, Pencil, Ruler, SearchX, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import TenancyDetails from "@/components/tenant/TenancyDetails";
import UnitTenantPanel from "@/components/tenant/UnitTenantPanel";
import UnitListingCard from "@/components/listing/UnitListingCard";
import UnitFormModal from "@/components/unit/UnitFormModal";
import UnitPhotosPanel from "@/components/unit/UnitPhotosPanel";
import NextTenantForm from "@/components/tenantForm/NextTenantForm";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DetailHeader from "@/components/ui/DetailHeader";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import PhotoGallery from "@/components/ui/PhotoGallery";
import Tabs from "@/components/ui/Tabs";
import Skeleton from "@/components/ui/Skeleton";
import StatStrip from "@/components/ui/StatStrip";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate } from "@/lib/tenancyOptions";
import { LIVING_LAYOUT_OPTIONS, floorName } from "@/lib/unitOptions";
import { useGetUnitTenanciesQuery } from "@/redux/features/tenancy/tenancyApi";
import { useDeleteUnitMutation, useGetUnitQuery } from "@/redux/features/unit/unitApi";

const UnitDetailsPage = () => {
  const { id, unitId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [viewedTenancyId, setViewedTenancyId] = useState(null);
  const [vacantTab, setVacantTab] = useState("tenant");
  // To-Let Marketplace এর "ফর্ম পাঠান" থেকে এলে
  const autoSend = searchParams.get("sendForm") === "1";

  const { data, error, isLoading } = useGetUnitQuery(unitId);
  const { data: tenanciesData } = useGetUnitTenanciesQuery(unitId);
  const [deleteUnit, { isLoading: isDeleting }] = useDeleteUnitMutation();

  const unit = data?.data;

  const handleDelete = async () => {
    try {
      const response = await deleteUnit(unitId).unwrap();
      toast.success(response.message);
      router.replace(`/properties/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "ইউনিট মোছা যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-1/2 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !unit) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="Unit not found"
          description="এই ইউনিটটি পাওয়া যায়নি, হয়তো মুছে ফেলা হয়েছে।"
          action={<LinkButton href={`/properties/${id}`}>Back to House</LinkButton>}
        />
      </Card>
    );
  }

  const tenancies = tenanciesData?.data || [];
  const activeTenancy = tenancies.find(({ status }) => status === "Active");
  const shownTenancyId = viewedTenancyId ?? activeTenancy?._id;

  // মার্কেটের দোকানে ঘর-বারান্দা নেই — মাপ, ব্লক আর সার্ভিস চার্জ
  const isShop = unit.property?.kind === "market";
  const sizeText = unit.sizeSqft ? `${unit.sizeSqft.toLocaleString("en-IN")} sq ft` : "Not set";
  const details = isShop
    ? [
        ["Floor", floorName(unit.floor)],
        ["Block", unit.block || "—"],
        ["Shop rent", formatMoney(unit.rent)],
        ["Service charge", formatMoney(unit.serviceCharge ?? 0)],
        ["Size", sizeText],
        ["Available from", unit.availableFrom ? formatDate(unit.availableFrom) : "Not set"],
        ["Electricity meter", unit.electricityMeter || "Not set"],
      ]
    : [
    ["Floor", floorName(unit.floor)],
    ["Flat rent", formatMoney(unit.rent)],
    ["Bedrooms", unit.bedrooms ?? "Not set"],
    ["Bathrooms", unit.bathrooms ?? "Not set"],
    ["Type", unit.type],
    ["Prefer to rent to", unit.preferredTenant],
    ["Balconies", unit.balconies ?? "Not set"],
    ["Drawing & dining", LIVING_LAYOUT_OPTIONS.find(({ value }) => value === unit.livingLayout)?.label ?? "Not set"],
    ["Size", unit.sizeSqft ? `${unit.sizeSqft.toLocaleString("en-IN")} sq ft` : "Not set"],
    ["Available from", unit.availableFrom ? formatDate(unit.availableFrom) : "Not set"],
    ["Electricity meter", unit.electricityMeter || "Not set"],
    ["Gas", unit.gasInfo || "Not set"],
      ];

  const unitHeader = (
    <DetailHeader
      compact={Boolean(shownTenancyId)}
      title={unit.name}
      subtitle={`${unit.property?.name}, ${unit.property?.area}`}
      photoUrl={unit.photos?.[0]?.url}
      icon={DoorOpen}
      badge={<Badge variant={unit.status === "Vacant" ? "warning" : "success"}>{unit.status}</Badge>}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit Unit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(true)} aria-label="Delete unit">
            <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
          </Button>
        </div>
      }
    />
  );

  const unitInfo = (
    <div className="flex flex-col gap-4">
      <Card>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-sm font-medium wrap-break-word">{value}</dd>
            </div>
          ))}
        </dl>
        {unit.note && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs text-muted">Note</p>
            <p className="text-sm wrap-break-word">{unit.note}</p>
          </div>
        )}
      </Card>

      {unit.photos?.length > 0 && (
        <Card>
          <PhotoGallery photos={unit.photos} alt={unit.name} />
        </Card>
      )}

      <UnitPhotosPanel unit={unit} />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/properties/${id}`} className="-mb-2 inline-flex min-h-9 w-fit items-center gap-1 text-sm text-muted hover:text-foreground md:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {unit.property?.name}
      </Link>

      {!shownTenancyId && unitHeader}

      {shownTenancyId ? (
        <>
          {viewedTenancyId && (
            <button type="button" onClick={() => setViewedTenancyId(null)} className="-mb-2 inline-flex min-h-9 w-fit items-center gap-1 text-sm text-muted hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {activeTenancy ? "বর্তমান ভাড়াটিয়ায় ফিরুন" : "ইউনিটে ফিরুন"}
            </button>
          )}
          <TenancyDetails
            key={shownTenancyId}
            tenancyId={shownTenancyId}
            embedded
            leading={unitHeader}
            initialTab={searchParams.get("tab") || "overview"}
            afterNotice={
              activeTenancy && shownTenancyId === activeTenancy._id ? (
                <div className="flex flex-col gap-3">
                  <NextTenantForm unit={unit} autoSend={autoSend} />
                  <UnitListingCard unit={unit} />
                </div>
              ) : null
            }
            onMovedOut={setViewedTenancyId}
            extraTabs={[
              { value: "unit", label: "Unit Details", content: unitInfo },
            ]}
          />
        </>
      ) : (
        <>
          <StatStrip
            items={[
              { key: "rent", label: "Monthly rent", value: formatMoney(unit.rent), icon: Banknote },
              { key: "floor", label: "Floor", value: floorName(unit.floor), icon: Layers, tone: "violet" },
              ...(isShop
                ? [
                    { key: "service", label: "Service charge", value: formatMoney(unit.serviceCharge ?? 0), icon: Wrench, tone: "blue" },
                    { key: "size", label: "Size", value: unit.sizeSqft ? `${unit.sizeSqft.toLocaleString("en-IN")} sq ft` : "—", icon: Ruler, tone: "amber" },
                  ]
                : [
                    { key: "bedrooms", label: "Bedrooms", value: unit.bedrooms ?? "—", icon: BedDouble, tone: "blue" },
                    { key: "bathrooms", label: "Bathrooms", value: unit.bathrooms ?? "—", icon: Bath, tone: "amber" },
                  ]),
            ]}
          />
          <div className="flex flex-col gap-4">
            <Tabs
              label="Unit sections"
              active={vacantTab}
              onChange={setVacantTab}
              tabs={[
                { value: "tenant", label: "Tenant" },
                { value: "unit", label: "Unit Details" },
              ]}
            />
            {vacantTab === "tenant" && (
              <>
                <UnitListingCard unit={unit} />
                <UnitTenantPanel unit={unit} onOpen={setViewedTenancyId} autoSend={autoSend} />
              </>
            )}
            {vacantTab === "unit" && unitInfo}
          </div>
        </>
      )}

      {isEditing && (
        <UnitFormModal
          propertyId={id}
          totalFloors={unit.property?.totalFloors ?? unit.floor}
          isMarket={unit.property?.kind === "market"}
          basements={unit.property?.basementFloors ?? 0}
          blocks={unit.property?.blocks ?? []}
          unit={unit}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isDeleteOpen && (
        <ConfirmDialog
          title="Delete unit?"
          message={`"${unit.name}" এই বাড়ি থেকে মুছে যাবে।`}
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
};

export default UnitDetailsPage;
