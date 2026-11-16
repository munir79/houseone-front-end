"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Copy, Flag, Home, MessageCircle, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { cn } from "@/lib/cn";
import { REPORT_REASONS, contactMessage, formatPhone, listingShareText, timeText, whatsappLink } from "@/lib/listingOptions";
import { reportListing, revealContact, trackListing } from "@/lib/publicListing";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const pageUrl = () => window.location.href.split(/[?#]/)[0];

// পাতা খুললে একবার — Server নিজেই একজনকে একবারই গোনে
export const ViewTracker = ({ code }) => {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackListing(code, "view");
  }, [code]);
  return null;
};

// বড় ছবি, আগে-পরে, আর নিচে ছোট ছবির সারি
export const ListingGallery = ({ photos, title }) => {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-primary-soft">
        <Home className="h-14 w-14 text-primary/50" aria-hidden="true" />
      </div>
    );
  }

  const step = (direction) => setIndex((current) => (current + direction + photos.length) % photos.length);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-primary-soft">
        <Image key={photos[index].publicId} loader={cloudinaryLoader} src={photos[index].url} alt={`${title} ${index + 1}`} fill priority={index === 0} sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-card">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-card">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute right-2 bottom-2 rounded-full bg-sidebar/80 px-2.5 py-0.5 text-xs text-sidebar-foreground tabular-nums">
              {toBanglaNumber(index + 1)}/{toBanglaNumber(photos.length)}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {photos.map((photo, photoIndex) => (
            <button
              key={photo.publicId}
              type="button"
              onClick={() => setIndex(photoIndex)}
              aria-label={`Photo ${photoIndex + 1}`}
              aria-current={photoIndex === index}
              className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 sm:h-16 sm:w-24", photoIndex === index ? "border-primary" : "border-transparent opacity-70")}
            >
              <Image loader={cloudinaryLoader} src={photo.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// নম্বর চাপলে তবেই আসে — মোবাইলে সাথে সাথে কল বা WhatsApp খোলে, Desktop এ নম্বর দেখায়
const useContact = (listing) => {
  const [revealed, setRevealed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // কোন বোতাম আগে জানানো হয়েছে — কল ও WhatsApp আলাদা গোনা হয়
  const sentVia = useRef(new Set());
  const phone = revealed?.phone ?? null;

  const open = async (via) => {
    // WhatsApp এর জন্য আগেই নতুন tab — অপেক্ষার পরে খুললে Browser আটকায়
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const tab = via === "whatsapp" && !isTouch ? window.open("", "_blank") : null;
    try {
      let number = phone;
      if (!number) {
        setIsLoading(true);
        const contact = await revealContact(listing.code, via);
        sentVia.current.add(via);
        number = contact.phone;
        setRevealed(contact);
      } else if (!sentVia.current.has(via)) {
        // নম্বর আগেই খোলা — অন্য বোতামটাও গোনার জন্য শুধু জানানো
        sentVia.current.add(via);
        revealContact(listing.code, via).catch(() => null);
      }
      const url = via === "call" ? `tel:${number}` : whatsappLink(number, contactMessage(listing, pageUrl()));
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else if (via === "whatsapp" || isTouch) {
        window.location.href = url;
      }
    } catch (err) {
      tab?.close();
      toast.error(err.status === 410 ? "এই বিজ্ঞাপন আর চালু নেই" : "নম্বর আনা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  return { phone, altPhone: revealed?.altPhone ?? null, isLoading, open };
};

const ContactButtons = ({ listing, contact, compact = false }) => {
  const canCall = listing.contactMode !== "whatsapp";
  const canChat = listing.contactMode !== "call";
  return (
    <div className={cn("grid gap-2", canCall && canChat && "grid-cols-2")}>
      {canCall && (
        <Button size={compact ? "md" : "lg"} data-contact="call" onClick={() => contact.open("call")} isLoading={contact.isLoading}>
          {!contact.isLoading && <Phone className="h-4 w-4" aria-hidden="true" />}
          কল করুন
        </Button>
      )}
      {canChat && (
        <Button size={compact ? "md" : "lg"} variant="accent" data-contact="whatsapp" onClick={() => contact.open("whatsapp")} disabled={contact.isLoading}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </Button>
      )}
    </div>
  );
};

// যোগাযোগ — বড় পর্দায় পাশে, মোবাইলে নিচে আটকানো বোতাম
export const ContactPanel = ({ listing }) => {
  const contact = useContact(listing);
  const hours = listing.callFrom && listing.callTo ? `কল করার সময়: ${timeText(listing.callFrom)} – ${timeText(listing.callTo)}` : null;

  return (
    <>
      <div data-contact-panel className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div>
          <p className="text-xs text-muted">যোগাযোগ{listing.contactName && `: ${listing.contactName}`}</p>
          <p data-phone className="text-lg font-bold tabular-nums">
            {contact.phone ? (
              <a href={`tel:${contact.phone}`} className="hover:underline">
                {formatPhone(contact.phone)}
              </a>
            ) : (
              listing.maskedPhone
            )}
          </p>
          {hours && <p className="text-xs text-muted">{hours}</p>}
          {/* আরেকটি নম্বর — যেমন দারোয়ান; মূল নম্বর খুললে এটাও */}
          {listing.hasAltPhone && (
            <p data-alt-phone className="mt-2 border-t border-border pt-2 text-sm">
              <span className="text-muted">{listing.altName || "আরেকটি নম্বর"}: </span>
              {contact.altPhone ? (
                <a href={`tel:${contact.altPhone}`} className="font-semibold tabular-nums hover:underline">
                  {formatPhone(contact.altPhone)}
                </a>
              ) : (
                <span className="font-semibold tabular-nums">01XXX-XXXXXX</span>
              )}
            </p>
          )}
        </div>
        <ContactButtons listing={listing} contact={contact} />
        <p className="text-xs text-muted">বাসা দেখে, কথা পাকা হলে অগ্রিম দিন। আগে টাকা চাইলে রিপোর্ট করুন।</p>
      </div>

      <div data-sticky-contact className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <ContactButtons listing={listing} contact={contact} compact />
      </div>
    </>
  );
};

// শেয়ার — মোবাইলে ফোনের Share (সম্পন্ন হলে গোনা), নাহলে WhatsApp, Facebook, Copy
export const ShareButton = ({ listing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event) => !boxRef.current?.contains(event.target) && setIsOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  const counted = () => trackListing(listing.code, "share");

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: listingShareText(listing), text: listingShareText(listing), url: pageUrl() });
        counted();
      } catch {
        // বন্ধ করলে গোনা হয় না
      }
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const openShare = (url) => {
    counted();
    window.open(url, "_blank", "noopener,width=600,height=560");
    setIsOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      counted();
      toast.success("Link copy হয়েছে");
    } catch {
      toast.error("Copy হয়নি");
    }
    setIsOpen(false);
  };

  const options = [
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, onClick: () => openShare(`https://wa.me/?text=${encodeURIComponent(`${listingShareText(listing)}\n${pageUrl()}`)}`) },
    { key: "facebook", label: "Facebook", icon: Share2, onClick: () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`) },
    { key: "copy", label: "Link copy", icon: Copy, onClick: copyLink },
  ];

  return (
    <div ref={boxRef} className="relative">
      <Button variant="outline" size="sm" data-share onClick={handleShare} aria-expanded={isOpen}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        শেয়ার
      </Button>
      {isOpen && (
        <div role="menu" className="absolute top-full right-0 z-20 mt-1 w-44 rounded-xl border border-border bg-surface p-1 shadow-card">
          {options.map(({ key, label, icon: Icon, onClick }) => (
            <button key={key} type="button" role="menuitem" data-share-option={key} onClick={onClick} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-background">
              <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ReportButton = ({ code }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reason) return toast.error("কারণ বাছুন");
    setIsSending(true);
    try {
      const result = await reportListing(code, { reason, note });
      toast.success(result.alreadyReported ? "আগেই রিপোর্ট করেছেন, ধন্যবাদ" : "রিপোর্ট পেয়েছি, ধন্যবাদ। আমরা দেখব।");
      setIsOpen(false);
    } catch {
      toast.error("পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-danger">
        <Flag className="h-4 w-4" aria-hidden="true" />
        ভুল বা প্রতারণা? রিপোর্ট করুন
      </button>
      {isOpen && (
        <Modal title="Report listing" onClose={() => setIsOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">কী সমস্যা?</legend>
              {REPORT_REASONS.map(({ value, label }) => (
                <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 text-sm has-checked:border-primary has-checked:bg-primary-soft">
                  <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="h-4 w-4 accent-primary" />
                  {label}
                </label>
              ))}
            </fieldset>
            <Textarea id="reportNote" label="আরও কিছু (ঐচ্ছিক)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={isSending}>
                রিপোর্ট পাঠান
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
