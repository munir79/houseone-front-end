import { Eye, PhoneCall, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

// জন — আলাদা মানুষ, প্রতি জন একবার; বার — মোট কতবার দেখা হয়েছে
// যোগাযোগ মানে বোতাম চাপা — কল সত্যিই হয়েছে কি না জানা যায় না
export const ListingCounts = ({ counts, className }) => {
  const calls = counts?.calls ?? 0;
  const whatsapps = counts?.whatsapps ?? 0;
  const total = counts?.totalViews ?? 0;
  return (
    <p data-listing-counts className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted", className)}>
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        <span data-count="views">{toBanglaNumber(counts?.views ?? 0)}</span> জন দেখেছেন
        {total > 0 && <span data-count="totalViews">({toBanglaNumber(total)} বার)</span>}
      </span>
      <span className="inline-flex items-center gap-1">
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span data-count="shares">{toBanglaNumber(counts?.shares ?? 0)}</span> শেয়ার
      </span>
      <span className="inline-flex items-center gap-1" title="কল বা WhatsApp বোতাম চেপেছেন">
        <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
        <span data-count="contacts">{toBanglaNumber(counts?.contacts ?? 0)}</span> জন যোগাযোগ বোতাম চেপেছেন
        {calls + whatsapps > 0 && (
          <span data-count="channels">
            (কল {toBanglaNumber(calls)} · WhatsApp {toBanglaNumber(whatsapps)})
          </span>
        )}
      </span>
    </p>
  );
};

const DAY_NAMES = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

// গত ৭ দিনে কতজন দেখেছেন — ছোট কলাম, আজকেরটা গাঢ়
export const WeekBars = ({ daily }) => {
  const top = Math.max(1, ...daily.map(({ view }) => view));
  const total = daily.reduce((sum, { view }) => sum + view, 0);

  return (
    <figure className="flex flex-col gap-1" aria-label={`গত ৭ দিনে ${toBanglaNumber(total)} জন দেখেছেন`}>
      <div className="flex h-10 items-end gap-1" aria-hidden="true">
        {daily.map(({ day, view }, index) => (
          <span key={day} title={`${toBanglaNumber(view)} জন`} className="flex h-full w-4 items-end rounded-sm bg-chart-track sm:w-5">
            <span className={cn("w-full rounded-sm", index === daily.length - 1 ? "bg-primary" : "bg-primary/60")} style={{ height: `${view ? Math.max(12, (view / top) * 100) : 0}%` }} />
          </span>
        ))}
      </div>
      <figcaption className="flex gap-1 text-[10px] text-muted" aria-hidden="true">
        {daily.map(({ day }) => (
          <span key={day} className="w-4 text-center sm:w-5">
            {DAY_NAMES[new Date(`${day}T00:00:00Z`).getUTCDay()].slice(0, 2)}
          </span>
        ))}
      </figcaption>
    </figure>
  );
};
