import { useId } from "react";
import { cn } from "@/lib/cn";

// Browser এর নিজের Select — মোবাইলে সবচেয়ে সহজ ও হালকা
const Select = ({ id, label, error, options, placeholder, compact = false, className, ...props }) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-11 w-full rounded-xl border bg-surface px-3 text-base text-foreground transition-colors outline-none",
          "focus:ring-2 focus:ring-primary-soft",
          compact && "md:min-h-9 md:text-sm",
          error ? "border-danger" : "border-border focus:border-primary"
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(({ value, label: optionLabel }) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
