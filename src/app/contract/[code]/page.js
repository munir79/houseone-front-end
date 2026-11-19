"use client";

import { useParams } from "next/navigation";
import { BadgeCheck, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";
import Skeleton from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/tenancyOptions";
import { useVerifyContractQuery } from "@/redux/features/tenancy/tenancyApi";

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 text-sm">
    <dt className="text-muted">{label}</dt>
    <dd className="text-right font-medium wrap-break-word">{children}</dd>
  </div>
);

// চুক্তিপত্রের QR — চুক্তিটা আসল কি না আর কোন অবস্থায়; কারও ফোন বা NID নেই
const ContractVerifyPage = () => {
  const { code } = useParams();
  const { data, error, isLoading } = useVerifyContractQuery(code);
  const contract = data?.data;
  const isEnded = contract?.status === "Ended";
  const isExpired = !isEnded && contract?.contractEnd && new Date(contract.contractEnd) < new Date();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6">
      <div className="flex justify-center">
        <Logo />
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : error || !contract ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <X className="h-10 w-10 text-danger" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="text-lg font-semibold">এই চুক্তি পাওয়া যায়নি</h1>
          <p className="text-sm text-muted">QR code টি HouseOne এর কোনো চুক্তির সাথে মেলেনি।</p>
        </Card>
      ) : (
        <Card data-contract-verify className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <BadgeCheck className="h-12 w-12 text-success" strokeWidth={1.5} aria-hidden="true" />
            <h1 className="text-lg font-bold">চুক্তিটি HouseOne এ নথিভুক্ত</h1>
            <Badge variant={isEnded ? "primary" : isExpired ? "warning" : "success"}>{isEnded ? "দোকান ছেড়ে দিয়েছেন" : isExpired ? "মেয়াদ শেষ" : "চলমান"}</Badge>
          </div>
          <dl className="divide-y divide-border">
            <Row label="চুক্তি নম্বর">
              <span className="font-mono">{contract.contractNo}</span>
            </Row>
            <Row label="মার্কেট">{contract.marketName}</Row>
            <Row label="দোকান">{contract.unitName}</Row>
            <Row label="ব্যবসা">{contract.businessName}</Row>
            <Row label="শুরু">{formatDate(contract.startDate)}</Row>
            {contract.contractEnd && <Row label="শেষ">{formatDate(contract.contractEnd)}</Row>}
            {isEnded && contract.endDate && <Row label="দোকান ছেড়েছেন">{formatDate(contract.endDate)}</Row>}
          </dl>
          <p className="text-center text-xs text-muted">টাকার অঙ্ক বা ব্যক্তিগত তথ্য এখানে দেখানো হয় না।</p>
        </Card>
      )}
    </main>
  );
};

export default ContractVerifyPage;
