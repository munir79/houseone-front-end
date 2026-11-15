"use client";

import { useState } from "react";
import { toast } from "sonner";
import ImageSlot from "@/components/tenantForm/ImageSlot";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { PAYMENT_METHODS } from "@/lib/paymentOptions";
import { toDateInput, todayInput } from "@/lib/tenancyOptions";
import { toEnglishNumber } from "@/lib/toBanglaNumber";
import { useCreateExpenseMutation, useCreateRecurringExpenseMutation, useUpdateExpenseMutation, useUpdateRecurringExpenseMutation } from "@/redux/features/expense/expenseApi";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";
import { useGetPropertyUnitsQuery } from "@/redux/features/unit/unitApi";

const NEW_CATEGORY = "__new__";
const MAX_PHOTOS = 3;
const DAY_OPTIONS = Array.from({ length: 28 }, (_, index) => ({ value: String(index + 1), label: `প্রতি মাসের ${index + 1} তারিখ` }));

const Choice = ({ isActive, onClick, children, name }) => (
  <button
    type="button"
    data-expense-method={name}
    aria-pressed={isActive}
    onClick={onClick}
    className={cn("min-h-11 rounded-xl border px-3 text-sm font-semibold", isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-primary-soft")}
  >
    {children}
  </button>
);

// খরচ যোগ বা বদলানো — isMonthly হলে প্রতি মাসের নিয়মিত খরচ (তারিখের বদলে মাসের দিন, ছবি নেই)
// item — বদলানোর সময় আগের খরচ, fixedPropertyId — বাড়ির পেজ থেকে খুললে বাড়ি ঠিক করা
const ExpenseFormModal = ({ item, isMonthly = false, properties, categories, fixedPropertyId, onClose }) => {
  const isEdit = Boolean(item);
  const [values, setValues] = useState({
    propertyId: item?.property ?? fixedPropertyId ?? "",
    unitId: item?.unit ?? "",
    category: item?.category ?? categories[0],
    newCategory: "",
    amount: item ? String(item.amount) : "",
    paidAt: item?.paidAt ? toDateInput(item.paidAt) : todayInput(),
    dayOfMonth: String(item?.dayOfMonth ?? 1),
    method: item?.method ?? "Cash",
    paidTo: item?.paidTo ?? "",
    note: item?.note ?? "",
  });
  const [photos, setPhotos] = useState(() => Array.from({ length: MAX_PHOTOS }, (_, index) => item?.photos?.[index] ?? null));
  const [errors, setErrors] = useState({});

  const { data: unitsData } = useGetPropertyUnitsQuery(values.propertyId, { skip: !values.propertyId });
  const [getSignature] = useGetUploadSignatureMutation();
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [createRecurring, { isLoading: isCreatingMonthly }] = useCreateRecurringExpenseMutation();
  const [updateRecurring, { isLoading: isUpdatingMonthly }] = useUpdateRecurringExpenseMutation();

  const signature = async () => (await getSignature("expenses").unwrap()).data;
  const change = (field) => (event) => {
    // বাংলা কিবোর্ডের ১৫০০ ও চলে — number ঘর বাংলা সংখ্যা নেয় না, তাই সাধারণ ঘর
    const value = field === "amount" ? toEnglishNumber(event.target.value).replace(/\D/g, "") : event.target.value;
    setValues((prev) => ({ ...prev, [field]: value, ...(field === "propertyId" ? { unitId: "" } : {}) }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const houseOptions = [{ value: "", label: "সব বাড়ি (সাধারণ খরচ)" }, ...properties.map(({ _id, name }) => ({ value: _id, label: name }))];
  const unitOptions = [{ value: "", label: "পুরো বাড়ি" }, ...(unitsData?.data || []).map(({ _id, name }) => ({ value: _id, label: name }))];
  const categoryOptions = [...categories.map((category) => ({ value: category, label: category })), { value: NEW_CATEGORY, label: "+ নতুন ধরন লিখুন" }];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const category = values.category === NEW_CATEGORY ? values.newCategory.trim() : values.category;
    const next = {};
    if (!category) next.newCategory = "ধরনের নাম লিখুন";
    if (!(Number(values.amount) >= 1)) next.amount = "টাকা লিখুন";
    if (!isMonthly && !values.paidAt) next.paidAt = "তারিখ দিন";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body = {
      propertyId: values.propertyId || undefined,
      unitId: values.unitId || undefined,
      category,
      amount: Number(values.amount),
      method: values.method,
      paidTo: values.paidTo,
      note: values.note,
      ...(isMonthly ? { dayOfMonth: Number(values.dayOfMonth) } : { paidAt: values.paidAt, photos: photos.filter(Boolean) }),
    };

    try {
      if (isMonthly) await (isEdit ? updateRecurring({ id: item._id, ...body }) : createRecurring(body)).unwrap();
      else await (isEdit ? updateExpense({ id: item._id, ...body }) : createExpense(body)).unwrap();
      toast.success(isEdit ? "খরচ সেভ হয়েছে" : isMonthly ? "প্রতি মাসের খরচ যোগ হয়েছে" : "খরচ যোগ হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const title = isMonthly ? (isEdit ? "Edit Monthly Expense" : "Add Monthly Expense") : isEdit ? "Edit Expense" : "Add Expense";

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <form data-expense-form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {isMonthly && <p className="text-sm text-muted">প্রতি মাসের ১ তারিখ থেকে এই খরচ &quot;দিতে হবে&quot; হিসেবে আসবে। দিলে শুধু &quot;Paid&quot; চাপবেন।</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          {!fixedPropertyId && <Select id="expenseHouse" label="কোন বাড়ি" options={houseOptions} value={values.propertyId} onChange={change("propertyId")} />}
          {values.propertyId && <Select id="expenseUnit" label="কোন ফ্ল্যাট (ঐচ্ছিক)" options={unitOptions} value={values.unitId} onChange={change("unitId")} />}
          <Select id="expenseCategory" label="ধরন" options={categoryOptions} value={values.category} onChange={change("category")} />
          {values.category === NEW_CATEGORY && <Input id="expenseNewCategory" label="নতুন ধরনের নাম" maxLength={40} value={values.newCategory} onChange={change("newCategory")} error={errors.newCategory} />}
          <Input id="expenseAmount" inputMode="numeric" label="টাকা (৳)" value={values.amount} onChange={change("amount")} error={errors.amount} />
          {isMonthly ? (
            <Select id="expenseDay" label="কবে দিতে হয়" options={DAY_OPTIONS} value={values.dayOfMonth} onChange={change("dayOfMonth")} />
          ) : (
            <Input id="expenseDate" type="date" label="তারিখ" value={values.paidAt} onChange={change("paidAt")} error={errors.paidAt} />
          )}
          <Input id="expensePaidTo" label="কাকে দিলেন (ঐচ্ছিক)" placeholder="যেমন: মিস্ত্রি রহিম" value={values.paidTo} onChange={change("paidTo")} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">কীভাবে দিলেন</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map(({ value, label }) => (
              <Choice key={value} name={value} isActive={values.method === value} onClick={() => setValues((prev) => ({ ...prev, method: value }))}>
                {label}
              </Choice>
            ))}
          </div>
        </div>

        <Input id="expenseNote" label="নোট (ঐচ্ছিক)" value={values.note} onChange={change("note")} />

        {!isMonthly && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">ভাউচার বা রসিদের ছবি (ঐচ্ছিক)</p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <ImageSlot
                  key={index}
                  id={`expensePhoto${index}`}
                  label={`ছবি ${index + 1}`}
                  value={photo}
                  getSignature={signature}
                  onChange={(value) => setPhotos((prev) => prev.map((old, slot) => (slot === index ? value : old)))}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating || isUpdating || isCreatingMonthly || isUpdatingMonthly}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseFormModal;
