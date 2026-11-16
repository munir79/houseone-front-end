import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { APP_NAME } from "@/lib/brand";

const columns = [
  {
    title: "Product",
    links: [
      { label: "To-Let", href: "/to-let" },
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/register" },
    ],
  },
];

const PublicFooter = () => {
  return (
    <footer className="bg-linear-to-b from-sidebar to-sidebar-end text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4 md:px-6">
        <div className="sm:col-span-2">
          <Logo showTagline light />
          <p className="mt-4 max-w-sm text-sm text-sidebar-foreground/70">
            Simple house, tenant and rent management for landlords in Bangladesh.
          </p>
        </div>

        {columns.map(({ title, links }) => (
          <div key={title}>
            <h3 className="text-sm font-semibold">{title}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {links.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-sidebar-foreground/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-sidebar-foreground/60 md:px-6">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default PublicFooter;
