"use client";

import { useState } from "react";
import { Eye, FileDown, Pencil, Wallet } from "lucide-react";
import { toast } from "sonner";
import ContractDocument from "./ContractDocument";
import EditContractModal from "./EditContractModal";
import ReceiveDepositModal from "./ReceiveDepositModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { DEPOSIT_LABELS, formatMonths, fromMonthLabel } from "@/lib/marketOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";
import { useGetContractDocumentsMutation } from "@/redux/features/tenancy/tenancyApi";

const Row = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm font-medium wrap-break-word">{children}</dd>
  </div>
);

// এক ধরনের জমা — ঠিক হয়েছিল, পেয়েছেন, বাকি; বাকি থাকলে "টাকা নিন"
const DepositRow = ({ kind, agreed, received, due, extra, canReceive, onReceive }) => (
  <li data-deposit={kind} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-semibold">
        {DEPOSIT_LABELS[kind]}
        {kind === "Position" && <span className="font-normal text-muted"> (সালামি)</span>}
      </p>
      <p className="text-sm text-muted">
        মোট {formatMoney(agreed)} · পেয়েছেন {formatMoney(received)}
        {extra}
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {due > 0 ? <Badge variant="warning">বাকি {formatMoney(due)}</Badge> : <Badge variant="success">সব পেয়েছেন</Badge>}
      {canReceive && due > 0 && (
        <Button size="sm" variant="outline" onClick={onReceive}>
          <Wallet className="h-4 w-4" aria-hidden="true" />
          টাকা নিন
        </Button>
      )}
    </div>
  </li>
);

