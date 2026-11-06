import { TrendingUp } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const summary = [
  { label: "Expected", value: "৳2,80,000" },
  { label: "Collected", value: "৳2,45,000" },
  { label: "Due", value: "৳35,000" },
];

const flats = [
  { name: "3rd Floor - B", amount: "৳20,000", status: "Paid", variant: "success" },
  { name: "5th Floor - A", amount: "৳18,000", status: "Partial", variant: "warning" },
  { name: "2nd Floor - A", amount: "৳15,000", status: "Unpaid", variant: "danger" },
];

// আসল Dashboard দেখতে কেমন হবে তার নমুনা — সব তথ্য Sample
const HeroPreview = () => {
  return (
    <Card className="w-full max-w-md sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Rent Overview</p>
          <p className="text-xs text-muted">November</p>
        </div>
        <Badge>Sample</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {summary.map(({ label, value }) => (
          <div key={label} className="min-w-0 rounded-xl bg-background p-2 sm:p-2.5">
            <p className="text-xs text-muted">{label}</p>
            {/* ✅ টাকার অঙ্ক কখনো কাটা যাবে না */}
            <p className="mt-0.5 text-xs font-bold whitespace-nowrap sm:text-sm">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-medium text-success-foreground">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            Collected this month
          </span>
          <span className="font-semibold">88%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-primary-soft">
          <div className="h-full w-[88%] rounded-full bg-primary" />
        </div>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {flats.map(({ name, amount, status, variant }) => (
          <li key={name} className="flex items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-xs text-muted">{amount}</p>
            </div>
            <Badge variant={variant}>{status}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default HeroPreview;
