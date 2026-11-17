import { useId } from "react";

const Checkbox = ({ id, label, description, ...props }) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <label htmlFor={checkboxId} className="flex min-h-11 cursor-pointer items-center gap-3">
      <input id={checkboxId} type="checkbox" className="h-5 w-5 shrink-0 accent-primary" {...props} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
};

export default Checkbox;
