"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", match: "exact" },
  { href: "/ops", label: "Operations", match: "ops" },
  { href: "/reporting", label: "Reporting", match: "reporting" },
  { href: "/pilot", label: "Pilot", match: "pilot" },
  { href: "/cases/new", label: "New Intake", match: "new-intake" },
];

function isActive(pathname: string, match: string) {
  if (match === "exact") return pathname === "/";
  if (match === "ops") return pathname === "/ops" || (pathname.startsWith("/cases/") && pathname !== "/cases/new");
  if (match === "new-intake") return pathname === "/cases/new";
  return pathname === `/${match}`;
}

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="topnav" aria-label="Primary navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isActive(pathname, item.match) ? "is-active" : undefined}
          aria-current={isActive(pathname, item.match) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
