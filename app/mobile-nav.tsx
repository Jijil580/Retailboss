"use client";

import {
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  House,
  LogOut,
  Menu,
  PackagePlus,
  ReceiptText,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const mainLinks = [
  { href: "/", label: "Home", icon: House },
  { href: "/pos", label: "Sell", icon: ShoppingBag },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/purchases", label: "Purchase", icon: PackagePlus },
];

const moreLinks = [
  { href: "/sales", label: "Sales history", icon: ChartNoAxesCombined },
  { href: "/expenses", label: "Expenses", icon: CircleDollarSign },
  { href: "/suppliers", label: "Suppliers", icon: Store },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Bill settings", icon: Settings },
  { href: "/products", label: "Barcode labels", icon: ReceiptText },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  if (pathname === "/login" || pathname.startsWith("/invoice/")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const moreActive = moreLinks.some(({ href }) => isActive(href));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <nav className="mobile-app-nav" aria-label="Mobile navigation">
        {mainLinks.map(({ href, label, icon: Icon }) => (
          <Link
            className={isActive(href) ? "active" : ""}
            href={href}
            key={href}
          >
            <span><Icon size={20} strokeWidth={2.2} /></span>
            <small>{label}</small>
          </Link>
        ))}
        <button
          className={moreOpen || moreActive ? "active" : ""}
          onClick={() => setMoreOpen((open) => !open)}
          type="button"
        >
          <span>{moreOpen ? <X size={20} /> : <Menu size={20} />}</span>
          <small>More</small>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-more-layer">
          <button
            aria-label="Close menu"
            className="mobile-more-backdrop"
            onClick={() => setMoreOpen(false)}
            type="button"
          />
          <section className="mobile-more-sheet" aria-label="More options">
            <div className="mobile-more-handle" />
            <header>
              <div>
                <strong>Shape of You</strong>
                <small>Iritty, Kannur, Kerala</small>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </header>
            <div className="mobile-more-grid">
              {moreLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  className={isActive(href) ? "active" : ""}
                  href={href}
                  key={`${href}-${label}`}
                >
                  <span><Icon size={21} /></span>
                  <strong>{label}</strong>
                </Link>
              ))}
            </div>
            <button className="mobile-logout" onClick={logout} type="button">
              <LogOut size={18} />
              Sign out
            </button>
          </section>
        </div>
      )}
    </>
  );
}
