"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Close, Menu } from "./Icons";

export default function Header({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <header className={`header${scrolled ? " scrolled" : ""}`}>
      <div className="wrap">
        <Link href="/" className="brand" aria-label="gxoeditz home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/avatar.jpg" alt="" width={34} height={34} />
          gxoeditz!
        </Link>
        <button className="menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <Close size={24} /> : <Menu size={24} />}
        </button>
        <nav className={`nav${open ? " open" : ""}`}>
          <Link href="/#work">Work</Link>
          <Link href="/#courses">Courses</Link>
          <Link href="/book">1-1 Mentoring</Link>
          <Link href="/apply">Join the team</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
          {signedIn ? (
            <Link href="/dashboard" className="btn sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="btn sm">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
