import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "bg-primary-soft text-primary hover:bg-border",
  outline: "border border-border bg-surface text-foreground shadow-card hover:bg-background",
  ghost: "text-foreground hover:bg-primary-soft",
  danger: "bg-danger text-primary-foreground hover:opacity-90",
};

// ✅ মোবাইলে সবচেয়ে ছোট Button ও 44px, আঙুল দিয়ে চাপার জন্য — Desktop এ ছোট
const sizes = {
  sm: "min-h-11 px-3 text-sm md:min-h-9",
  md: "min-h-11 px-4 text-sm md:min-h-10",
  lg: "min-h-12 px-5 text-base",
};

// LinkButton ও একই Style ব্যবহার করে
export const buttonClasses = ({ variant = "primary", size = "md", fullWidth = false, className } = {}) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );

const Button = ({
  children,
  type = "button",
  variant,
  size,
  isLoading = false,
  fullWidth,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

export default Button;
