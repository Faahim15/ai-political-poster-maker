const read = (k: string) => (typeof window === "undefined" ? null : localStorage.getItem(k));
const notify = () => window.dispatchEvent(new Event("auth-change"));

/** Thin wrapper around localStorage for the auth token, so every reader
 *  (Nav, useRequireAuth, ...) stays in sync via a single "auth-change" event. */
export const session = {
  token: () => read("token"),
  userId: () => read("userId"),
  save: (token: string, userId: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    notify();
  },
  clear: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    notify();
  },
  subscribe: (fn: () => void) => {
    window.addEventListener("auth-change", fn);
    return () => window.removeEventListener("auth-change", fn);
  },
};
