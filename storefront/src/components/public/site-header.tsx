"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { FileText, Heart, LogOut, Menu, MessageSquare, Moon, Sun, User, X, Zap } from "lucide-react";
import { useTheme } from "@/components/ui/providers";
import { EditableText } from "@/components/editor/editable";

interface NavItem {
  id: number | string;
  label: string;
  href: string;
  open_in_new_tab?: boolean;
}

export function SiteHeader({
  siteTitle,
  logoUrl,
  navLinks,
}: {
  siteTitle: string;
  logoUrl: string;
  navLinks: NavItem[];
}) {
  const { data: session } = useSession();
  const { dark, toggleDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-14">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteTitle} className="h-8 w-auto object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg btn-accent">
              <Zap className="h-4 w-4" />
            </span>
          )}
          <EditableText
            as="span"
            className="text-base font-semibold tracking-tight"
            value={siteTitle}
            label="Site Title"
            cmsPath="/settings"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              target={link.open_in_new_tab ? "_blank" : undefined}
              rel={link.open_in_new_tab ? "noopener noreferrer" : undefined}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle light and dark theme"
            className="rounded-lg border border-line p-2 text-muted transition hover:bg-card hover:text-ink"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {session?.user ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                href="/wishlist"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-card"
              >
                <Heart className="h-3.5 w-3.5" />
                Wishlist
              </Link>
              <Link
                href="/my-enquiries"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-card"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Enquiries
              </Link>
              <Link
                href="/my-quotations"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-card"
              >
                <FileText className="h-3.5 w-3.5" />
                Quotations
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-card hover:text-ink"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-ink transition hover:bg-card sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg border border-line p-2 text-ink md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-card px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-ink"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
              {session?.user ? (
                <>
                  <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium">
                    My Wishlist
                  </Link>
                  <Link href="/my-enquiries" onClick={() => setMobileOpen(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium">
                    My Enquiries
                  </Link>
                  <Link href="/my-quotations" onClick={() => setMobileOpen(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium">
                    My Quotations
                  </Link>
                  <button type="button" onClick={() => void signOut({ callbackUrl: "/" })} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted">
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-accent rounded-lg px-4 py-2 text-xs font-medium">
                  Sign in / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
