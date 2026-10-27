"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string } | { section: string };

export default function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === pathname || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href + "/"));
  return (
    <aside className="sidebar">
      {items.map((it, i) =>
        "section" in it ? (
          <span key={i} className="label">{it.section}</span>
        ) : (
          <Link key={it.href} href={it.href} aria-current={active(it.href) ? "page" : undefined}>
            {it.label}
          </Link>
        ),
      )}
      <form action="/auth/signout" method="post" style={{ marginTop: 12 }}>
        <button className="btn ghost sm block" type="submit">Log out</button>
      </form>
    </aside>
  );
}
