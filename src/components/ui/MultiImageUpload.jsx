"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { uploadImage } from "@/lib/uploadImage";
import { useGetUploadSignatureMutation } from "@/redux/features/location/locationApi";

const MAX_PHOTOS = 5;
const MAX_FILE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * photos এর প্রথম ছবিটাই Cover
 * onChange এ useState এর Setter দিতে হবে, কারণ আপলোডের মাঝে তালিকা বদলাতে পারে
 */
const MultiImageUpload = ({ target, photos, onChange, onBusyChange }) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [getSignature] = useGetUploadSignatureMutation();

  const remaining = MAX_PHOTOS - photos.length;

  const setBusy = (busy) => {
    setIsUploading(busy);
    onBusyChange?.(busy);
  };

  const handleFiles = async (event) => {
    const chosen = [...event.target.files];
    event.target.value = ""; // একই ছবি আবার বাছলেও কাজ করবে

    const valid = chosen.filter((file) => ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_MB * 1024 * 1024);
    if (valid.length < chosen.length) {
      toast.error(`শুধু ${toBanglaNumber(MAX_FILE_MB)} MB এর কম JPG, PNG বা WebP ছবি দেওয়া যাবে`);
    }
    if (valid.length > remaining) {
      toast.error(`সর্বোচ্চ ${toBanglaNumber(MAX_PHOTOS)}টি ছবি দেওয়া যাবে`);
    }

    const files = valid.slice(0, remaining);
    if (files.length === 0) return;

    setBusy(true);
    try {
      const { data: signature } = await getSignature(target).unwrap();
      const results = await Promise.allSettled(files.map((file) => uploadImage(file, signature)));
      const uploaded = results.filter(({ status }) => status === "fulfilled").map(({ value }) => value);

      onChange((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS));
      if (uploaded.length < files.length) {
        toast.error("কিছু ছবি আপলোড হয়নি। আবার চেষ্টা করুন।");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।"));
    } finally {
      setBusy(false);
    }
  };

  const makeCover = (publicId) => {
    onChange((prev) => [...prev.filter((photo) => photo.publicId === publicId), ...prev.filter((photo) => photo.publicId !== publicId)]);
  };

  const removePhoto = (publicId) => {
    onChange((prev) => prev.filter((photo) => photo.publicId !== publicId));
  };

  return (
    <div className="flex flex-col gap-2">
      <input ref={inputRef} type="file" multiple accept={ALLOWED_TYPES.join(",")} onChange={handleFiles} className="hidden" />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((photo, index) => (
          <div key={photo.publicId} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-primary-soft">
            {/* Cloudinary র ছবি, Preview এর জন্য সরাসরি দেখানো হয় */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />

            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(photo.publicId)}
                aria-label={`Set photo ${index + 1} as cover`}
                title="Set as cover"
                className="absolute bottom-1 left-1 flex h-8 w-8 items-center justify-center rounded-md bg-surface/90 text-foreground shadow-card hover:bg-surface"
              >
                <Star className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={() => removePhoto(photo.publicId)}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-md bg-surface/90 text-foreground shadow-card hover:bg-surface"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            aria-label="Add photos"
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted transition-colors hover:bg-background disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
            <span className="text-xs">{isUploading ? "আপলোড হচ্ছে" : "ছবি যোগ"}</span>
          </button>
        )}
      </div>

      <p className="text-xs text-muted">
        সর্বোচ্চ {toBanglaNumber(MAX_PHOTOS)}টি ছবি। তারা চিহ্নে চাপলে সেই ছবিটি Cover হবে, Cover ছবিই তালিকায় দেখাবে।
      </p>
    </div>
  );
};

export default MultiImageUpload;
