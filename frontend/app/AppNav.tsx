"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { AegisPermission } from "./lib/rbac";

const navItems = [
  { href: "/", label: "Home", match: "exact" },
  { href: "/cases/new", label: "Intake", match: "new-intake", permission: "create_intake" },
  { href: "/ops", label: "Operations", match: "ops", permission: "view_cases" },
  { href: "/reporting", label: "Reporting", match: "reporting", permission: "view_reporting" },
  { href: "/pilot", label: "Pilot", match: "pilot" },
] satisfies {
  href: string;
  label: string;
  match: string;
  permission?: AegisPermission;
}[];

function isActive(pathname: string, match: string) {
  if (match === "exact") return pathname === "/";
  if (match === "ops") return pathname === "/ops" || (pathname.startsWith("/cases/") && pathname !== "/cases/new");
  if (match === "new-intake") return pathname === "/cases/new";
  return pathname === `/${match}`;
}

export default function AppNav() {
  const pathname = usePathname();
  const auth = useAuth();

  return (
    <nav className="topnav" aria-label="Primary navigation">
      {navItems
        .filter((item) => !item.permission || auth.can(item.permission))
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.match) ? "is-active" : undefined}
            aria-current={isActive(pathname, item.match) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      {auth.user ? (
        <>
          <span className="nav-user-pill" title={auth.user.email}>{auth.user.role.replace(/_/g, " ")}</span>
          <button
            type="button"
            className="nav-logout-button"
            onClick={() => {
              void auth.logout();
            }}
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className={isActive(pathname, "login") ? "is-active" : undefined}
          aria-current={isActive(pathname, "login") ? "page" : undefined}
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
