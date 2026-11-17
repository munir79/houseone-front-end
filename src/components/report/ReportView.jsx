import { forwardRef } from "react";
import { monthLabel } from "@/lib/billOptions";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/formatMoney";
import { formatDate } from "@/lib/tenancyOptions";
import { toBanglaNumber } from "@/lib/toBanglaNumber";

const Section = ({ title, note, children, ...props }) => (
  <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5" {...props}>
    <div>
      <h2 className="text-base font-bold">{title}</h2>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
    {children}
  </section>
);

const Line = ({ label, value, strong, tone, indent }) => (
  <div className={cn("flex justify-between gap-3", strong ? "text-base font-bold" : "text-sm", indent && "pl-3", tone)}>
    <dt className="min-w-0 wrap-break-word">{label}</dt>
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

// টেবিল ছোট পর্দায় পাশে সরে, পুরো পাতা নয়
const Table = ({ head, children, ...props }) => (
  <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
    <table className="w-full min-w-[32rem] text-sm" {...props}>
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted">
          {head.map(({ label, isNumber }) => (
            <th key={label} className={cn("py-2 pr-3 font-medium last:pr-0", isNumber && "text-right")}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const Cell = ({ children, isNumber, strong, tone }) => <td className={cn("border-b border-border py-2 pr-3 last:pr-0", isNumber && "text-right tabular-nums", strong && "font-semibold", tone)}>{children}</td>;

const signed = (amount) => (amount < 0 ? "text-danger" : "");

// অংশীদারদের ভাগ — পাওনা, হাতে আছে, ফারাক; শেষে কে কাকে দেবেন
const ShareSection = ({ shares }) => {
  const nameOf = (id) => shares.rows.find(({ _id }) => _id === id)?.name || "—";
  return (
    <Section
      title="অংশীদারদের ভাগ"
      note={shares.mode === "flat" ? "যার ফ্ল্যাট তার আয়; পুরো বাড়ির খরচ ফ্ল্যাটের সংখ্যা হারে" : "লাভ ভাগের শতাংশ হারে"}
      data-report-shares
    >
      {shares.unsetMonths > 0 && <p className="text-sm text-warning-foreground">{toBanglaNumber(shares.unsetMonths)} মাসে ভাগ ঠিক করা ছিল না — সেই লাভ মূল মালিকের ঘরে।</p>}
      <Table
        head={[{ label: "নাম" }, { label: "ভাগ" }, { label: "পাওনা লাভ", isNumber: true }, { label: "তুলেছেন", isNumber: true }, { label: "খরচ দিয়েছেন", isNumber: true }, { label: "মেটানো", isNumber: true }, { label: "হাতে আছে", isNumber: true }, { label: "ফারাক", isNumber: true }]}
        data-share-rows
      >
        {shares.rows.map((row) => (
          <tr key={row._id} data-share-row={row.name}>
            <Cell strong>
              {row.name}
              {row.isMain && <span className="ml-1 text-xs font-normal text-muted">(মূল)</span>}
              {!row.isOwner && <span className="ml-1 text-xs font-normal text-muted">(সাবেক)</span>}
            </Cell>
            <Cell>{row.share || "—"}</Cell>
            <Cell isNumber>{formatMoney(row.entitled)}</Cell>
            <Cell isNumber>{formatMoney(row.collected)}</Cell>
            <Cell isNumber>{formatMoney(row.spent)}</Cell>
            <Cell isNumber>{formatMoney(row.settled)}</Cell>
            <Cell isNumber>{formatMoney(row.held)}</Cell>
            <Cell isNumber strong tone={row.difference > 0 ? "text-danger" : row.difference < 0 ? "text-success-foreground" : ""}>
              {row.difference > 0 ? `+${formatMoney(row.difference)}` : formatMoney(row.difference)}
            </Cell>
          </tr>
        ))}
      </Table>
      {shares.transfers.length === 0 ? (
        <p data-share-settled className="rounded-xl bg-primary-soft px-3 py-2.5 text-sm font-semibold text-primary">
          সবার হিসাব মিলে গেছে, কারো কাছে কারো পাওনা নেই।
        </p>
      ) : (
        <ul data-share-transfers className="flex flex-col gap-1.5">
          {shares.transfers.map((transfer, index) => (
            <li key={index} className="rounded-xl bg-warning-soft px-3 py-2.5 text-sm font-semibold text-warning-foreground">
              {nameOf(transfer.from)} → {nameOf(transfer.to)}-কে দেবেন {formatMoney(transfer.amount)}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">ফারাক + মানে ভাগের চেয়ে বেশি টাকা হাতে আছে (অন্যকে দেবেন), − মানে কম আছে (পাবেন)। Advance এর টাকা এই হিসাবে নেই।</p>
    </Section>
  );
};

// রিপোর্ট — পর্দায় ও PDF এ একই; বাড়ির নাম ও সময়কাল উপরে, যাকে দেবেন তিনি যেন বোঝেন
const ReportView = forwardRef(({ report }, ref) => {
  const { summary, range } = report;
  const housesLabel = report.isAll ? "সব বাড়ি" : report.houses.map(({ name, area }) => `${name}${area ? `, ${area}` : ""}`).join(" · ");
  const maxProfit = Math.max(...report.monthly.map(({ profit }) => Math.abs(profit)), 0);

  return (
    <div ref={ref} data-report className="flex flex-col gap-4 bg-background">
      <header className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <p className="text-lg font-bold">
          House<span className="text-primary">One</span> · হিসাবের রিপোর্ট
        </p>
        <h1 data-report-houses className="text-xl font-bold wrap-break-word">
          {housesLabel}
        </h1>
        <p data-report-range className="text-sm text-muted">
          {formatDate(`${range.from}T00:00:00`)} থেকে {formatDate(`${range.to}T00:00:00`)} · তৈরি {formatDate(report.generatedAt)}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="লাভ-ক্ষতি" note="টাকা হাতে পাওয়ার ও খরচ দেওয়ার তারিখ ধরে" data-report-pnl className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:col-span-2">
          <dl className="flex flex-col gap-1.5">
            <Line label="আয়" value="" strong />
            {summary.incomeBreakdown.map(({ kind, label, amount }) => (
              <Line key={kind} label={label} value={formatMoney(amount)} indent />
            ))}
            <Line label="মোট আয়" value={formatMoney(summary.income)} strong />
          </dl>
          <dl className="flex flex-col gap-1.5 border-t border-border pt-3">
            <Line label="খরচ" value="" strong />
            {summary.byCategory.length === 0 ? (
              <Line label="কোনো খরচ নেই" value={formatMoney(0)} indent />
            ) : (
              summary.byCategory.map(({ category, amount }) => <Line key={category} label={category} value={`−${formatMoney(amount)}`} indent />)
            )}
            {report.isAll && summary.generalExpenses > 0 && <p className="pl-3 text-xs text-muted">এর মধ্যে সব বাড়ির সাধারণ খরচ {formatMoney(summary.generalExpenses)}</p>}
            <Line label="মোট খরচ" value={`−${formatMoney(summary.expenses)}`} strong />
          </dl>
          <div className={cn("flex justify-between gap-3 rounded-xl px-3 py-2.5 text-lg font-bold", summary.profit < 0 ? "bg-danger-soft text-danger-foreground" : "bg-primary-soft text-primary")}>
            <span>{summary.profit < 0 ? "নিট ক্ষতি" : "নিট লাভ"}</span>
            <span data-report-profit className="tabular-nums">
              {formatMoney(summary.profit)}
            </span>
          </div>
        </Section>

        <Section title="আলাদা হিসাব" note="এগুলো আয় নয়, তবে জানা দরকার">
          <dl className="flex flex-col gap-2">
            <Line label="এখন বকেয়া" value={formatMoney(summary.dueNow)} tone={summary.dueNow > 0 ? "text-danger" : ""} />
            <Line label="হাতে থাকা Advance" value={formatMoney(summary.advanceHeld)} />
            <Line label="এই সময়ে Advance পেয়েছেন" value={formatMoney(summary.advanceReceived)} />
            <Line label="এই সময়ে Advance ফেরত" value={formatMoney(summary.advanceRefunded)} />
            <Line label="ভাড়ার রসিদ" value={`${toBanglaNumber(summary.receipts)}টি`} />
          </dl>
        </Section>
      </div>

      <Section title="মাসে মাসে">
        <Table head={[{ label: "মাস" }, { label: "আয়", isNumber: true }, { label: "খরচ", isNumber: true }, { label: "লাভ", isNumber: true }, { label: "" }]} data-report-monthly>
          {report.monthly.map((row) => (
            <tr key={row.month}>
              <Cell>{monthLabel(row.month)}</Cell>
              <Cell isNumber>{formatMoney(row.income)}</Cell>
              <Cell isNumber>{formatMoney(row.expenses)}</Cell>
              <Cell isNumber strong tone={signed(row.profit)}>
                {formatMoney(row.profit)}
              </Cell>
              {/* লাভের ছোট দাগ — একটাই সিরিজ, ক্ষতি হলে লাল ও "-" চিহ্নসহ সংখ্যা পাশে */}
              <td className="w-24 border-b border-border py-2" aria-hidden="true">
                <span className={cn("block h-2 rounded-r", row.profit < 0 ? "bg-danger" : "bg-primary")} style={{ width: `${maxProfit ? (Math.abs(row.profit) / maxProfit) * 100 : 0}%` }} />
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      {report.byHouse.length > 1 && (
        <Section title="বাড়ি অনুযায়ী" note={summary.generalExpenses > 0 ? "সব বাড়ির সাধারণ খরচ কোনো বাড়িতে ধরা হয়নি" : undefined}>
          <Table head={[{ label: "বাড়ি" }, { label: "আয়", isNumber: true }, { label: "খরচ", isNumber: true }, { label: "লাভ", isNumber: true }, { label: "ভরা", isNumber: true }, { label: "বকেয়া", isNumber: true }]} data-report-houses-table>
            {report.byHouse.map((house) => (
              <tr key={house._id}>
                <Cell strong>{house.name}</Cell>
                <Cell isNumber>{formatMoney(house.income)}</Cell>
                <Cell isNumber>{formatMoney(house.expenses)}</Cell>
                <Cell isNumber strong tone={signed(house.profit)}>
                  {formatMoney(house.profit)}
                </Cell>
                <Cell isNumber>
                  {toBanglaNumber(house.occupied)}/{toBanglaNumber(house.units)}
                </Cell>
                <Cell isNumber tone={house.due > 0 ? "text-danger" : ""}>
                  {formatMoney(house.due)}
                </Cell>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      <Section title="ভাড়াটিয়া অনুযায়ী" note="দেরি — ভাড়ার দিনের পরে দিয়েছেন বা এখনো দেননি">
        {report.byTenant.length === 0 ? (
          <p className="text-sm text-muted">এই সময়ে কোনো ভাড়াটিয়ার হিসাব নেই।</p>
        ) : (
          <Table head={[{ label: "ভাড়াটিয়া" }, { label: "ফ্ল্যাট" }, { label: "দিয়েছেন", isNumber: true }, { label: "বাকি", isNumber: true }, { label: "দেরি", isNumber: true }]} data-report-tenants>
            {report.byTenant.map((row) => (
              <tr key={row._id}>
                <Cell strong>
                  {row.tenantName}
                  {row.status === "Ended" && <span className="ml-1 text-xs font-normal text-muted">(সাবেক)</span>}
                </Cell>
                <Cell>
                  {row.unitName}, {row.propertyName}
                </Cell>
                <Cell isNumber>{formatMoney(row.paid)}</Cell>
                <Cell isNumber tone={row.due > 0 ? "text-danger" : ""}>
                  {formatMoney(row.due)}
                </Cell>
                <Cell isNumber tone={row.late > 0 ? "text-danger" : ""}>
                  {row.bills > 0 ? `${toBanglaNumber(row.late)}/${toBanglaNumber(row.bills)}` : "—"}
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {report.shares && <ShareSection shares={report.shares} />}

      <Section title="কে কত নিয়েছেন ও খরচ করেছেন">
        <Table head={[{ label: "নাম" }, { label: "ভাড়া নিয়েছেন", isNumber: true }, { label: "খরচ করেছেন", isNumber: true }]} data-report-people>
          {report.collectedBy.map((person) => (
            <tr key={person._id ?? person.name}>
              <Cell strong>{person.name || "—"}</Cell>
              <Cell isNumber>{formatMoney(person.collected)}</Cell>
              <Cell isNumber>{formatMoney(person.spent)}</Cell>
            </tr>
          ))}
        </Table>
      </Section>
    </div>
  );
});

ReportView.displayName = "ReportView";

export default ReportView;
