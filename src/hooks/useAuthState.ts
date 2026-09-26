"use client";
import { useSyncExternalStore } from "react";
import { session } from "@/lib/session";

/** Concurrent-safe read of "is someone logged in", kept live via session's subscribe. */
export function useAuthState(): boolean {
  return useSyncExternalStore(
    session.subscribe,
    () => !!session.token(),
    () => false,
  );
}
