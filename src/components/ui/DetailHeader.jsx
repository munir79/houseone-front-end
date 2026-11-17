import Image from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";

// বাড়ি ও ইউনিটের Page এর শিরোনাম — ছোট ছবি, নাম ও কাজের বাটন
// compact — ইউনিট ও ভাড়াটিয়া পাশাপাশি বসলে
const DetailHeader = ({ title, subtitle, photoUrl, icon: Icon, badge, actions, compact = false }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary-soft">
          {photoUrl ? (
            <Image loader={cloudinaryLoader} src={photoUrl} alt={title} fill priority sizes="56px" className="object-cover" />
          ) : (
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={compact ? "text-xl font-bold tracking-tight wrap-break-word" : "text-xl font-bold tracking-tight wrap-break-word sm:text-3xl"}>{title}</h1>
            {badge}
          </div>
          <p className="text-sm wrap-break-word text-muted">{subtitle}</p>
        </div>
      </div>
      {actions}
    </div>
  );
};

export default DetailHeader;
