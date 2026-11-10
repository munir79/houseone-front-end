"use client";

import { useEffect } from "react";
import ShareForm from "@/components/tenantForm/ShareForm";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useGetMemberLinkMutation } from "@/redux/features/memberRequest/memberRequestApi";

export const memberLink = (token) => `${window.location.origin}/member/${token}`;

// সদস্যরা নিজেরাই তথ্য দেন — বাড়িওয়ালা Approve করলে তবেই তালিকায় যোগ হয়
const MemberLinkModal = ({ tenancy, onClose }) => {
  const [getLink, { data, error, isLoading }] = useGetMemberLinkMutation();

  useEffect(() => {
    getLink(tenancy._id);
  }, [getLink, tenancy._id]);

  const token = data?.data?.token;

  return (
    <Modal title="Member Link" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          সব সদস্যের তথ্য আপনি না জানলে এই লিংক ভাড়াটিয়াকে দিন। প্রত্যেক সদস্য নিজের নাম, ফোন, NID ও ছবি দেবেন। আপনি দেখে Approve করলে তবেই সদস্য তালিকায় যোগ হবেন।
        </p>
        {isLoading || (!token && !error) ? (
          <Skeleton className="h-36 w-full" />
        ) : error ? (
          <p className="text-sm text-danger">{getErrorMessage(error, "লিংক তৈরি হয়নি। আবার চেষ্টা করুন।")}</p>
        ) : (
          <ShareForm
            link={memberLink(token)}
            message={`${tenancy.propertyName}, ${tenancy.unitName} এর সদস্যদের তথ্য। প্রত্যেকে এই লিংকে গিয়ে নিজের তথ্য দিন:`}
            note="এই ফ্ল্যাটের সবার জন্য একটিই লিংক। ভাড়াটিয়া বাসা ছাড়লে লিংক বন্ধ হয়ে যাবে।"
          />
        )}
      </div>
    </Modal>
  );
};

export default MemberLinkModal;
