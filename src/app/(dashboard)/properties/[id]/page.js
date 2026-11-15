"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  BellRing,
  Building2,
  Image as ImageIcon,
  Layers,
  MapPin,
  Pencil,
  ReceiptText,
  SearchX,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ContactList from "@/components/property/ContactList";
import HouseStats from "@/components/property/HouseStats";
import PropertyFormModal from "@/components/property/PropertyFormModal";
import BillBoard from "@/components/bill/BillBoard";
import ExpenseBoard from "@/components/expense/ExpenseBoard";
import ChargesPanel from "@/components/tenantForm/ChargesPanel";
import FormSettingsPanel from "@/components/tenantForm/FormSettingsPanel";
import UnitList, { NEEDS_ACTION, RENT_PENDING } from "@/components/unit/UnitList";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ActionMenu from "@/components/ui/ActionMenu";
import DetailHeader from "@/components/ui/DetailHeader";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import PhotoGallery from "@/components/ui/PhotoGallery";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { unitActivity } from "@/lib/unitActivity";
import {
  useDeletePropertyMutation,
  useGetPropertyQuery,
} from "@/redux/features/property/propertyApi";
import { useGetPropertyUnitsQuery } from "@/redux/features/unit/unitApi";

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm wrap-break-word">{value}</dd>
    </div>
  </div>
);

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "units",
  );
  const [unitFilter, setUnitFilter] = useState({ value: "All", key: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, error, isLoading } = useGetPropertyQuery(id);
  const { data: unitsData } = useGetPropertyUnitsQuery(id);
  const [deleteProperty, { isLoading: isDeleting }] =
    useDeletePropertyMutation();

  const property = data?.data;

  const handleDelete = async () => {
    try {
      const response = await deleteProperty(id).unwrap();
      toast.success(response.message);
      router.replace("/properties");
    } catch (err) {
      setIsDeleteOpen(false);
      toast.error(getErrorMessage(err, "Could not delete the house."));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-1/2 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title="House not found"
          description="এই বাড়িটি পাওয়া যায়নি, হয়তো মুছে ফেলা হয়েছে।"
          action={
            <LinkButton href="/properties">Back to Properties</LinkButton>
          }
        />
      </Card>
    );
  }

  const actionCount = (unitsData?.data || []).filter(
    (unit) => unitActivity(unit)?.needsAction,
  ).length;
  // ⋮ মেনু বা পরামর্শ থেকে — Units tab নির্দিষ্ট ফিল্টারসহ
  const openUnits = (value) => {
    setActiveTab("units");
    setUnitFilter({ value, key: Date.now() });
  };

  const actions = [
    ...(actionCount > 0
      ? [
          {
            key: "action",
            label: `Needs Action (${actionCount})`,
            icon: BellRing,
            onClick: () => openUnits(NEEDS_ACTION),
          },
        ]
      : []),
    {
      key: "report",
      label: "Report",
      icon: BarChart3,
      onClick: () => router.push(`/reports?house=${id}`),
    },
    {
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onClick: () => setIsEditing(true),
    },
    {
      key: "delete",
      label: "Delete House",
      icon: Trash2,
      onClick: () => setIsDeleteOpen(true),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/properties"
        className="-mb-2 inline-flex min-h-9 w-fit items-center gap-1 text-sm text-muted hover:text-foreground md:hidden"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Properties
      </Link>

      <DetailHeader
        title={property.name}
        subtitle={`${property.area}, ${property.city}`}
        photoUrl={property.photos?.[0]?.url}
        icon={Building2}
        actions={<ActionMenu items={actions} />}
      />

      <HouseStats
        property={property}
        onOpenRent={() => setActiveTab("rent")}
        onOpenPending={() => openUnits(RENT_PENDING)}
      />

      <div className="flex flex-col gap-4">
        <Tabs
          label="House sections"
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: "units", label: "Units", count: property.unitCount },
            { value: "rent", label: "Rent" },
            { value: "expenses", label: "Expenses" },
            {
              value: "photos",
              label: "Photos",
              count: property.photos?.length || 0,
            },
            { value: "contacts", label: "Contacts" },
            { value: "charges", label: "Charges" },
            { value: "form", label: "Tenant Form" },
            { value: "details", label: "Details" },
          ]}
        />

        {activeTab === "units" && (
          <UnitList
            key={unitFilter.key}
            property={property}
            initialFilter={unitFilter.value}
          />
        )}
        {activeTab === "rent" && <BillBoard propertyId={id} />}
        {activeTab === "expenses" && <ExpenseBoard properties={[property]} propertyId={id} />}
        {activeTab === "photos" && (
          <Card>
            {property.photos?.length > 0 ? (
              <PhotoGallery photos={property.photos} alt={property.name} />
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="No photos yet"
                description="Edit এ গিয়ে বাড়ির ৫টি পর্যন্ত ছবি যোগ করুন।"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Add Photos
                  </Button>
                }
              />
            )}
          </Card>
        )}
        {activeTab === "contacts" && <ContactList propertyId={id} />}
        {activeTab === "charges" && <ChargesPanel propertyId={id} />}
        {activeTab === "form" && <FormSettingsPanel propertyId={id} />}
        {activeTab === "details" && (
          <Card>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                icon={MapPin}
                label="Address"
                value={property.address}
              />
              <DetailRow
                icon={Layers}
                label="Total floors"
                value={property.totalFloors}
              />
              {property.location && (
                <DetailRow
                  icon={MapPin}
                  label="Map location"
                  value={property.location.label}
                />
              )}
              {(property.receiptName || property.receiptPhone) && (
                <DetailRow
                  icon={ReceiptText}
                  label="On receipts"
                  value={[property.receiptName, property.receiptPhone]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </dl>
          </Card>
        )}
      </div>

      {isEditing && (
        <PropertyFormModal
          property={property}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isDeleteOpen && (
        <ConfirmDialog
          title="Delete house?"
          message={`"${property.name}" আপনার তালিকা থেকে মুছে যাবে।`}
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
};

export default PropertyDetailsPage;
