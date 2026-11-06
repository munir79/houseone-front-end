import { ArrowRight, BellRing, Building2, CalendarClock, ReceiptText, Users, Wallet } from "lucide-react";
import HeroPreview from "@/components/public/HeroPreview";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";

const features = [
  {
    icon: Building2,
    title: "Houses and flats",
    text: "Keep every house and flat in one place, each with its own rent, even in different locations.",
  },
  {
    icon: Users,
    title: "Tenants and members",
    text: "Family, bachelor, sublet or office. See who lives where, since when, and everything you handed over.",
  },
  {
    icon: Wallet,
    title: "Rent tracking",
    text: "See at a glance who paid, who paid part, who has not paid, and how much is still due this month.",
  },
  {
    icon: ReceiptText,
    title: "Monthly receipts",
    text: "Use one template for similar flats, then send receipts on WhatsApp or email instead of writing on paper.",
  },
  {
    icon: BellRing,
    title: "Shared ownership",
    text: "Own a flat with family? Every owner sees the same live status on their own dashboard.",
  },
  {
    icon: CalendarClock,
    title: "Upcoming vacancies",
    text: "Know which flats will be free next month, so you can find a new tenant before the old one leaves.",
  },
];

const steps = [
  { title: "Add your house", text: "Enter your floors and flats. HouseOne creates the list for you." },
  { title: "Add your tenants", text: "Fill it in yourself, or send a form link for the tenant to complete." },
  { title: "Collect rent and send receipts", text: "Create all bills with one click every month and track what comes in." },
];

export default function HomePage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="bg-linear-to-b from-primary-soft to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-2">
          <div>
            <Badge className="bg-surface">Made for landlords in Bangladesh</Badge>
            <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Your flats, tenants and rent in <span className="text-primary">one dashboard</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
              Stop keeping rent in notebooks. Track every flat, see who has not paid, and send monthly receipts from
              your phone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/register" size="lg">
                Start Free for 1 Month
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/#features" size="lg" variant="outline">
                See Features
              </LinkButton>
            </div>
            <p className="mt-3 text-sm text-muted">All features are free for your first month.</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            {/* নিজের ছবি দিতে: public/images/hero.png রাখুন, উপরে Image Import করুন, তারপর <HeroPreview /> এর বদলে এই লাইন দিন
                <Image src="/images/hero.png" alt="Apartment building" width={640} height={520} priority className="rounded-3xl" /> */}
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="scroll-mt-20 py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything a landlord needs to remember</h2>
            <p className="mt-3 text-muted">The work you do in a notebook today, done for you every month.</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how-it-works" className="scroll-mt-20 bg-surface py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Start in three simple steps</h2>
            <p className="mt-3 text-muted">No training needed. If you can use WhatsApp, you can use HouseOne.</p>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(({ title, text }, index) => (
              <li key={title} className="flex gap-4 md:flex-col">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Call to action ===== */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="rounded-3xl bg-linear-to-r from-sidebar to-primary px-6 py-10 text-center md:py-14">
            <h2 className="text-3xl font-bold tracking-tight text-sidebar-foreground">
              Ready to leave the rent notebook behind?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sidebar-foreground/80">
              Try every feature free for one month. Add as many houses and flats as you need.
            </p>
            <LinkButton href="/register" size="lg" variant="outline" className="mt-6">
              Create Your Free Account
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
