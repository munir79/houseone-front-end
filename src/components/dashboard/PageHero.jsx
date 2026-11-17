import Image from "next/image";
import { cn } from "@/lib/cn";

// Dashboard আর সম্পদের Overview — একই ছবি; ওপরে লেখা আর button, ডানে ছোট menu
const PageHero = ({ eyebrow, title, description, badge, actions, aside }) => (
  <section data-page-hero className="relative isolate overflow-hidden rounded-2xl border border-border bg-primary-soft shadow-card">
    <Image
      src="/images/dashboard/dahsboard1.jpg"
      alt=""
      fill
      priority
      sizes="(min-width: 768px) 80vw, 100vw"
      className="-z-20 object-cover object-[75%_58%]"
    />
    <div className="absolute inset-0 -z-10 bg-linear-to-r from-surface via-surface/90 to-surface/55 md:via-surface/75 md:to-transparent" />

    {aside && <div className="absolute top-3 right-3">{aside}</div>}

    <div className={cn("flex max-w-xl min-w-0 flex-col items-start gap-3 p-5 sm:p-7 lg:py-9", aside && "pr-14 sm:pr-16")}>
      {eyebrow && <span className="max-w-full rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary wrap-break-word">{eyebrow}</span>}
      <h1 className="max-w-full text-2xl font-bold tracking-tight wrap-break-word sm:text-4xl">{title}</h1>
      {badge}
      {description && <p className="text-base font-medium text-foreground/80">{description}</p>}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  </section>
);

export default PageHero;
