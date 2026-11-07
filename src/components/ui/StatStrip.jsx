import Skeleton from "./Skeleton";
import { cn } from "@/lib/cn";

const COLUMNS = { 4: "xl:grid-cols-4", 6: "lg:grid-cols-3 2xl:grid-cols-6" };

const TONES = {
  green: "bg-primary text-primary-foreground",
  violet: "bg-violet text-primary-foreground",
  blue: "bg-info text-primary-foreground",
  amber: "bg-warning text-primary-foreground",
  red: "bg-danger text-primary-foreground",
};

// সংখ্যার কার্ড — গোল রঙিন আইকন, নাম ও মান
const StatStrip = ({ items, isLoading = false }) => {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", COLUMNS[items.length])}>
      {items.map(({ key, label, value, hint, icon: Icon, tone = "green", onClick }) => {
        const Box = onClick ? "button" : "div";
        return (
        <Box
          key={key}
          type={onClick ? "button" : undefined}
          data-stat={key}
          onClick={onClick}
          className={cn(
            "flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left shadow-card sm:flex-row sm:items-center sm:gap-3 sm:p-4",
            onClick && "transition-colors hover:border-primary"
          )}
        >
          {Icon && (
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11", TONES[tone])}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold wrap-break-word text-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-7 w-14" />
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p data-value className="text-xl font-bold tracking-tight wrap-break-word tabular-nums sm:text-2xl">
                  {value}
                </p>
                {hint && <span className="text-sm font-medium text-muted">{hint}</span>}
              </div>
            )}
          </div>
        </Box>
        );
      })}
    </div>
  );
};

export default StatStrip;
