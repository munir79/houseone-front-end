"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { buttonClasses } from "@/components/ui/Button";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { formatMoney } from "@/lib/formatMoney";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { fromMonthLabel, increaseMessage, whatsappLink } from "@/lib/marketOptions";
import { formatDate } from "@/lib/tenancyOptions";
import { useDecideIncreaseMutation } from "@/redux/features/tenancy/tenancyApi";

const CHOICES = { accept: "রাজি", edit: "অঙ্ক বদলান", skip: "এবার বাদ" };
const keyOf = (label) => Object.keys(CHOICES).find((key) => CHOICES[key] === label);

// ভাড়া বৃদ্ধির সময় — মালিক রাজি, অঙ্ক বদলে রাজি, অথবা এবার বাদ; রাজি হলে ব্যবসায়ীকে WhatsApp এ জানানো
const IncreaseModal = ({ tenancy, onClose }) => {
  // সেভের পরে তথ্য নতুন করে এলে increaseDue চলে যায় — খোলার সময়েরটা ধরে রাখা
  const [due] = useState(tenancy.increaseDue);
  const [choice, setChoice] = useState("accept");
  const [amount, setAmount] = useState(String(due.suggestedRent));
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [decide, { isLoading }] = useDecideIncreaseMutation();

  const newRent = choice === "edit" ? Number(amount) : due.suggestedRent;

  const handleSave = async () => {
    if (choice === "edit" && (!amount || Number(amount) < 0)) {
      setError("নতুন ভাড়া লিখুন");
      return;
    }
    try {
      await decide({ id: tenancy._id, step: due.step, action: choice === "skip" ? "skip" : "accept", ...(choice === "edit" ? { newRent: Number(amount) } : {}) }).unwrap();
      if (choice === "skip") {
        toast.success("এবারের ভাড়া বৃদ্ধি বাদ দেওয়া হয়েছে");
        onClose();
        return;
      }
      setDone({ oldRent: due.currentRent, newRent, fromMonth: due.fromMonth });
    } catch (err) {
      toast.error(getErrorMessage(err, "সেভ হয়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <Modal title="ভাড়া বৃদ্ধি" onClose={onClose}>
      {done ? (
        <div data-increase-done className="flex flex-col gap-4">
          <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success-foreground">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            {fromMonthLabel(done.fromMonth)} থেকে ভাড়া {formatMoney(done.newRent)}
          </p>
          <p className="text-sm text-muted">ব্যবসায়ীকে জানিয়ে দিন, যাতে পরের বিলে অবাক না হন।</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              বন্ধ করুন
            </Button>
            <a
              href={whatsappLink(tenancy.tenantPhone, increaseMessage({ businessName: tenancy.market.businessName, unitName: tenancy.unitName, propertyName: tenancy.propertyName, ...done }))}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({})}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp-এ জানান
            </a>
          </div>
        </div>
      ) : (
        <div data-increase-modal className="flex flex-col gap-4">
          <div className="rounded-xl bg-background px-4 py-3 text-sm">
            <p className="font-semibold">
              {tenancy.market.businessName} · {tenancy.unitName}
            </p>
            <p className="text-muted">
              {formatDate(due.dueOn)} চুক্তির {due.step + 1 > 1 ? "পরের" : "প্রথম"} বৃদ্ধির সময় · নিয়ম অনুযায়ী {formatMoney(due.currentRent)} থেকে {formatMoney(due.suggestedRent)}
            </p>
          </div>

          <SegmentedControl label="Increase decision" options={Object.values(CHOICES)} value={CHOICES[choice]} onChange={(label) => setChoice(keyOf(label))} />

          {choice === "edit" && (
            <Input
              id="increaseRent"
              type="number"
              inputMode="numeric"
              min="0"
              label="নতুন মাসিক ভাড়া (৳)"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              error={error}
            />
          )}

          <p className="text-sm text-muted">
            {choice === "skip"
              ? `এবার ভাড়া বাড়বে না, ${formatMoney(due.currentRent)}-ই থাকবে। পরের বৃদ্ধির সময় আবার মনে করাব।`
              : `${fromMonthLabel(due.fromMonth)}-এর বিল থেকে ভাড়া ${formatMoney(newRent || 0)} হবে। আগের বিল বদলাবে না।`}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isLoading} onClick={handleSave}>
              {choice === "skip" ? "এবার বাদ দিন" : "নিশ্চিত করুন"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default IncreaseModal;