// দোকানের চুক্তি ও জমার হিসাব — ব্যবসায়ীর পাতার "চুক্তি ও টাকা" tab
const ShopContractPanel = ({ tenancy, onOpenInstallments }) => {
  const [receiving, setReceiving] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [papers, setPapers] = useState(null);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [getDocuments, { isLoading: isOpening }] = useGetContractDocumentsMutation();

  const { market, deposits } = tenancy;
  const isActive = tenancy.status === "Active";
  const position = deposits.position;
  const nextInstallment = position.next;
  const paperCount = (market.contractPhotos?.length ?? 0) + (market.tradeLicensePhoto ? 1 : 0);

  const openPapers = async () => {
    try {
      const { data } = await getDocuments(tenancy._id).unwrap();
      setPapers(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "ছবি খোলা যায়নি।"));
    }
  };

  return (
    <div data-shop-contract className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold">চুক্তি</h2>
            {market.contractNo && <p data-contract-no className="font-mono text-xs text-muted">{market.contractNo}</p>}
          </div>
          <button type="button" aria-label="Edit contract" onClick={() => setIsEditing(true)} className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-soft">
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Row label="শুরু">{formatDate(tenancy.startDate)}</Row>
          <Row label="মেয়াদ">{formatMonths(market.contractMonths)}</Row>
          <Row label="শেষ হবে">{market.contractEnd ? formatDate(market.contractEnd) : "—"}</Row>
          <Row label="মাসিক ভাড়া">{formatMoney(tenancy.rent)}</Row>
          <Row label="সার্ভিস চার্জ">{formatMoney(market.serviceCharge)}</Row>
          <Row label="ভাড়ার তারিখ">প্রতি মাসের {toBanglaNumber(tenancy.dueDay)} তারিখ</Row>
          <Row label="ভাড়া বৃদ্ধি">
            {market.increase?.amount > 0 ? `${market.increase.everyYears === 1 ? "প্রতি বছর" : `প্রতি ${toBanglaNumber(market.increase.everyYears)} বছরে`} ${formatMoney(market.increase.amount)}` : "নিয়ম নেই"}
          </Row>
          <Row label="অগ্রিম">{market.advanceMonths > 0 ? `${toBanglaNumber(market.advanceMonths)} মাসের, ${formatMoney(tenancy.advance)}` : formatMoney(tenancy.advance)}</Row>
          {market.nextRent && <Row label="নতুন ভাড়া">{`${fromMonthLabel(market.nextRent.fromMonth)} থেকে ${formatMoney(market.nextRent.amount)}`}</Row>}
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsDocumentOpen(true)}>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            চুক্তিপত্র PDF
          </Button>
          {paperCount > 0 && (
            <Button variant="outline" size="sm" isLoading={isOpening} onClick={openPapers}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              সই করা কাগজ ও Trade License ({toBanglaNumber(paperCount)})
            </Button>
          )}
        </div>
      </Card>

      {market.increaseHistory?.length > 0 && (
        <Card flush className="overflow-hidden">
          <h2 className="border-b border-border px-4 py-3 text-base font-bold">ভাড়া বৃদ্ধির ইতিহাস</h2>
          <ul data-increase-history className="divide-y divide-border">
            {[...market.increaseHistory].reverse().map((item) => (
              <li key={`${item.dueOn}-${item.decidedAt}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  {item.action === "Applied" ? `${formatMoney(item.oldRent)} থেকে ${formatMoney(item.newRent)} (${fromMonthLabel(item.fromMonth)} থেকে)` : `এবার বাড়ানো হয়নি (${formatMoney(item.oldRent)} ছিল)`}
                  <span className="block text-xs text-muted">
                    {formatDate(item.decidedAt)}
                    {item.decidedByName ? ` · ${item.decidedByName}` : ""}
                  </span>
                </span>
                <Badge variant={item.action === "Applied" ? "success" : "primary"}>{item.action === "Applied" ? "বেড়েছে" : "বাদ"}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card flush className="overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-base font-bold">জমার টাকা</h2>
        <ul className="divide-y divide-border">
          <DepositRow kind="Security" {...deposits.security} canReceive={isActive} onReceive={() => setReceiving({ kind: "Security", due: deposits.security.due })} extra={deposits.security.returned > 0 ? ` · ফেরত ${formatMoney(deposits.security.returned)}` : ""} />
          <DepositRow kind="Advance" {...deposits.advance} canReceive={isActive} onReceive={() => setReceiving({ kind: "Advance", due: deposits.advance.due })} extra={deposits.advance.used > 0 ? ` · ভাড়ায় গেছে ${formatMoney(deposits.advance.used)}` : ""} />
          {position.total > 0 && (
            <DepositRow
              kind="Position"
              agreed={position.total}
              received={position.received}
              due={position.due}
              canReceive={isActive}
              onReceive={() => setReceiving({ kind: "Position", due: position.due, suggested: nextInstallment ? nextInstallment.amount - nextInstallment.paid : position.due })}
            />
          )}
        </ul>

        {position.installments.length > 1 && (
          <div data-installment-summary className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
            <p className="text-sm">
              পজিশন মানির কিস্তি: {toBanglaNumber(position.installments.length)}টির {toBanglaNumber(position.installments.filter(({ status }) => status === "Paid").length)}টি পুরো পেয়েছেন
              {nextInstallment?.dueDate ? ` · পরেরটা ${formatDate(nextInstallment.dueDate)}` : ""}
            </p>
            {onOpenInstallments && (
              <Button size="sm" variant="ghost" onClick={onOpenInstallments}>
                কিস্তি দেখুন
              </Button>
            )}
          </div>
        )}
      </Card>

      {receiving && <ReceiveDepositModal tenancy={tenancy} {...receiving} onClose={() => setReceiving(null)} />}
      {isDocumentOpen && <ContractDocument tenancy={tenancy} onClose={() => setIsDocumentOpen(false)} />}
      {isEditing && <EditContractModal tenancy={tenancy} onClose={() => setIsEditing(false)} />}
      {papers && (
        <Modal title="চুক্তিপত্র ও Trade License" onClose={() => setPapers(null)} size="lg">
          <div className="grid gap-3 sm:grid-cols-2">
            {papers.map(({ publicId, kind, url }, index) => (
              <a key={publicId} href={url} target="_blank" rel="noreferrer" className="flex flex-col gap-1">
                {/* Private ছবির অল্প সময়ের লিংক — next/image এ Cache করা যায় না */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={kind === "Contract" ? `চুক্তিপত্র পাতা ${index + 1}` : "Trade License"} className="aspect-3/4 w-full rounded-lg border border-border object-cover" />
                <span className="text-xs text-muted">{kind === "Contract" ? `চুক্তিপত্র, পাতা ${toBanglaNumber(index + 1)}` : "Trade License"}</span>
              </a>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShopContractPanel;
