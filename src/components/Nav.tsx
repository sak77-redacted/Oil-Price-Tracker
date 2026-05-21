"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
  shortLabel?: string;
  ariaLabel?: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Oil" },
  { href: "/sugar", label: "Sugar" },
  {
    href: "/commodities",
    label: "Commodities",
    shortLabel: "Complex",
    ariaLabel: "Commodities — full complex view",
  },
];

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-baseline gap-2"
          aria-label="Compound Crisis Tracker home"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)] group-hover:text-white">
            Compound
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 group-hover:text-white">
            Crisis Tracker
          </span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.ariaLabel ?? link.label}
                className={`relative px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors sm:px-3 sm:text-sm sm:tracking-[0.16em] ${
                  active
                    ? "text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                <span className="sm:hidden">{link.shortLabel ?? link.label}</span>
                <span className="hidden sm:inline">{link.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 -bottom-px h-0.5 bg-[var(--accent)]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
