"use client";

import { useState } from "react";
import { ExternalLink, Pause, Pencil, Play, RefreshCw, Share2, XCircle } from "lucide-react";
import { toast } from "sonner";
import ListingFormModal from "./ListingFormModal";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { daysLeft, listingPath, listingShareText } from "@/lib/listingOptions";
import { useChangeListingMutation } from "@/redux/features/listing/listingApi";

const RENEW_WINDOW_DAYS = 3;

const DONE = { pause: "বিজ্ঞাপন বন্ধ রাখা হয়েছে", resume: "বিজ্ঞাপন আবার চালু", renew: "আরও ৩০ দিন চালু থাকবে", close: "বিজ্ঞাপন বন্ধ হয়েছে" };

// নিজের বিজ্ঞাপনের link শেয়ার — মোবাইলে ফোনের নিজের Share, নাহলে copy
export const shareListing = async (listing) => {
  const url = `${window.location.origin}${listingPath(listing)}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: listingShareText(listing), url });
    } catch {
      // Share বন্ধ করলে কিছু করার নেই
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copy হয়েছে। Facebook বা WhatsApp-এ দিন।");
  } catch {
    toast.error("Copy হয়নি");
  }
};

export const canRenewListing = (listing) => listing.status === "Expired" || daysLeft(listing.expiresAt) <= RENEW_WINDOW_DAYS;

// বিজ্ঞাপনের সব কাজ — Unit পাতা ও To-Let Marketplace দুই জায়গাতেই
const ListingActions = ({ listing, unitId, alwaysMenu = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [changeListing, { isLoading }] = useChangeListingMutation();

  const run = async (action) => {
    try {
      await changeListing({ id: listing._id, action }).unwrap();
      toast.success(DONE[action]);
      setIsClosing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  const items = [
    listing.status === "Active" && { key: "view", label: "পাতা দেখুন", icon: ExternalLink, onClick: () => window.open(listingPath(listing), "_blank", "noopener") },
    listing.status === "Active" && { key: "share", label: "শেয়ার", icon: Share2, onClick: () => shareListing(listing) },
    canRenewListing(listing) && { key: "renew", label: "আবার চালু (৩০ দিন)", icon: RefreshCw, onClick: () => run("renew") },
    { key: "edit", label: "Edit", icon: Pencil, onClick: () => setIsEditing(true) },
    listing.status === "Active" && { key: "pause", label: "কিছুদিন বন্ধ রাখুন", icon: Pause, onClick: () => run("pause") },
    listing.status === "Paused" && { key: "resume", label: "আবার চালু", icon: Play, onClick: () => run("resume") },
    { key: "close", label: "বিজ্ঞাপন বন্ধ", icon: XCircle, onClick: () => setIsClosing(true) },
  ].filter(Boolean);

  return (
    <>
      <ActionMenu items={items} label="Listing actions" alwaysMenu={alwaysMenu} />
      {isEditing && <ListingFormModal unitId={unitId} listing={listing} onClose={() => setIsEditing(false)} />}
      {isClosing && (
        <ConfirmDialog
          title="বিজ্ঞাপন বন্ধ করবেন?"
          message="To-Let পাতা থেকে সরে যাবে। দেখা ও যোগাযোগের হিসাব থাকবে না। পরে নতুন করে দেওয়া যাবে।"
          confirmLabel="বন্ধ করুন"
          isLoading={isLoading}
          onConfirm={() => run("close")}
          onClose={() => setIsClosing(false)}
        />
      )}
    </>
  );
};

export default ListingActions;
