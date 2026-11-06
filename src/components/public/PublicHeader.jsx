"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";
import Logo from "@/components/ui/Logo";
import { useAuthToken } from "@/hooks/useAuthToken";

const links = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
];

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const token = useAuthToken();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" aria-label="HouseOne home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {token ? (
            <LinkButton href="/dashboard">Go to Dashboard</LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost">
                Sign In
              </LinkButton>
              <LinkButton href="/register">Get Started</LinkButton>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          className="md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-primary-soft"
            >
              {label}
            </Link>
          ))}

          <div className="mt-2 flex flex-col gap-2">
            {token ? (
              <LinkButton href="/dashboard" fullWidth onClick={closeMenu}>
                Go to Dashboard
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/login" variant="outline" fullWidth onClick={closeMenu}>
                  Sign In
                </LinkButton>
                <LinkButton href="/register" fullWidth onClick={closeMenu}>
                  Get Started
                </LinkButton>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default PublicHeader;
