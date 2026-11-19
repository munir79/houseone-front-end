import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

const WATERMARK_ROWS = 14;
const WATERMARK_COLUMNS = 3;

// কাগজের মতো সাদা পাতা — অন্ধকার Theme এও PDF সাদা থাকে
// watermark — পুরো পাতায় হালকা, কাত করা লেখা (সম্পদের নাম · নম্বর), কপি করে বদলালে ধরা যায়
// docId — চুক্তি বা ফর্মের নম্বর; qrValue — scan করলে যাচাইয়ের পাতা
const PdfSheet = forwardRef(({ title, subtitle, watermark, docId, qrValue, qrLabel, footerNote, children }, ref) => (
  <div ref={ref} data-pdf-sheet className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 sm:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute top-1/2 left-1/2 flex w-[180%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] flex-col gap-14">
        {Array.from({ length: WATERMARK_ROWS }, (_, row) => (
          <p key={row} className="flex justify-around gap-12 text-xl font-bold whitespace-nowrap text-neutral-900/[0.06]" style={{ marginLeft: row % 2 ? "8%" : 0 }}>
            {Array.from({ length: WATERMARK_COLUMNS }, (_, column) => (
              <span key={column}>{watermark}</span>
            ))}
          </p>
        ))}
      </div>
    </div>

    <div className="relative flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 border-b-2 border-neutral-900 pb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
        </div>
        {docId && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-neutral-500">নম্বর</p>
            <p data-doc-id className="font-mono text-sm font-bold">
              {docId}
            </p>
          </div>
        )}
      </header>

      {children}

      <footer className="flex items-end justify-between gap-4 border-t border-neutral-200 pt-4">
        <div className="min-w-0 text-xs text-neutral-500">
          {footerNote && <p>{footerNote}</p>}
          <p className="mt-1">HouseOne থেকে তৈরি · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        {qrValue && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <QRCodeSVG value={qrValue} size={84} aria-label={qrLabel} />
            <span className="text-[10px] text-neutral-500">{qrLabel}</span>
          </div>
        )}
      </footer>
    </div>
  </div>
));

PdfSheet.displayName = "PdfSheet";

// পাতার ভেতরের অংশ — শিরোনাম আর দুই কলামের তথ্য
export const SheetSection = ({ title, children }) => (
  <section className="flex flex-col gap-2">
    <h2 className="border-b border-neutral-200 pb-1 text-sm font-bold tracking-wide text-neutral-700 uppercase">{title}</h2>
    {children}
  </section>
);

export const SheetRows = ({ rows }) => (
  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
    {rows
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-neutral-500">{label}</dt>
          <dd className="text-sm font-medium wrap-break-word">{value}</dd>
        </div>
      ))}
  </dl>
);

export default PdfSheet;
