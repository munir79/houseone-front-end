"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useUpdateTenancyMutation } from "@/redux/features/tenancy/tenancyApi";

// সদস্য ও দেওয়া জিনিস — দুটোই একই ধরনের তালিকা
// fields: [{ key, label, placeholder, required, requiredMessage, type }]
const EditableList = ({ tenancyId, field, items, fields, addLabel, emptyIcon, emptyTitle, emptyText, renderRow, renderActions }) => {
  const [editIndex, setEditIndex] = useState(null); // null বন্ধ, -1 নতুন
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const [updateTenancy, { isLoading }] = useUpdateTenancyMutation();

  const openForm = (index) => {
    const source = index >= 0 ? items[index] : {};
    setForm(Object.fromEntries(fields.map(({ key }) => [key, source[key] || ""])));
    setErrors({});
    setEditIndex(index);
  };

  const save = async (next) => {
    await updateTenancy({ id: tenancyId, [field]: next }).unwrap();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    fields.forEach(({ key, required, requiredMessage }) => {
      if (required && !form[key].trim()) newErrors[key] = requiredMessage;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const next = editIndex >= 0 ? items.map((item, index) => (index === editIndex ? { ...item, ...form } : item)) : [...items, form];

    try {
      await save(next);
      setEditIndex(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const handleRemove = async (index) => {
    try {
      await save(items.filter((_, itemIndex) => itemIndex !== index));
    } catch (err) {
      toast.error(getErrorMessage(err, "মোছা যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Card flush className="overflow-hidden">
      <div className="flex justify-end border-b border-border p-3 sm:p-4">
        <Button variant="outline" size="sm" onClick={() => openForm(-1)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyText} />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-2 py-2 pr-2 pl-4">
              <div className="min-w-0 flex-1">{renderRow(item)}</div>
              {renderActions?.(item, index, save)}
              <button
                type="button"
                onClick={() => openForm(index)}
                aria-label={`Edit ${item.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Delete ${item.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger-foreground"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editIndex !== null && (
        <Modal title={editIndex >= 0 ? `Edit ${addLabel.replace("Add ", "")}` : addLabel} onClose={() => setEditIndex(null)}>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {fields.map(({ key, label, placeholder, type }) => (
              <Input
                key={key}
                id={`item-${key}`}
                type={type}
                label={label}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, [key]: e.target.value }));
                  setErrors(({ [key]: removed, ...rest }) => rest);
                }}
                error={errors[key]}
              />
            ))}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setEditIndex(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
};

export default EditableList;
