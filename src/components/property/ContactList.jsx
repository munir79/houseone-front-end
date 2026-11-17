"use client";

import { useState } from "react";
import { Pencil, Phone, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import ContactFormModal from "./ContactFormModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useDeleteContactMutation, useGetContactsQuery } from "@/redux/features/property/propertyApi";

const ContactList = ({ propertyId }) => {
  const [formContact, setFormContact] = useState(undefined); // undefined বন্ধ, null নতুন, Object Edit
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useGetContactsQuery(propertyId);
  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();

  const contacts = data?.data || [];

  const handleDelete = async () => {
    try {
      const response = await deleteContact({ propertyId, contactId: deleting._id }).unwrap();
      toast.success(response.message);
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "নম্বর মোছা যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Repair and emergency numbers</h2>
          <p className="text-sm text-muted">নম্বরে চাপলেই ফোন হবে</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFormContact(null)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState icon={Wrench} title="No numbers yet" description="প্লাম্বার, ইলেকট্রিশিয়ান ও দারোয়ানের নম্বর এখানে রাখুন, দরকারের সময় খুঁজতে হবে না।" />
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {contacts.map((contact) => (
            <li key={contact._id} className="flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium wrap-break-word">{contact.name}</p>
                  <Badge>{contact.category}</Badge>
                </div>
                {contact.note && <p className="mt-0.5 text-xs wrap-break-word text-muted">{contact.note}</p>}
                <a href={`tel:${contact.phone}`} className="mt-0.5 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-primary">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {contact.phone}
                </a>
              </div>

              <button
                type="button"
                onClick={() => setFormContact(contact)}
                aria-label={`Edit ${contact.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(contact)}
                aria-label={`Delete ${contact.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger-foreground"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {formContact !== undefined && (
        <ContactFormModal propertyId={propertyId} contact={formContact} onClose={() => setFormContact(undefined)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete contact?"
          message={`${deleting.name} এর নম্বর এই বাড়ির তালিকা থেকে মুছে যাবে।`}
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </Card>
  );
};

export default ContactList;
