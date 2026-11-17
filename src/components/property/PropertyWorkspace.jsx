"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Handshake, Image as ImageIcon, Layers, MapPin, Pencil, ReceiptText, SearchX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AddAssetModal from "./AddAssetModal";
import ContactList from "./ContactList";
import PropertyOverview from "./PropertyOverview";
import PropertyFormModal from "./PropertyFormModal";
import BillBoard from "@/components/bill/BillBoard";
import ExpenseBoard from "@/components/expense/ExpenseBoard";
import ListingsBoard from "@/components/listing/ListingsBoard";
import ReceiptBoard from "@/components/payment/ReceiptBoard";
import ReportBoard from "@/components/report/ReportBoard";
import AccessBoard from "@/components/access/AccessBoard";
import SharingPanel from "@/components/share/SharingPanel";
import TenantsBoard from "@/components/tenant/TenantsBoard";
import ChargesPanel from "@/components/tenantForm/ChargesPanel";
import FormSettingsPanel from "@/components/tenantForm/FormSettingsPanel";
import UnitList from "@/components/unit/UnitList";
import ActionMenu from "@/components/ui/ActionMenu";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DetailHeader from "@/components/ui/DetailHeader";
import EmptyState from "@/components/ui/EmptyState";
import LinkButton from "@/components/ui/LinkButton";
import PhotoGallery from "@/components/ui/PhotoGallery";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { levelLabel } from "@/lib/accessOptions";
import { isSharedProperty, propertyPath } from "@/lib/navigation";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useDeletePropertyMutation, useGetPropertyQuery } from "@/redux/features/property/propertyApi";

// আগের ?tab= link — নতুন পাতায়
const OLD_TABS = {
  units: "units",
  rent: "billing",
  expenses: "expenses",
  sharing: "sharing",
  photos: "settings?view=photos",
  contacts: "settings?view=contacts",
  charges: "settings?view=charges",
  form: "settings?view=form",
  details: "settings",
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm wrap-break-word">{value}</dd>
    </div>
  </div>
);

// এক পাতায় কয়েকটা ভাগ — বিল ও রসিদ, সম্পদের সেটিং
const useSubTabs = ({ label, tabs, fallback }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = tabs.some(({ value }) => value === searchParams.get("view")) ? searchParams.get("view") : fallback;
  const change = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === fallback) params.delete("view");
    else params.set("view", value);
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };
  return { active, tabs: <Tabs label={label} active={active} onChange={change} tabs={tabs} /> };
};

const BillingSection = ({ id }) => {
  const { active, tabs } = useSubTabs({ label: "Billing sections", fallback: "bills", tabs: [{ value: "bills", label: "বিল" }, { value: "receipts", label: "রসিদ" }] });
  return (
    <div className="flex flex-col gap-4">
      {tabs}
      {active === "bills" ? <BillBoard propertyId={id} /> : <ReceiptBoard propertyId={id} />}
    </div>
  );
};

const SettingsSection = ({ property, onEdit }) => {
  const { active, tabs } = useSubTabs({
    label: "Property settings",
    fallback: "details",
    tabs: [
      { value: "details", label: "তথ্য" },
      { value: "photos", label: "ছবি", count: property.photos?.length || 0 },
      { value: "contacts", label: "জরুরি নম্বর" },
      { value: "charges", label: "চার্জ" },
      { value: "form", label: "ভাড়াটিয়ার ফর্ম" },
    ],
  });
  return (
    <div className="flex flex-col gap-4">
      {tabs}
      {active === "details" && (
        <Card className="flex flex-col gap-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow icon={MapPin} label="Address" value={property.address} />
            <DetailRow icon={Layers} label="Total floors" value={property.totalFloors} />
            {property.location && <DetailRow icon={MapPin} label="Map location" value={property.location.label} />}
            {(property.receiptName || property.receiptPhone) && <DetailRow icon={ReceiptText} label="On receipts" value={[property.receiptName, property.receiptPhone].filter(Boolean).join(", ")} />}
          </dl>
          <Button variant="outline" size="sm" onClick={onEdit} className="w-fit">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            তথ্য বদলান
          </Button>
        </Card>
      )}
      {active === "photos" && (
        <Card>
          {property.photos?.length > 0 ? (
            <PhotoGallery photos={property.photos} alt={property.name} />
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="No photos yet"
              description="তথ্য বদলান থেকে বাড়ির ৫টি পর্যন্ত ছবি যোগ করুন।"
              action={
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Add Photos
                </Button>
              }
            />
          )}
        </Card>
      )}
      {active === "contacts" && <ContactList propertyId={property._id} />}
      {active === "charges" && <ChargesPanel propertyId={property._id} />}
      {active === "form" && <FormSettingsPanel propertyId={property._id} />}
    </div>
  );
};

