"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { uploadImage } from "@/lib/uploadImage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// একটি ছবির ঘর — Private ছবির লিংক নেই, তাই আপলোডের পরে ফোনের কপিটাই দেখায়
const ImageSlot = ({ id, label, value, error, getSignature, onChange }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

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
      const uploaded = await uploadImage(file, await getSignature());
      setPreview(URL.createObjectURL(file));
      onChange(uploaded);
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange(null);
  };

  return (
    <div data-image-slot={id} className="flex min-w-0 flex-col gap-1">
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} onChange={handleFile} aria-label={label} className="hidden" />
      <div
        className={cn(
          "relative flex h-32 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border bg-background text-center",
          error ? "border-danger" : value ? "border-border" : "border-dashed border-border"
        )}
      >
        {value ? (
          <>
            {preview ? (
              // ফোনের নিজের ছবি, Blob লিংক
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={label} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 px-2 text-sm text-foreground">
                <CheckCircle2 className="h-6 w-6 text-muted" aria-hidden="true" />
                ছবি দেওয়া আছে
              </span>
            )}
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`${label} মুছুন`}
              className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-md bg-surface text-muted shadow-card"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-sm text-muted"
          >
            <Camera className="h-6 w-6" aria-hidden="true" />
            {isUploading ? "আপলোড হচ্ছে..." : "ছবি দিন"}
          </button>
        )}
      </div>
      <p className="text-sm font-medium">{label}</p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
};

export default ImageSlot;
