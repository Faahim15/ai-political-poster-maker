"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { session } from "@/lib/session";

/** Redirects to /login if there's no session, and again the instant one is cleared
 *  (e.g. a 401 from the API), without a manual refresh. */
export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    const check = () => {
      if (!session.token()) router.replace("/login");
    };
    check();
    return session.subscribe(check);
  }, [router]);
}
