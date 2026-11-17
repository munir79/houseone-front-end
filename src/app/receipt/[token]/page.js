"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import ReceiptView from "@/components/payment/ReceiptView";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";
import Skeleton from "@/components/ui/Skeleton";
import { receiptFileName } from "@/lib/paymentOptions";
import { downloadPdf } from "@/lib/pdf";
import { useGetPublicReceiptQuery } from "@/redux/features/payment/paymentApi";

// ভাড়াটিয়ার রসিদ — লগইন ছাড়া দেখা ও PDF নামানো
const ReceiptPage = () => {
  const { token } = useParams();
  const receiptRef = useRef(null);
  const [isWorking, setIsWorking] = useState(false);
  const { data, error, isLoading } = useGetPublicReceiptQuery(token);

  const payment = data?.data;

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <div className="flex justify-center">
        <Logo />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : error || !payment ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <X className="h-10 w-10 text-muted" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="text-lg font-semibold">রসিদটি পাওয়া যায়নি</h1>
          <p className="text-sm text-muted">বাড়িওয়ালার কাছ থেকে সঠিক লিংকটি নিন।</p>
        </Card>
      ) : (
        <>
          <Button size="lg" fullWidth isLoading={isWorking} onClick={handleDownload}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </Button>
          <ReceiptView ref={receiptRef} payment={payment} />
        </>
      )}
    </main>
  );
};

export default ReceiptPage;
