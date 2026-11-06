import Card from "@/components/ui/Card";
import { ELECTRICITY_OPTIONS, GAS_OPTIONS, advanceNote, utilityText } from "@/lib/formTerms";
import { formatMoney } from "@/lib/formatMoney";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const Line = ({ label, value, strong }) => (
  <div className={strong ? "flex justify-between gap-3 border-t border-border pt-2 text-base font-bold" : "flex justify-between gap-3 text-sm"}>
    <dt className="min-w-0 wrap-break-word">{label}</dt>
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

const Utility = ({ label, text }) => (
  <p className="text-sm">
    <span className="font-semibold">{label}: </span>
    {text}
  </p>
);

// ভাড়াটিয়া যে হিসাবে রাজি হচ্ছেন — ফর্ম, Preview, কপি ও ভাড়াটিয়ার পেজে একই
const TermsCard = ({ terms, title = "ভাড়ার হিসাব" }) => {
  const note = advanceNote(terms);

  return (
    <Card data-terms className="flex flex-col gap-3">
      <h2 className="text-base font-bold">{title}</h2>
      <dl className="flex flex-col gap-1.5">
        <Line label="বাসা ভাড়া" value={formatMoney(terms.rent)} />
        {terms.charges.map(({ name, amount }, index) => (
          <Line key={index} label={name} value={formatMoney(amount)} />
        ))}
        <Line strong label="মোট প্রতি মাসে" value={formatMoney(terms.total)} />
      </dl>
      <p className="text-sm">প্রতি মাসের {toBanglaNumber(terms.dueDay)} তারিখের মধ্যে দিতে হবে।</p>

      {terms.advance > 0 && (
        <div className="rounded-xl bg-primary-soft px-3 py-2">
          <p className="flex justify-between gap-3 text-sm font-semibold">
            <span>Advance{terms.advanceMonths > 0 && ` (${terms.isExactAdvance ? "" : "প্রায় "}${toBanglaNumber(terms.advanceMonths)} মাস)`}</span>
            <span className="tabular-nums">{formatMoney(terms.advance)}</span>
          </p>
          {note && <p className="mt-1 text-sm">{note}</p>}
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-border pt-2">
        <Utility label="বিদ্যুৎ" text={utilityText(ELECTRICITY_OPTIONS, terms.electricity)} />
        <Utility label="গ্যাস" text={utilityText(GAS_OPTIONS, terms.gas)} />
      </div>
    </Card>
  );
};

export default TermsCard;
