"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PdfSheet, { SheetRows, SheetSection } from "@/components/ui/PdfSheet";
import Skeleton from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/formatMoney";
import { businessTypeLabel, formatMonths } from "@/lib/marketOptions";
import { downloadPdf } from "@/lib/pdf";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { floorName } from "@/lib/unitOptions";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { useGetPropertyQuery } from "@/redux/features/property/propertyApi";
import { useGetUnitQuery } from "@/redux/features/unit/unitApi";

const contractLink = (code) => `${window.location.origin}/contract/${code}`;

const Signature = ({ label, name }) => (
  <div className="flex flex-col gap-1 pt-10">
    <span className="border-t border-neutral-400" />
    <span className="text-sm font-medium">{label}</span>
    <span className="text-xs text-neutral-500">{name}</span>
  </div>
);

// চুক্তিপত্র — পর্দায় যা দেখায়, PDF এ ঠিক তাই (বাংলা লেখা ছবি হয়ে যায়, তাই ভাঙে না)
const ContractSheet = ({ sheetRef, tenancy, property, unit, ownerName }) => {
  const { market, tenant, deposits } = tenancy;
  const position = deposits.position;
  const increase = market.increase?.amount > 0 ? `${market.increase.everyYears === 1 ? "প্রতি বছর" : `প্রতি ${toBanglaNumber(market.increase.everyYears)} বছরে`} ${formatMoney(market.increase.amount)} করে (চুক্তির শুরু থেকে হিসাব)` : "নেই";

  return (
    <PdfSheet
      ref={sheetRef}
      title="দোকান ভাড়ার চুক্তিপত্র"
      subtitle={`${property.name} · ${[property.address, property.area, property.city].filter(Boolean).join(", ")}`}
      watermark={`${property.name} · ${market.contractNo}`}
      docId={market.contractNo}
      qrValue={market.verifyCode ? contractLink(market.verifyCode) : undefined}
      qrLabel="Scan করে যাচাই করুন"
      footerNote="উভয় পক্ষ উপরের শর্তে রাজি হয়ে স্বাক্ষর করলেন। এটি স্ট্যাম্প করা দলিল নয়, দরকারে স্ট্যাম্পে লিখে নিন।"
    >
      <SheetSection title="পক্ষ">
        <SheetRows
          rows={[
            ["প্রথম পক্ষ (মার্কেটের মালিক)", property.receiptName || ownerName],
            ["মোবাইল", property.receiptPhone],
            ["দ্বিতীয় পক্ষ (ব্যবসায়ী)", tenant.name],
            ["মোবাইল", tenant.phone],
            ["NID", tenant.nidLast4 && `শেষ ৪ সংখ্যা ${tenant.nidLast4}`],
            ["ঠিকানা", tenant.permanentAddress],
          ]}
        />
      </SheetSection>

      <SheetSection title="ব্যবসা ও দোকান">
        <SheetRows
          rows={[
            ["ব্যবসার নাম", market.businessName],
            ["ধরন", businessTypeLabel(market)],
            ["Trade License", market.tradeLicense],
            ["দোকান নম্বর", tenancy.unitName],
            ["ফ্লোর", unit && floorName(unit.floor)],
            ["ব্লক", unit?.block],
            ["মাপ", unit?.sizeSqft ? `${unit.sizeSqft.toLocaleString("en-IN")} বর্গফুট` : ""],
          ]}
        />
      </SheetSection>

      <SheetSection title="মেয়াদ ও ভাড়া">
        <SheetRows
          rows={[
            ["শুরু", formatDate(tenancy.startDate)],
            ["মেয়াদ", formatMonths(market.contractMonths)],
            ["শেষ", market.contractEnd && formatDate(market.contractEnd)],
            ["মাসিক ভাড়া", formatMoney(tenancy.rent)],
            ["সার্ভিস চার্জ", formatMoney(market.serviceCharge)],
            ["ভাড়া দেওয়ার তারিখ", `প্রতি মাসের ${toBanglaNumber(tenancy.dueDay)} তারিখের মধ্যে`],
          ]}
        />
        <p className="text-sm">
          <span className="font-semibold">ভাড়া বৃদ্ধি:</span> {increase}
        </p>
      </SheetSection>

      <SheetSection title="জমার টাকা">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500">
              <th className="py-1 font-medium">বিষয়</th>
              <th className="py-1 text-right font-medium">ঠিক হয়েছে</th>
              <th className="py-1 text-right font-medium">পেয়েছেন</th>
              <th className="py-1 text-right font-medium">বাকি</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {[
              [`অগ্রিম ভাড়া${market.advanceMonths ? ` (${toBanglaNumber(market.advanceMonths)} মাস)` : ""}`, deposits.advance],
              ["সিকিউরিটি মানি (ফেরতযোগ্য)", deposits.security],
              ["পজিশন মানি (সালামি)", { agreed: position.total, received: position.received, due: position.due }],
            ]
              .filter(([, row]) => row.agreed > 0)
              .map(([label, row]) => (
                <tr key={label}>
                  <td className="py-1.5">{label}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatMoney(row.agreed)}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatMoney(row.received)}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{formatMoney(row.due)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        {position.installments.length > 1 && (
          <ol className="flex flex-col gap-0.5 text-sm">
            {position.installments.map((item, index) => (
              <li key={index}>
                কিস্তি {toBanglaNumber(index + 1)}: {formatMoney(item.amount)} · {item.dueDate ? formatDate(item.dueDate) : "চুক্তির দিন"}
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-neutral-600">অগ্রিম ভাড়া দোকান ছাড়ার সময় শেষ মাস(গুলো)র ভাড়ায় সমন্বয় হবে। সিকিউরিটি মানি দোকান ছাড়ার সময় ফেরত দেওয়া হবে।</p>
      </SheetSection>

      {market.family.length > 0 && (
        <SheetSection title="জরুরি যোগাযোগ (পরিবার)">
          <SheetRows rows={market.family.map((member) => [`${member.name} (${member.relation})`, member.phone])} />
        </SheetSection>
      )}

      {tenancy.rules?.length > 0 && (
        <SheetSection title="শর্ত ও নিয়ম">
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
            {tenancy.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ol>
        </SheetSection>
      )}

      <div className="grid grid-cols-2 gap-8">
        <Signature label="প্রথম পক্ষের স্বাক্ষর" name={property.receiptName || ownerName} />
        <Signature label="দ্বিতীয় পক্ষের স্বাক্ষর" name={tenant.name} />
      </div>
    </PdfSheet>
  );
};

// চুক্তিপত্র দেখা ও PDF নামানো
const ContractDocument = ({ tenancy, onClose }) => {
  const sheetRef = useRef(null);
  const [isWorking, setIsWorking] = useState(false);
  const { data: propertyData } = useGetPropertyQuery(tenancy.property);
  const { data: unitData } = useGetUnitQuery(tenancy.unit);
  const { data: profile } = useGetMyProfileQuery();
  const property = propertyData?.data;

  const handleDownload = async () => {
    setIsWorking(true);
    try {
      await downloadPdf(sheetRef.current, `Contract-${tenancy.market.contractNo || tenancy.unitName}.pdf`);
    } catch {
      toast.error("PDF তৈরি হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Modal title="চুক্তিপত্র" onClose={onClose} size="lg">
      <div data-contract-document className="flex flex-col gap-4">
        <Button isLoading={isWorking} disabled={!property} onClick={handleDownload} className="w-full sm:w-fit">
          <Download className="h-4 w-4" aria-hidden="true" />
          PDF নামান
        </Button>
        {property ? (
          <ContractSheet sheetRef={sheetRef} tenancy={tenancy} property={property} unit={unitData?.data} ownerName={profile?.data?.name} />
        ) : (
          <Skeleton className="h-96 w-full rounded-xl" />
        )}
      </div>
    </Modal>
  );
};

export default ContractDocument;
