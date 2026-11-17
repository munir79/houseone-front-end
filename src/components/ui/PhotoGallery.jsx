"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";

const lightboxButton = "flex h-11 w-11 items-center justify-center rounded-full bg-surface/15 text-primary-foreground hover:bg-surface/25";

const PhotoGallery = ({ photos, alt }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (direction) => setOpenIndex((index) => (index + direction + photos.length) % photos.length),
    [photos.length]
  );

  const isOpen = openIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close, step]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {photos.map((photo, index) => (
          <button
            key={photo.publicId}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`View photo ${index + 1}`}
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-primary-soft"
          >
            <Image
              loader={cloudinaryLoader}
              src={photo.url}
              alt={`${alt} ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 50vw"
              className="object-cover transition-transform hover:scale-105"
            />
            {index === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Cover
              </span>
            )}
          </button>
        ))}
      </div>

      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 flex flex-col bg-sidebar/95">
          <div className="flex items-center justify-between p-3 text-primary-foreground">
            <span className="text-sm tabular-nums">
              {openIndex + 1} / {photos.length}
            </span>
            <button type="button" onClick={close} aria-label="Close viewer" className={lightboxButton}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <Image
              key={photos[openIndex].publicId}
              loader={cloudinaryLoader}
              src={photos[openIndex].url}
              alt={`${alt} ${openIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {photos.length > 1 && (
            <div className="flex justify-center gap-3 p-3">
              <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={lightboxButton}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next photo" className={lightboxButton}>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
