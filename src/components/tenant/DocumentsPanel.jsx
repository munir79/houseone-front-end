"use client";

import { useRef, useState } from "react";
import { Eye, FileImage, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { uploadImage } from "@/lib/uploadImage";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";
import { useGetDocumentLinksMutation, useUpdateTenantMutation } from "@/redux/features/tenancy/tenancyApi";

const MAX_DOCUMENTS = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// NID এর ছবি Private — শুধু চাইলে অল্প সময়ের লিংক তৈরি হয়
const DocumentsPanel = ({ tenant }) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [links, setLinks] = useState(null);

  const [getSignature] = useGetUploadSignatureMutation();
  const [updateTenant, { isLoading: isSaving }] = useUpdateTenantMutation();
  const [getLinks, { isLoading: isOpening }] = useGetDocumentLinksMutation();

  const documents = tenant.documents || [];

  const saveDocuments = async (next) => {
    await updateTenant({ id: tenant._id, documents: next }).unwrap();
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("JPG, PNG বা WebP ছবি বেছে নিন");
      return;
    }

    setIsUploading(true);
    try {
      const { data: signature } = await getSignature("nid").unwrap();
      const uploaded = await uploadImage(file, signature);
      await saveDocuments([...documents.map(({ publicId }) => ({ publicId })), uploaded]);
      toast.success("ছবি সেভ হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (publicId) => {
    try {
      await saveDocuments(documents.filter((doc) => doc.publicId !== publicId).map((doc) => ({ publicId: doc.publicId })));
      toast.success("ছবি মুছে গেছে");
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি মোছা যায়নি।"));
    }
  };

  const handleView = async () => {
    try {
      const response = await getLinks(tenant._id).unwrap();
      setLinks(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি খোলা যায়নি।"));
    }
  };

  return (
    <Card flush className="overflow-hidden">
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} onChange={handleFile} className="hidden" />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          ছবিগুলো private, শুধু আপনি দেখতে পারবেন
        </p>
        <div className="flex gap-2">
          {(documents.length > 0 || tenant.photo) && (
            <Button variant="outline" size="sm" isLoading={isOpening} onClick={handleView}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              View
            </Button>
          )}
          {documents.length < MAX_DOCUMENTS && (
            <Button size="sm" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload
            </Button>
          )}
        </div>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileImage} title="No documents" description="NID-এর দুই পাশের ছবি আর ভাড়াটিয়ার ছবি এখানে রাখুন।" />
      ) : (
        <ul className="divide-y divide-border">
          {documents.map(({ publicId }, index) => (
            <li key={publicId} className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="flex items-center gap-2 text-sm">
                <FileImage className="h-4 w-4 text-muted" aria-hidden="true" />
                Document {index + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(publicId)}
                disabled={isSaving}
                aria-label={`Delete document ${index + 1}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger-foreground"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {links && (
        <Modal title="Documents" onClose={() => setLinks(null)} size="lg">
          <div className="flex flex-col gap-3">
            {links.map(({ publicId, url }, index) => (
              // Private ছবির স্বাক্ষরিত লিংক, CDN এর ভেতর দিয়ে যায় না
              // eslint-disable-next-line @next/next/no-img-element
              <img key={publicId} src={url} alt={`Document ${index + 1}`} className="w-full rounded-lg border border-border" />
            ))}
            <p className="text-xs text-muted">এই লিংকগুলো ৫ মিনিট পরে কাজ করবে না।</p>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default DocumentsPanel;
