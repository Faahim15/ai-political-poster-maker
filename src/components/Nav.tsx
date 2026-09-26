"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { session } from "@/lib/session";
import { useAuthState } from "@/hooks/useAuthState";

const linkClass = "rounded px-3 py-2 hover:bg-flag/10 focus-visible:outline-2 focus-visible:outline-flag";

export default function Nav() {
  const router = useRouter();
  const authed = useAuthState();
  const [open, setOpen] = useState(false);

  function logout() {
    session.clear();
    setOpen(false);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="প্রধান মেনু">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-flag">
          <span className="size-3.5 rounded-full bg-sun" aria-hidden />
          পোস্টার ঘর
        </Link>

        <button
          className="rounded p-2 hover:bg-flag/10 sm:hidden"
          aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <div className="hidden items-center gap-1 text-sm font-medium sm:flex">
          <Link href="/" className={linkClass}>টেমপ্লেট</Link>
          {authed ? (
            <>
              <Link href="/history" className={linkClass}>আমার পোস্টার</Link>
              <button className={`${linkClass} flex items-center gap-1.5`} onClick={logout}>
                <LogOut className="size-4" aria-hidden /> লগআউট
              </button>
            </>
          ) : (
            <Link href="/login" className={linkClass}>লগইন</Link>
          )}
        </div>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-line px-4 py-3 text-sm font-medium sm:hidden">
          <Link href="/" className={linkClass} onClick={() => setOpen(false)}>টেমপ্লেট</Link>
          {authed ? (
            <>
              <Link href="/history" className={linkClass} onClick={() => setOpen(false)}>আমার পোস্টার</Link>
              <button className={`${linkClass} flex items-center gap-1.5 text-left`} onClick={logout}>
                <LogOut className="size-4" aria-hidden /> লগআউট
              </button>
            </>
          ) : (
            <Link href="/login" className={linkClass} onClick={() => setOpen(false)}>লগইন</Link>
          )}
        </div>
      )}
    </header>
  );
}
