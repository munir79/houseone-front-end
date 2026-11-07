"use client";

import { useRef, useState } from "react";
import { Download, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import ReceiptView from "./ReceiptView";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { receiptFileName, receiptLink, receiptMessage } from "@/lib/paymentOptions";
import { downloadPdf, makePdfFile } from "@/lib/pdf";
import { formatDate } from "@/lib/tenancyOptions";
import { useMarkSlipSentMutation, useVoidPaymentMutation } from "@/redux/features/payment/paymentApi";

// মোবাইলে PDF সহ শেয়ার, কম্পিউটারে বা শেয়ার না চললে PDF নামিয়ে WhatsApp এ বার্তা ও লিংক
const sendSlip = async (payment, node) => {
  const file = await makePdfFile(node, receiptFileName(payment));
  const text = receiptMessage(payment);

  // ফোনে Share মেনু দিয়ে PDF সহ WhatsApp এ — কম্পিউটারের Share মেনুতে WhatsApp থাকে না
  const isPhone = window.matchMedia("(pointer: coarse)").matches;
  if (isPhone && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (err) {
      if (err?.name === "AbortError") throw err;
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  window.open(`https://wa.me/88${payment.tenantPhone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
};

const ReceiptModal = ({ payment, title = "Receipt", onClose }) => {
  const receiptRef = useRef(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [reason, setReason] = useState("");
  const [sentAt, setSentAt] = useState(payment.slipSentAt);

  const [markSent] = useMarkSlipSentMutation();
  const [voidPayment, { isLoading: isCancelling }] = useVoidPaymentMutation();

  const isVoid = payment.status === "Void";

  const handleSend = async () => {
    setIsWorking(true);
    try {
      await sendSlip(payment, receiptRef.current);
      const response = await markSent(payment._id).unwrap();
      setSentAt(response.data.slipSentAt);
      toast.success("রসিদ পাঠানো হয়েছে");
    } catch (err) {
      // শেয়ার মেনু বন্ধ করলে কিছু বলার নেই, পাঠানো হয়নি ধরে রাখা হয়
      if (err?.name !== "AbortError") toast.error(getErrorMessage(err, "রসিদ পাঠানো যায়নি। আবার চেষ্টা করুন।"));
    } finally {
      setIsWorking(false);
    }
  };

  const handleDownload = async () => {
    setIsWorking(true);
    try {
      await downloadPdf(receiptRef.current, receiptFileName(payment));
    } catch {
      toast.error("PDF তৈরি হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsWorking(false);
    }
  };

  const handleVoid = async () => {
    try {
      await voidPayment({ id: payment._id, reason }).unwrap();
      toast.success("টাকা নেওয়া বাতিল হয়েছে");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "বাতিল হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        <ReceiptView ref={receiptRef} payment={payment} />

        {!isVoid && (
          <p data-slip-status className="text-sm text-muted">
            {sentAt ? `রসিদ পাঠানো হয়েছে · ${formatDate(sentAt)}` : "রসিদ এখনো পাঠানো হয়নি"} ·{" "}
            <a href={receiptLink(payment.token)} target="_blank" rel="noreferrer" className="font-semibold text-primary underline-offset-2 hover:underline">
              ভাড়াটিয়ার লিংক
            </a>
          </p>
        )}

        {isVoiding ? (
          <div className="flex flex-col gap-2 rounded-xl border border-danger/40 p-3">
            <Input id="voidReason" label="কেন বাতিল করছেন (ঐচ্ছিক)" placeholder="যেমন: ভুল অঙ্ক লিখেছিলাম" value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="text-sm text-muted">বিলের টাকা আগের অবস্থায় ফিরবে। রসিদ মুছবে না, “বাতিল” লেখা থাকবে।</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setIsVoiding(false)}>
                Keep
              </Button>
              <Button variant="danger" isLoading={isCancelling} onClick={handleVoid}>
                Cancel Payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            {!isVoid && (
              <Button variant="ghost" onClick={() => setIsVoiding(true)} className="mr-auto text-danger">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancel Payment
              </Button>
            )}
            <Button variant="outline" isLoading={isWorking} onClick={handleDownload}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download PDF
            </Button>
            {!isVoid && (
              <Button isLoading={isWorking} onClick={handleSend}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Send Slip
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReceiptModal;
