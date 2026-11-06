"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { DEFAULT_RENT_DAY, OCCUPANT_TYPE_OPTIONS, RENT_DAY_OPTIONS, todayInput } from "@/lib/tenancyOptions";
import { useCreateTenancyMutation, useSearchTenantsQuery } from "@/redux/features/tenancy/tenancyApi";

const NEW_TENANT = "New tenant";
const EXISTING_TENANT = "Existing tenant";
const SEARCH_DEBOUNCE_MS = 300;

const AddTenantModal = ({ unit, onClose }) => {
  const router = useRouter();
  const [mode, setMode] = useState(NEW_TENANT);
  const [person, setPerson] = useState({ name: "", phone: "", nid: "", occupation: "", permanentAddress: "", emergencyName: "", emergencyPhone: "" });
  const [tenancy, setTenancy] = useState({
    occupantType: "Family",
    startDate: todayInput(),
    rent: unit.rent === null || unit.rent === undefined ? "" : String(unit.rent),
    advance: "",
    dueDay: DEFAULT_RENT_DAY,
  });
  const [picked, setPicked] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data: found, isFetching } = useSearchTenantsQuery(search, { skip: mode !== EXISTING_TENANT || search.length < 2 });
  const [createTenancy, { isLoading }] = useCreateTenancyMutation();

  const matches = found?.data?.data || [];

  // লেখা শুরু করলেই সেই ঘরের Error চলে যায়
  const clearError = (field) => setErrors(({ [field]: removed, ...rest }) => rest);

  const changePerson = (field) => (e) => {
    setPerson((prev) => ({ ...prev, [field]: e.target.value }));
    clearError(field);
  };

  const changeTenancy = (field) => (e) => {
    setTenancy((prev) => ({ ...prev, [field]: e.target.value }));
    clearError(field);
  };

  const validate = () => {
    const newErrors = {};
    if (mode === NEW_TENANT) {
      if (!person.name.trim()) newErrors.name = "ভাড়াটিয়ার নাম লিখুন";
      if (!person.phone.trim()) newErrors.phone = "মোবাইল নম্বর লিখুন";
    } else if (!picked) {
      newErrors.picked = "তালিকা থেকে একজন ভাড়াটিয়া বেছে নিন";
    }
    if (!tenancy.startDate) newErrors.startDate = "ওঠার তারিখ দিন";
    if (tenancy.rent === "") newErrors.rent = "মাসিক ভাড়া লিখুন";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const body = { ...tenancy, unitId: unit._id, dueDay: Number(tenancy.dueDay) };
    if (mode === NEW_TENANT) {
      const { nid, ...rest } = person;
      body.tenant = nid.trim() ? person : rest;
    } else {
      body.tenantId = picked._id;
    }

    try {
      const response = await createTenancy(body).unwrap();
      toast.success(response.message);
      router.push(`/tenants/${response.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "ভাড়াটিয়া যোগ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={`Add Tenant to ${unit.name}`} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormSection title="Tenant">
          <SegmentedControl label="Tenant source" options={[NEW_TENANT, EXISTING_TENANT]} value={mode} onChange={setMode} />

          {mode === NEW_TENANT ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="tenantName" label="Full name" placeholder="Rahim Uddin" value={person.name} onChange={changePerson("name")} error={errors.name} />
                <Input
                  id="tenantPhone"
                  type="tel"
                  inputMode="tel"
                  label="Mobile number"
                  placeholder="01XXXXXXXXX"
                  value={person.phone}
                  onChange={changePerson("phone")}
                  error={errors.phone}
                />
                <Input
                  id="tenantNid"
                  inputMode="numeric"
                  autoComplete="off"
                  label="NID number (optional)"
                  placeholder="১০ থেকে ১৭ সংখ্যা"
                  value={person.nid}
                  onChange={changePerson("nid")}
                />
                <Input id="tenantOccupation" label="Occupation (optional)" placeholder="চাকরি, ব্যবসা ইত্যাদি" value={person.occupation} onChange={changePerson("occupation")} />
              </div>
              <p className="text-xs text-muted">বাকি তথ্য, সদস্য আর NID-এর ছবি পরে যোগ করতে পারবেন।</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">আগে যোগ করা ভাড়াটিয়াকে বেছে নিন, তথ্য আবার লিখতে হবে না।</p>
              <Input
                id="tenantSearch"
                type="search"
                aria-label="Search tenants"
                placeholder="নাম বা মোবাইল লিখে খুঁজুন"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                suffix={<Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
                error={errors.picked}
              />
              {matches.length > 0 && (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {matches.map((tenant) => {
                    const isPicked = picked?._id === tenant._id;

                    return (
                      <li key={tenant._id}>
                        <button
                          type="button"
                          onClick={() => {
                            setPicked(tenant);
                            clearError("picked");
                          }}
                          aria-pressed={isPicked}
                          className={cn("flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-background", isPicked && "bg-primary-soft")}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium wrap-break-word">{tenant.name}</span>
                            <span className="block text-xs text-muted">{tenant.phone}</span>
                          </span>
                          {isPicked && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {search.length >= 2 && !isFetching && matches.length === 0 && <p className="text-sm text-muted">কাউকে পাওয়া যায়নি।</p>}
            </>
          )}
        </FormSection>

        <FormSection title="Rent details">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Select id="occupantType" label="Tenant type" options={OCCUPANT_TYPE_OPTIONS} value={tenancy.occupantType} onChange={changeTenancy("occupantType")} />
            <Input id="startDate" type="date" label="Move-in date" value={tenancy.startDate} onChange={changeTenancy("startDate")} error={errors.startDate} />
            <Select id="dueDay" label="Rent day" options={RENT_DAY_OPTIONS} value={tenancy.dueDay} onChange={changeTenancy("dueDay")} />
            <Input
              id="tenancyRent"
              type="number"
              inputMode="numeric"
              min="0"
              label="Monthly rent (৳)"
              placeholder="20000"
              value={tenancy.rent}
              onChange={changeTenancy("rent")}
              error={errors.rent}
            />
            <Input
              id="tenancyAdvance"
              type="number"
              inputMode="numeric"
              min="0"
              label="Advance (৳, optional)"
              placeholder="40000"
              value={tenancy.advance}
              onChange={changeTenancy("advance")}
            />
          </div>
          <p className="text-xs text-muted">ভাড়ার তারিখ নিজে থেকেই মাসের ১০ তারিখ থাকে। কারও আলাদা হলে শুধু তাঁর জন্য বদলে দিন।</p>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Add Tenant
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTenantModal;
