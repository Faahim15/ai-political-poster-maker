"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import ErrorBanner from "@/components/ui/ErrorBanner";

type Mode = "login" | "register";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [f, setF] = useState({ name: "", identifier: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const on = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = mode === "login" ? await api.login(f) : await api.register(f);
      session.save(r.token, r.user._id);
      router.push("/");
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-14">
      <div className="card w-full p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-flag/10 text-flag">
            {mode === "login" ? <LogIn className="size-5" /> : <UserPlus className="size-5" />}
          </span>
          <h1 className="font-display text-2xl font-bold">
            {mode === "login" ? "লগইন করুন" : "নতুন অ্যাকাউন্ট খুলুন"}
          </h1>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <Field label="আপনার নাম" required>
              {(id) => (
                <input id={id} required className="field" value={f.name} onChange={on("name")} autoComplete="name" />
              )}
            </Field>
          )}
          <Field label="ইমেইল বা মোবাইল নম্বর" required>
            {(id) => (
              <input id={id} required className="field" value={f.identifier} onChange={on("identifier")} autoComplete="username" />
            )}
          </Field>
          <Field label="পাসওয়ার্ড" required hint="কমপক্ষে ৬ অক্ষর">
            {(id) => (
              <input
                id={id}
                required
                minLength={6}
                type="password"
                className="field"
                value={f.password}
                onChange={on("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            )}
          </Field>

          {err && <ErrorBanner>{err}</ErrorBanner>}

          <Button className="w-full" loading={busy}>
            {mode === "login" ? "লগইন করুন" : "অ্যাকাউন্ট খুলুন"}
          </Button>
        </form>

        <button
          className="mt-5 text-sm text-flag underline underline-offset-2"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
        >
          {mode === "login" ? "অ্যাকাউন্ট নেই? নতুন খুলুন" : "অ্যাকাউন্ট আছে? লগইন করুন"}
        </button>
      </div>
    </main>
  );
}
