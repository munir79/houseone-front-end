import { useId } from "react";
import { cn } from "@/lib/cn";

const Textarea = ({ id, label, error, className, rows = 2, ...props }) => {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full resize-none rounded-lg border bg-surface px-3 py-2 text-base text-foreground transition-colors outline-none placeholder:text-muted",
          "focus:ring-2 focus:ring-primary-soft",
          error ? "border-danger" : "border-border focus:border-primary"
        )}
        {...props}
      />

      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
