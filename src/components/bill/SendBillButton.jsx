"use client";

import { Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { buttonClasses } from "@/components/ui/Button";
import { billReminderLink } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useMarkBillSentMutation } from "@/redux/features/bill/billApi";

// WhatsApp এ বিল পাঠানো — Link সাথে সাথে খোলে, পেছনে "পাঠানো হয়েছে" লেখা হয়
// isIcon — তালিকার সারিতে ছোট বোতাম, না হলে লেখাসহ বোতাম
const SendBillButton = ({ bill, isIcon = false, size, className }) => {
  const [markBillSent] = useMarkBillSentMutation();
  const isSent = Boolean(bill.sentAt);

  const handleClick = () => {
    markBillSent(bill._id)
      .unwrap()
      .catch((err) => toast.error(getErrorMessage(err, "পাঠানো হয়েছে বলে লেখা যায়নি")));
  };

  if (isIcon) {
    return (
      <a
        href={billReminderLink(bill)}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        data-send-bill={isSent ? "sent" : "not-sent"}
        aria-label={`${isSent ? "Send bill again" : "Send bill"} to ${bill.tenantName} on WhatsApp`}
        title={isSent ? "বিল পাঠানো হয়েছে, আবার পাঠাতে চাপুন" : "WhatsApp এ বিল পাঠান"}
        className={cn("relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-primary-soft", isSent ? "text-primary" : "text-muted", className)}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {isSent && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </a>
    );
  }

  return (
    <a href={billReminderLink(bill)} target="_blank" rel="noreferrer" onClick={handleClick} data-send-bill={isSent ? "sent" : "not-sent"} className={cn(buttonClasses({ variant: "outline", size }), className)}>
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {isSent ? "Send Again" : "Send Bill"}
    </a>
  );
};

export default SendBillButton;
