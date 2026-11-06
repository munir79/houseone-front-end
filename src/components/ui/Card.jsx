import { cn } from "@/lib/cn";

// flush — ছবি যখন Card এর ধার পর্যন্ত যাবে
const Card = ({ children, className, flush = false, ...props }) => {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-surface shadow-card", !flush && "p-4 sm:p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
