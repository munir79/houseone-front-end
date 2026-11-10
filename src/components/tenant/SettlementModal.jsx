"use client";

import { useRef, useState } from "react";
import { Download, Send } from "lucide-react";
import { toast } from "sonner";
import SettlementView, { settlementFileName, settlementMessage } from "./SettlementView";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { downloadPdf, sendPdfOnWhatsApp } from "@/lib/pdf";

// বিদায়ী হিসাব দেখা, PDF নামানো ও ভাড়াটিয়াকে পাঠানো
const SettlementModal = ({ tenancy, title = "Move-out Settlement", onClose }) => {
  const viewRef = useRef(null);
  const [isWorking, setIsWorking] = useState(false);

  const run = async (work, failMessage) => {
    setIsWorking(true);
    try {
      await work();
    } catch (err) {
      if (err?.name !== "AbortError") toast.error(failMessage);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <SettlementView ref={viewRef} tenancy={tenancy} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" isLoading={isWorking} onClick={() => run(() => downloadPdf(viewRef.current, settlementFileName(tenancy)), "PDF তৈরি হয়নি। আবার চেষ্টা করুন।")}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </Button>
          <Button
            isLoading={isWorking}
            onClick={() =>
              run(
                () => sendPdfOnWhatsApp({ node: viewRef.current, fileName: settlementFileName(tenancy), text: settlementMessage(tenancy), phone: tenancy.tenantPhone }),
                "পাঠানো যায়নি। আবার চেষ্টা করুন।"
              )
            }
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Send on WhatsApp
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SettlementModal;