// একটা সম্পদের ভেতরের পাতা — sidebar এর menu অনুযায়ী section
const PropertyWorkspace = ({ id, section }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  // একটাই সম্পদ — বাইরের ধাপ নেই, তাই নতুন সম্পদ এখান থেকে
  const { isSingle } = useWorkspace();

  const { data, error, isLoading } = useGetPropertyQuery(id);
  const { data: profile } = useGetMyProfileQuery();
  const [deleteProperty, { isLoading: isDeleting }] = useDeletePropertyMutation();

  // পুরোনো ?tab= link — Notification বা আগের bookmark
  const oldTab = section === "overview" ? searchParams.get("tab") : null;
  useEffect(() => {
    if (!oldTab || !OLD_TABS[oldTab]) return;
    // tab ছাড়া বাকি সব রাখা — যেমন চার্জের ?type=Bachelor
    const [target, view] = OLD_TABS[oldTab].split("?");
    const params = new URLSearchParams(view);
    searchParams.forEach((value, key) => key !== "tab" && params.set(key, value));
    const query = params.toString();
    router.replace(`${propertyPath(id, target)}${query ? `?${query}` : ""}`);
  }, [oldTab, id, router, searchParams]);

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
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <Card>
        <EmptyState icon={SearchX} title="House not found" description="এই বাড়িটি পাওয়া যায়নি, হয়তো মুছে ফেলা হয়েছে।" action={<LinkButton href="/properties">Back to Properties</LinkButton>} />
      </Card>
    );
  }

  const isMainOwner = property.owner === profile?.data?._id;
  const isShared = isSharedProperty(property);
  // পরিবারের অ্যাক্সেসে দেখছেন — সম্পদ বদলানো, অংশীদার, অ্যাক্সেস, সেটিং নয়
  const myAccess = property.myAccess;
  const isLimitedPage = !!myAccess && ["settings", "sharing", "access"].includes(section);

  const actions = myAccess ? [] : [
    { key: "edit", label: "Edit", icon: Pencil, onClick: () => setIsEditing(true) },
    // একার সম্পদে অংশীদার পরে যোগ করা — যোগ হলে অংশীদারি সম্পদে চলে যায়
    ...(isMainOwner && !isShared ? [{ key: "partner", label: "অংশীদার যোগ করুন", icon: Handshake, onClick: () => router.push(propertyPath(id, "sharing")) }] : []),
    // বাড়ি মোছা শুধু মূল মালিকের
    ...(isMainOwner ? [{ key: "delete", label: "Delete House", icon: Trash2, onClick: () => setIsDeleteOpen(true) }] : []),
  ];

  const sharedBadge = myAccess ? (
    <Badge variant="info">{levelLabel(myAccess.level)} · অ্যাক্সেস</Badge>
  ) : isShared ? (
    <Badge variant="info">{isMainOwner ? "অংশীদারি" : "অংশীদার হিসেবে"}</Badge>
  ) : undefined;
  const menu = actions.length > 0 ? <ActionMenu items={actions} /> : null;

  return (
    <div className="flex flex-col gap-5">
      {section !== "overview" && (
      <DetailHeader
        compact
        badge={sharedBadge}
        title={property.name}
        subtitle={`${property.kind === "flats" ? "অন্যের বিল্ডিংয়ে আমার ফ্ল্যাট" : "পুরো বাড়ি"} · ${property.area}, ${property.city}`}
        photoUrl={property.photos?.[0]?.url}
        icon={Building2}
        actions={menu}
      />
      )}

      {myAccess && (
        <p data-access-banner className="rounded-xl border border-info/30 bg-info-soft px-4 py-2.5 text-sm text-info-foreground">
          {myAccess.level === "view"
            ? "আপনার এই সম্পদে শুধু দেখার অনুমতি — সব হিসাব দেখতে পারবেন, কিছু বদলানো যাবে না।"
            : "আপনার এই সম্পদে দেখা ও কাজের অনুমতি — ভাড়া, বিল, খরচ, ভাড়াটিয়ার কাজ করতে পারবেন; সম্পদের সেটিং বা ইউনিট বদলানো যাবে না।"}
        </p>
      )}

      {section === "overview" && (
        <PropertyOverview
          property={property}
          badge={sharedBadge}
          // hero তে লেখার জায়গা কম — বড় screen ছাড়া ⋮ menu
          menu={actions.length > 0 ? <ActionMenu items={actions} alwaysMenu /> : null}
          // একটাই সম্পদ — বাইরের "আমার সম্পদ" এ যাওয়ার দরকার নেই, নতুনটা এখান থেকেই
          onAddAsset={isSingle ? () => setIsAddingAsset(true) : undefined}
        />
      )}
      {section === "units" && <UnitList property={property} initialFilter={searchParams.get("filter") || "All"} />}
      {section === "tenants" && <TenantsBoard propertyId={id} />}
      {section === "billing" && <BillingSection id={id} />}
      {section === "expenses" && <ExpenseBoard properties={[property]} propertyId={id} />}
      {section === "reports" && <ReportBoard properties={[property]} initialHouse={id} />}
      {section === "listings" && <ListingsBoard propertyId={id} />}
      {isLimitedPage && (
        <Card>
          <EmptyState icon={SearchX} title="এই পাতা শুধু মালিকের" description="সম্পদের সেটিং, অংশীদার আর অ্যাক্সেস শুধু মালিক দেখেন ও বদলান।" />
        </Card>
      )}
      {!isLimitedPage && section === "sharing" && <SharingPanel propertyId={id} />}
      {!isLimitedPage && section === "settings" && <SettingsSection property={property} onEdit={() => setIsEditing(true)} />}
      {!isLimitedPage && section === "access" &&
        (isMainOwner && !isShared ? (
          <AccessBoard propertyId={id} />
        ) : (
          <Card>
            <EmptyState icon={SearchX} title="অংশীদারি সম্পদে আলাদা অ্যাক্সেস নেই" description="অংশীদারি সম্পদে অংশীদারের দাওয়াত দিয়েই login — অংশীদারি পাতা থেকে দিন।" />
          </Card>
        ))}

      {isAddingAsset && <AddAssetModal onClose={() => setIsAddingAsset(false)} onSaved={(saved) => saved?._id && router.push(propertyPath(saved._id))} />}
      {isEditing && <PropertyFormModal property={property} onClose={() => setIsEditing(false)} />}
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

export default PropertyWorkspace;
