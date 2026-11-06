import Skeleton from "./Skeleton";

// একটি প্যানেলে কয়েকটি সংখ্যা, পাতলা রেখা দিয়ে আলাদা
const StatStrip = ({ items, isLoading = false }) => {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card lg:grid-cols-4">
      {items.map(({ key, label, value, hint }) => (
        <div key={key} data-stat={key} className="min-w-0 bg-surface px-4 py-3 sm:px-5 sm:py-4">
          <p className="truncate text-xs font-medium text-muted">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-14" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <p data-value className="truncate text-2xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
              {hint && <span className="truncate text-xs text-muted">{hint}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatStrip;
