import { useId } from "react";
import { cn } from "@/lib/cn";

const Input = ({ id, label, error, suffix, compact = false, className, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-lg border bg-surface px-3 transition-colors",
          compact && "md:min-h-9",
          "focus-within:ring-2 focus-within:ring-primary-soft",
          error ? "border-danger" : "border-border focus-within:border-primary"
        )}
      >
        {/* ✅ text-base (16px) — এর কম হলে iPhone এ Input এ চাপলে Page Zoom হয়ে যায় */}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full min-w-0 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted",
            compact && "md:py-1 md:text-sm"
          )}
          {...props}
        />
        {suffix}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
