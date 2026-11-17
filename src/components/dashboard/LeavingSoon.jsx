import Link from "next/link";
import { CalendarClock } from "lucide-react";
import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/tenancyOptions";

const MAX_ROWS = 3;

// নোটিশ দিয়েছেন এমন ভাড়াটিয়া — কবে যাচ্ছেন; কেউ না থাকলে কিছুই দেখায় না
const LeavingSoon = ({ items }) => {
  if (!items?.length) return null;

  return (
    <Card flush data-leaving-soon className="overflow-hidden">
      <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-base font-bold">
        <CalendarClock className="h-5 w-5 text-warning" aria-hidden="true" />
        Leaving Soon
      </h2>
      <ul className="divide-y divide-border">
        {items.slice(0, MAX_ROWS).map((item) => (
          <li key={item._id}>
            <Link href={`/tenants/${item._id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background">
              <span className="min-w-0 text-sm font-medium wrap-break-word">{item.unitName}</span>
              <span className="shrink-0 text-sm text-muted">{formatDate(item.notice.leavingDate)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default LeavingSoon;
