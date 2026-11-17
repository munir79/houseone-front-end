import { cn } from "@/lib/cn";

const Skeleton = ({ className }) => {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-primary-soft", className)} />;
};

export default Skeleton;
