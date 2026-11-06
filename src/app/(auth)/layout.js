import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import GuestGuard from "@/components/auth/GuestGuard";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";

const highlights = ["Track every flat and tenant", "Monthly bills in one click", "Send receipts on WhatsApp"];

export default function AuthLayout({ children }) {
  return (
    <GuestGuard>
      <div className="flex min-h-screen">
        <aside className="hidden w-5/12 flex-col justify-between bg-linear-to-b from-sidebar to-sidebar-end p-10 lg:flex">
          <Link href="/" className="w-fit">
            <Logo showTagline light />
          </Link>

          <div>
            <h2 className="text-3xl leading-tight font-bold text-sidebar-foreground">
              Manage your houses, tenants and rent in one place
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sidebar-foreground/90">
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <span />
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-center lg:hidden">
              <Link href="/">
                <Logo showTagline />
              </Link>
            </div>
            <Card className="sm:p-8">{children}</Card>
          </div>
        </main>
      </div>
    </GuestGuard>
  );
}
