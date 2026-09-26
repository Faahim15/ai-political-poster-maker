This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: node_modules, dist, coverage, .git, uploads, logs, *.log, *.png, *.jpg, *.jpeg, *.svg, *.pdf
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
public/
  .gitkeep
src/
  app/
    create/
      page.tsx
    history/
      page.tsx
    login/
      page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    ui/
      Badge.tsx
      Button.tsx
      EmptyState.tsx
      ErrorBanner.tsx
      Field.tsx
      Skeleton.tsx
      Spinner.tsx
    Footer.tsx
    Nav.tsx
    PhotoUploader.tsx
    PosterCard.tsx
    PosterPreview.tsx
    TemplateCard.tsx
  hooks/
    useAuthState.ts
    useRequireAuth.ts
  lib/
    api.ts
    session.ts
  types/
    index.ts
.env.example
.gitignore
next.config.ts
package.json
postcss.config.mjs
README.md
tsconfig.json
```

# Files

## File: public/.gitkeep
```

```

## File: src/app/create/page.tsx
```typescript
"use client";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Lock, RefreshCw, Sparkles } from "lucide-react";
import { api, downloadImage } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { OCCASIONS, type Poster, type PosterForm, type Template } from "@/types";
import PosterPreview from "@/components/PosterPreview";
import PhotoUploader, { type Photo } from "@/components/PhotoUploader";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import ErrorBanner from "@/components/ui/ErrorBanner";
import StatusBadge from "@/components/ui/Badge";

const empty: PosterForm = {
  name: "",
  designation: "",
  party: "",
  area: "",
  occasionType: "victory",
  headline: "",
};

// The current /api/templates response doesn't include layoutConfig.photoSlots yet
// (see template.controller.ts's .select(...)) — default to 3 and this will pick
// up the real per-template limit automatically once that field is exposed.
const DEFAULT_MAX_PHOTOS = 3;

function Create() {
  useRequireAuth();
  const templateId = useSearchParams().get("template");

  const [template, setTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState(empty);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [poster, setPoster] = useState<Poster | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof PosterForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!templateId) return;
    api
      .template(templateId)
      .then((t) => {
        setTemplate(t);
        setForm((f) => ({ ...f, occasionType: t.occasionType }));
      })
      .catch(() => setError("টেমপ্লেট লোড করা যায়নি।"));
  }, [templateId]);

  // Poll while the backend's Gemini → Puppeteer → Cloudinary pipeline runs (poster.service.ts).
  const posterId = poster?._id;
  const status = poster?.status;
  useEffect(() => {
    if (!posterId || status !== "generating") return;
    const timer = setInterval(async () => {
      try {
        const p = await api.poster(posterId);
        setPoster(p);
        if (p.status !== "generating") {
          setBusy(false);
          if (p.status === "failed") setError("পোস্টার তৈরি হয়নি। আবার চেষ্টা করুন।");
        }
      } catch {
        // transient network hiccup — try again on the next tick
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [posterId, status]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!templateId) return setError("প্রথমে একটি টেমপ্লেট বেছে নিন।");
    if (photos.some((p) => !p.url)) return setError("ছবি আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন।");

    setBusy(true);
    try {
      setPoster(
        poster
          ? await api.regenerate(poster._id, form)
          : await api.createPoster({ templateId, formData: form, uploadedPhotoUrls: photos.map((p) => p.url!) }),
      );
    } catch (x) {
      setError((x as Error).message);
      setBusy(false);
    }
  }

  const done = poster?.status === "completed" && poster.generatedImageUrl;
  const noRetries = poster?.retriesLeft === 0;
  // Regenerate only re-sends formData (see poster.controller.ts), so the original
  // photos can't change after the first generation — lock the uploader once it exists.
  const photosLocked = !!poster;

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_400px]">
      <form onSubmit={submit} className="space-y-5">
        <h1 className="font-display text-3xl font-bold">পোস্টারের তথ্য দিন</h1>
        {!templateId && (
          <ErrorBanner>
            কোনো টেমপ্লেট বাছা হয়নি। <Link href="/" className="underline">টেমপ্লেট বেছে নিন</Link>
          </ErrorBanner>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="নাম" required>
            {(id) => <input id={id} required className="field" value={form.name} onChange={set("name")} />}
          </Field>
          <Field label="পদবি" required hint="যেমন: সাধারণ সম্পাদক">
            {(id) => <input id={id} required className="field" value={form.designation} onChange={set("designation")} />}
          </Field>
          <Field label="দল / সংগঠন" required>
            {(id) => <input id={id} required className="field" value={form.party} onChange={set("party")} />}
          </Field>
          <Field label="ইউনিয়ন / থানা / জেলা">
            {(id) => <input id={id} className="field" value={form.area} onChange={set("area")} />}
          </Field>
          <Field label="উপলক্ষ">
            {(id) => (
              <select id={id} className="field" value={form.occasionType} onChange={set("occasionType")}>
                {OCCASIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.bn}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="শিরোনাম" required hint={`${form.headline.length}/40 অক্ষর`}>
            {(id) => (
              <input id={id} required maxLength={40} className="field" value={form.headline} onChange={set("headline")} placeholder="যেমন: মহান বিজয় দিবস" />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1 flex items-center gap-1.5 font-medium">
            ছবি
            {photosLocked && <Lock className="size-3.5 text-ink/40" aria-label="regenerate করলে ছবি বদলানো যাবে না" />}
          </legend>
          <PhotoUploader
            photos={photos}
            onChange={setPhotos}
            max={template?.layoutConfig?.photoSlots ?? DEFAULT_MAX_PHOTOS}
            disabled={photosLocked}
            onError={setError}
          />
          {photosLocked && (
            <p className="mt-1 text-xs text-ink/50">আবার তৈরি করলে এই ছবিগুলোই থাকবে, শুধু লেখা বদলাবে।</p>
          )}
        </fieldset>

        <div aria-live="polite" className="min-h-6 space-y-2">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {poster && <StatusBadge status={poster.status} />}
        </div>

        <Button loading={busy} disabled={noRetries}>
          {poster ? <RefreshCw className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
          {poster ? "আবার তৈরি করুন" : "পোস্টার তৈরি করুন"}
        </Button>
        {poster?.retriesLeft !== undefined && (
          <p className="text-sm text-ink/60">
            {noRetries ? "আর নতুন করে তৈরি করার সুযোগ নেই।" : `আরও ${poster.retriesLeft} বার আবার তৈরি করতে পারবেন।`}
          </p>
        )}
      </form>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="mx-auto max-w-sm">
          {done ? (
            <div className="relative aspect-3/4 w-full overflow-hidden shadow-2xl ring-1 ring-black/10">
              <Image src={poster.generatedImageUrl!} alt="তৈরি পোস্টার" fill sizes="400px" className="object-cover" />
            </div>
          ) : (
            <PosterPreview form={form} photos={photos.map((p) => p.preview)} maxSlots={template?.layoutConfig?.photoSlots ?? DEFAULT_MAX_PHOTOS} />
          )}
          <p className="mt-3 text-sm text-ink/60">
            {done ? "আপনার পোস্টার প্রস্তুত, ১২০০×১৬০০ পিক্সেল রেজোলিউশনে।" : "এটি আনুমানিক প্রিভিউ। চূড়ান্ত পোস্টার ছাপার মাপে তৈরি হবে।"}
          </p>
          {done && (
            <Button className="mt-3 w-full" onClick={() => downloadImage(poster.generatedImageUrl!, `poster-${poster._id}.png`)}>
              <Download className="size-4" aria-hidden /> PNG ডাউনলোড করুন
            </Button>
          )}
        </div>
      </aside>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Create />
    </Suspense>
  );
}
```

## File: src/app/history/page.tsx
```typescript
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";
import { api, downloadImage } from "@/lib/api";
import { session } from "@/lib/session";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { Poster } from "@/types";
import PosterCard from "@/components/PosterCard";
import ErrorBanner from "@/components/ui/ErrorBanner";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

export default function History() {
  useRequireAuth();
  const [list, setList] = useState<Poster[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const userId = session.userId();
    if (userId) api.history(userId).then(setList).catch((e) => setErr(e.message));
  }, []);

  async function handleDelete(p: Poster) {
    if (!confirm("এই পোস্টারটি মুছে ফেলবেন?")) return;
    try {
      await api.remove(p._id);
      setList((l) => l!.filter((x) => x._id !== p._id));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">আমার পোস্টার</h1>

      {err && <div className="mt-4"><ErrorBanner>{err}</ErrorBanner></div>}
      {list === null && !err && <div className="mt-6"><SkeletonGrid /></div>}

      {list?.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={ImageOff}
            title="এখনো কোনো পোস্টার বানানো হয়নি"
            description="একটি টেমপ্লেট বেছে আপনার প্রথম পোস্টার তৈরি করুন।"
            action={
              <Link href="/">
                <Button size="sm"><Sparkles className="size-3.5" aria-hidden /> প্রথম পোস্টার বানান</Button>
              </Link>
            }
          />
        </div>
      )}

      {list && list.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
          {list.map((p) => (
            <PosterCard
              key={p._id}
              poster={p}
              onDelete={handleDelete}
              onDownload={(poster) => downloadImage(poster.generatedImageUrl!, `poster-${poster._id}.png`)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
```

## File: src/app/login/page.tsx
```typescript
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
```

## File: src/app/globals.css
```css
@import "tailwindcss";

@theme {
  --color-ink: #10231b;
  --color-paper: #f6f8f4;
  --color-line: #dbe3dc;
  --color-flag: #006a4e;
  --color-flag-dark: #004d39;
  --color-sun: #e8383d;
  --font-sans: var(--font-ui), system-ui, sans-serif;
  --font-display: var(--font-serif), serif;
}

body {
  background: var(--color-paper);
  color: var(--color-ink);
}

@layer components {
  .field {
    @apply w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-flag;
  }
  .card {
    @apply rounded-lg bg-white ring-1 ring-line;
  }
  /* For link-styled CTAs (an <a>, not a <button>) — the ui/Button component
     covers every actual <button> in the app. */
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-flag px-5 py-2.5 font-semibold text-white transition hover:bg-flag-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flag;
  }
}

/* One deliberate entrance for the hero on first paint — not repeated per-section/card. */
@keyframes rise-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-rise-in {
  animation: rise-in 0.5s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

## File: src/app/layout.tsx
```typescript
import type { Metadata } from "next";
import { Hind_Siliguri, Noto_Serif_Bengali } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const ui = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});
const serif = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["700", "800"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "পোস্টার ঘর — ছাপার উপযোগী রাজনৈতিক পোস্টার",
  description: "নাম, পদবি ও ছবি দিয়ে এক মিনিটে বিজয় দিবস, শোক, প্রচার বা শুভেচ্ছার পোস্টার তৈরি করুন।",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${ui.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
```

## File: src/app/page.tsx
```typescript
"use client";
import { useEffect, useState } from "react";
import { FileEdit, Sparkles, Download } from "lucide-react";
import { api } from "@/lib/api";
import { OCCASIONS, type Occasion, type Template } from "@/types";
import PosterPreview from "@/components/PosterPreview";
import TemplateCard from "@/components/TemplateCard";
import ErrorBanner from "@/components/ui/ErrorBanner";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";

const sample = {
  name: "আপনার নাম",
  designation: "সভাপতি",
  party: "ইউনিয়ন কমিটি",
  area: "চট্টগ্রাম",
  occasionType: "victory" as const,
  headline: "মহান বিজয় দিবস",
};

const STEPS = [
  { icon: Sparkles, title: "টেমপ্লেট বেছে নিন", body: "উপলক্ষ অনুযায়ী একটি ডিজাইন পছন্দ করুন।" },
  { icon: FileEdit, title: "তথ্য ও ছবি দিন", body: "নাম, পদবি, দল আর সর্বোচ্চ ৩টি ছবি আপলোড করুন।" },
  { icon: Download, title: "ডাউনলোড করুন", body: "ছাপার উপযোগী ১২০০×১৬০০ পিক্সেল PNG পেয়ে যান।" },
];

// One fetch result tagged with the tab it belongs to, so a slow response for a
// tab the user has already left can never overwrite what's on screen.
type Result = { occ?: Occasion; items?: Template[]; err?: string };

export default function Home() {
  const [occ, setOcc] = useState<Occasion>();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .templates(occ)
      .then((items) => { if (!cancelled) setResult({ occ, items }); })
      .catch((e) => { if (!cancelled) setResult({ occ, err: e.message }); });
    return () => { cancelled = true; };
  }, [occ]);

  const current = result?.occ === occ ? result : null;
  const items = current?.items ?? null;
  const err = current?.err ?? "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div className="animate-rise-in">
          <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
            এক মিনিটে ছাপার উপযোগী পোস্টার
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink/75">
            নাম, পদবি আর ছবি দিন। বিজয় দিবস, শোক, প্রচার বা শুভেচ্ছা — বাংলা লেখা ঠিক
            যেমন লিখবেন তেমনই বসবে, AI শুধু রং আর সাজ ঠিক করে দেয়।
          </p>
          <a href="#templates" className="btn mt-7">
            পোস্টার বানান
          </a>
        </div>
        <div className="mx-auto w-full max-w-xs animate-rise-in">
          <PosterPreview form={sample} photos={[]} />
        </div>
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-flag/10 font-display text-lg font-bold text-flag">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-ink/60">{s.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="templates" className="mt-16 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold">টেমপ্লেট বেছে নিন</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[{ id: undefined, bn: "সব" }, ...OCCASIONS].map((o) => (
            <button
              key={o.bn}
              aria-pressed={occ === o.id}
              onClick={() => setOcc(o.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-2 focus-visible:outline-flag ${
                occ === o.id ? "bg-flag text-white ring-flag" : "bg-white ring-line hover:ring-flag"
              }`}
            >
              {o.bn}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {err && <ErrorBanner>{err}</ErrorBanner>}
          {!err && items === null && <SkeletonGrid />}
          {items?.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="এই উপলক্ষের কোনো টেমপ্লেট এখনো নেই"
              description="অন্য একটি উপলক্ষ বেছে দেখুন, বা কিছুদিন পর আবার আসুন।"
            />
          )}
          {items && items.length > 0 && (
            <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {items.map((t) => (
                <li key={t._id}><TemplateCard template={t} /></li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
```

## File: src/components/ui/Badge.tsx
```typescript
import type { PosterStatus } from "@/types";
import { STATUS_LABEL } from "@/types";
import { CheckCircle2, Loader2, XCircle, FileEdit, type LucideIcon } from "lucide-react";

const STYLE: Record<PosterStatus, string> = {
  draft: "bg-line text-ink/60",
  generating: "bg-flag/10 text-flag",
  completed: "bg-flag text-white",
  failed: "bg-sun/10 text-sun",
};
const ICON: Record<PosterStatus, LucideIcon> = {
  draft: FileEdit,
  generating: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

export default function StatusBadge({ status }: { status: PosterStatus }) {
  const Icon = ICON[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[status]}`}>
      <Icon className={`size-3.5 ${status === "generating" ? "animate-spin" : ""}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
```

## File: src/components/ui/Button.tsx
```typescript
import { forwardRef } from "react";
import Spinner from "./Spinner";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "sm";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flag " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-flag text-white hover:bg-flag-dark",
  ghost: "text-flag ring-1 ring-flag/30 hover:bg-flag/5",
  danger: "text-sun hover:bg-sun/10",
};
const sizes: Record<Size, string> = {
  md: "px-5 py-2.5",
  sm: "px-3 py-1.5 text-sm",
};

/** Shared button for the whole app: consistent focus ring, disabled state and a
 *  built-in loading spinner so pages don't re-implement "busy" styling each time. */
const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

export default Button;
```

## File: src/components/ui/EmptyState.tsx
```typescript
import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-14 text-center">
      <Icon className="size-9 text-ink/30" aria-hidden />
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink/60">{description}</p>}
      {action}
    </div>
  );
}
```

## File: src/components/ui/ErrorBanner.tsx
```typescript
import { AlertCircle } from "lucide-react";

export default function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-sun/10 p-3 text-sm text-sun">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
```

## File: src/components/ui/Field.tsx
```typescript
import { useId } from "react";

interface Props {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}

/** Labels + hint/error text around any input/select/textarea, so every field in the
 *  app lines up the same way without repeating the markup. */
export default function Field({ label, hint, error, required, children }: Props) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block font-medium">
        {label}
        {required && <span className="text-sun"> *</span>}
      </span>
      {children(id)}
      {hint && !error && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-sun">
          {error}
        </span>
      )}
    </label>
  );
}
```

## File: src/components/ui/Skeleton.tsx
```typescript
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line ${className}`} aria-hidden />;
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-3/4" />
      ))}
    </div>
  );
}
```

## File: src/components/ui/Spinner.tsx
```typescript
import { Loader2 } from "lucide-react";

export default function Spinner({ className = "size-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden />;
}
```

## File: src/components/Footer.tsx
```typescript
export default function Footer() {
  return (
    <footer className="border-t border-line py-8 text-center text-sm text-ink/60">
      <p>প্রচারে: পোস্টার ঘর · সব দল ও উপলক্ষের জন্য ছাপার উপযোগী পোস্টার</p>
    </footer>
  );
}
```

## File: src/components/Nav.tsx
```typescript
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
```

## File: src/components/PhotoUploader.tsx
```typescript
"use client";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { api } from "@/lib/api";
import Spinner from "./ui/Spinner";

export interface Photo {
  preview: string;
  url?: string;
}

type Updater = Photo[] | ((prev: Photo[]) => Photo[]);

interface Props {
  photos: Photo[];
  /** Accepts a React-style setState updater so each async upload can safely
   *  merge into whatever the array has become by the time it resolves. */
  onChange: (update: Updater) => void;
  max?: number;
  disabled?: boolean;
  onError?: (message: string) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function PhotoUploader({ photos, onChange, max = 3, disabled, onError }: Props) {
  const [dragOver, setDragOver] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files || disabled) return;
    const room = max - photos.length;
    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
        onError?.("শুধু ছবি দিন, আকার ৫ MB এর বেশি নয়।");
        continue;
      }
      const preview = URL.createObjectURL(file);
      onChange((prev) => [...prev, { preview }]);
      try {
        const { url } = await api.upload(file);
        onChange((prev) => prev.map((p) => (p.preview === preview ? { ...p, url } : p)));
      } catch {
        onChange((prev) => prev.filter((p) => p.preview !== preview));
        onError?.("ছবি আপলোড হয়নি, আবার দিন।");
      }
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((p) => (
          <div key={p.preview} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.preview}
              alt="আপলোড করা ছবি"
              className={`size-24 rounded-lg object-cover ${p.url ? "" : "opacity-50"}`}
            />
            {!p.url && (
              <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/10">
                <Spinner className="size-5 text-white" />
              </span>
            )}
            {!disabled && (
              <button
                type="button"
                aria-label="ছবি সরান"
                onClick={() => onChange(photos.filter((x) => x !== p))}
                className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-white hover:bg-black"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        ))}

        {!disabled && photos.length < max && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            className={`flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-xs text-ink/60 transition focus-within:ring-2 focus-within:ring-flag ${dragOver ? "border-flag bg-flag/5" : "border-line hover:border-flag"}`}
          >
            <ImagePlus className="size-5" aria-hidden />
            ছবি দিন
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-ink/50">সর্বোচ্চ {max}টি ছবি, প্রতিটি ৫ MB পর্যন্ত।</p>
    </div>
  );
}
```

## File: src/components/PosterCard.tsx
```typescript
import Image from "next/image";
import { Download, RotateCcw, Trash2 } from "lucide-react";
import type { Poster } from "@/types";
import StatusBadge from "./ui/Badge";
import Button from "./ui/Button";

interface Props {
  poster: Poster;
  onDownload: (poster: Poster) => void;
  onDelete: (poster: Poster) => void;
}

export default function PosterCard({ poster, onDownload, onDelete }: Props) {
  return (
    <li className="overflow-hidden rounded-lg bg-white ring-1 ring-line">
      <div className="relative aspect-3/4 bg-line">
        {poster.generatedImageUrl ? (
          <Image
            src={poster.generatedImageUrl}
            alt={poster.formData.headline}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-ink/30">
            <RotateCcw className="size-8 animate-spin" style={{ animationDuration: "3s" }} aria-hidden />
          </div>
        )}
        <div className="absolute left-2 top-2"><StatusBadge status={poster.status} /></div>
      </div>
      <div className="p-3">
        <p className="truncate font-semibold">{poster.formData.headline}</p>
        <p className="text-sm text-ink/60">{new Date(poster.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}</p>
        <div className="mt-2 flex gap-2">
          {poster.generatedImageUrl && (
            <Button variant="ghost" size="sm" onClick={() => onDownload(poster)}>
              <Download className="size-3.5" aria-hidden /> ডাউনলোড
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => onDelete(poster)}>
            <Trash2 className="size-3.5" aria-hidden /> মুছুন
          </Button>
        </div>
      </div>
    </li>
  );
}
```

## File: src/components/PosterPreview.tsx
```typescript
import type { Decoration, PosterForm } from "@/types";
import { DEFAULT_DECORATION, OCCASION_LABEL } from "@/types";

interface Props {
  form: PosterForm;
  photos: string[];
  /** Falls back to the same colors the backend uses when Gemini has no template
   *  palette to draw on (see gemini.service.ts FALLBACK). */
  decoration?: Decoration;
  maxSlots?: number;
}

export default function PosterPreview({ form, photos, decoration = DEFAULT_DECORATION, maxSlots = 3 }: Props) {
  const slots = (photos.length ? photos : [""]).slice(0, maxSlots);
  const subLine = [form.designation, form.party, form.area].filter(Boolean).join(", ");

  return (
    <div className="@container">
      <div
        role="img"
        aria-label="পোস্টারের প্রিভিউ"
        style={{ background: `linear-gradient(to bottom, ${decoration.secondaryColor}, ${decoration.primaryColor})` }}
        className="relative flex aspect-3/4 w-full flex-col overflow-hidden text-white shadow-2xl ring-1 ring-black/10"
      >
        <div
          style={{ background: decoration.accentColor }}
          className="absolute -right-[14%] -top-[9%] size-[52%] rounded-full"
          aria-hidden
        />
        <div className="relative flex justify-center gap-[3cqw] px-[6cqw] pt-[7cqw]">
          {slots.map((u, i) => (
            <div
              key={i}
              className="aspect-[4/5] w-[27cqw] overflow-hidden rounded-t-full bg-white/15 ring-[0.6cqw] ring-white/80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {u && <img src={u} alt="" className="size-full object-cover" />}
            </div>
          ))}
        </div>
        <h2 className="relative mt-auto wrap-break-word px-[6cqw] text-center font-display text-[11cqw] font-extrabold leading-[1.15] drop-shadow">
          {form.headline || "আপনার শিরোনাম"}
        </h2>
        <div className="relative mt-[5cqw] bg-white px-[5cqw] py-[3cqw] text-center text-ink">
          <p className="text-[4.6cqw] font-bold leading-tight">{form.name || "আপনার নাম"}</p>
          <p className="text-[3.2cqw] text-ink/70">{subLine || OCCASION_LABEL[form.occasionType]}</p>
          <p style={{ color: decoration.primaryColor }} className="mt-[1cqw] text-[2.8cqw] font-semibold">
            প্রচারে: {form.name || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
```

## File: src/components/TemplateCard.tsx
```typescript
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Template } from "@/types";
import { OCCASION_LABEL } from "@/types";

export default function TemplateCard({ template }: { template: Template }) {
  return (
    <Link
      href={`/create?template=${template._id}`}
      className="group block overflow-hidden rounded-lg ring-1 ring-line transition hover:ring-2 hover:ring-flag focus-visible:outline-2 focus-visible:outline-flag"
    >
      <div className="relative aspect-3/4 bg-line">
        <Image
          src={template.thumbnailUrl}
          alt={template.title}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {OCCASION_LABEL[template.occasionType]}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 bg-white p-3">
        <p className="truncate font-semibold">{template.title}</p>
        <ArrowUpRight className="size-4 shrink-0 text-flag opacity-0 transition group-hover:opacity-100" aria-hidden />
      </div>
    </Link>
  );
}
```

## File: src/hooks/useAuthState.ts
```typescript
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
```

## File: src/hooks/useRequireAuth.ts
```typescript
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
```

## File: src/lib/api.ts
```typescript
import { session } from "@/lib/session";
import type { Occasion, Poster, PosterForm, Template } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = session.token();
  const headers: Record<string, string> = {};
  if (!(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...init, headers });

  // Session expired mid-conversation: clear it, let useRequireAuth redirect on next render.
  if (res.status === 401 && token) session.clear();

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন");
  }
  return res.json();
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

type AuthResponse = { token: string; user: { _id: string; name: string } };

export const api = {
  register: (b: { name: string; identifier: string; password: string }) =>
    req<AuthResponse>("/auth/register", post(b)),
  login: (b: { identifier: string; password: string }) =>
    req<AuthResponse>("/auth/login", post(b)),

  templates: (occasion?: Occasion) =>
    req<Template[]>(`/templates${occasion ? `?occasion=${occasion}` : ""}`),
  template: (id: string) => req<Template>(`/templates/${id}`),

  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<{ url: string }>("/upload", { method: "POST", body: fd });
  },

  createPoster: (b: { templateId: string; formData: PosterForm; uploadedPhotoUrls: string[] }) =>
    req<Poster>("/posters", post(b)),
  poster: (id: string) => req<Poster>(`/posters/${id}`),
  history: (userId: string) => req<Poster[]>(`/posters/user/${userId}`),
  regenerate: (id: string, formData: PosterForm) =>
    req<Poster>(`/posters/${id}/regenerate`, post({ formData })),
  remove: (id: string) => req<{ ok: true }>(`/posters/${id}`, { method: "DELETE" }),
};

export async function downloadImage(url: string, filename: string) {
  const blob = await (await fetch(url)).blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

## File: src/lib/session.ts
```typescript
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
```

## File: src/types/index.ts
```typescript
export type Occasion = "victory" | "condolence" | "campaign" | "greeting" | "festival";

export const OCCASIONS: { id: Occasion; bn: string }[] = [
  { id: "victory", bn: "বিজয় দিবস" },
  { id: "condolence", bn: "শোক/স্মরণ" },
  { id: "campaign", bn: "নির্বাচনী প্রচার" },
  { id: "greeting", bn: "শুভেচ্ছা" },
  { id: "festival", bn: "ঈদ/উৎসব" },
];
export const OCCASION_LABEL: Record<Occasion, string> = Object.fromEntries(
  OCCASIONS.map((o) => [o.id, o.bn]),
) as Record<Occasion, string>;

/** Matches the backend's Gemini-suggested / fallback color scheme (gemini.service.ts). */
export interface Decoration {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}
export const DEFAULT_DECORATION: Decoration = {
  primaryColor: "#006a4e",
  secondaryColor: "#004d39",
  accentColor: "#e8383d",
};

export interface Template {
  _id: string;
  title: string;
  occasionType: Occasion;
  thumbnailUrl: string;
  /** Not returned by the current /api/templates projection; kept optional so the
   *  UI upgrades automatically if the backend starts including it (see README). */
  layoutConfig?: Decoration & { photoSlots: number };
}

export interface PosterForm {
  name: string;
  designation: string;
  party: string;
  area: string;
  occasionType: Occasion;
  headline: string;
}

export type PosterStatus = "draft" | "generating" | "completed" | "failed";

export interface Poster {
  _id: string;
  templateId: string;
  formData: PosterForm;
  uploadedPhotoUrls: string[];
  generatedImageUrl?: string;
  status: PosterStatus;
  retriesLeft: number;
  createdAt: string;
}

export const STATUS_LABEL: Record<PosterStatus, string> = {
  draft: "খসড়া",
  generating: "তৈরি হচ্ছে",
  completed: "প্রস্তুত",
  failed: "ব্যর্থ",
};
```

## File: .env.example
```
# URL of the Express backend's /api root (see the backend's app.ts / routes.ts)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## File: .gitignore
```
node_modules
.next
.env*.local
next-env.d.ts
```

## File: next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Cloudinary — where the backend uploads photos and generated posters (cloudinary.ts)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Local backend during development, e.g. http://localhost:5000/uploads/...
      { protocol: "http", hostname: "localhost", port: "5000" },
    ],
  },
};

export default nextConfig;
```

## File: package.json
```json
{
  "name": "poster-ghor-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

## File: postcss.config.mjs
```javascript
export default { plugins: { "@tailwindcss/postcss": {} } };
```

## File: README.md
```markdown
# পোস্টার ঘর — Frontend (Next.js + TypeScript + Tailwind v4)

## Run

    cp .env.example .env.local     # point this at the Express backend
    npm install
    npm run dev                    # http://localhost:3000

Run the backend alongside it (`npm run dev` in the backend repo, default
`http://localhost:5000`) and make sure its `CORS_ORIGIN` env var matches this
app's origin (`http://localhost:3000` by default).

## Structure

    src/
      app/                  routes (App Router)
        layout.tsx            fonts, <Nav/>, <Footer/>
        page.tsx              home: hero, "how it works", template library
        create/page.tsx        poster form, live preview, generate/regenerate, download
        history/page.tsx       saved posters
        login/page.tsx         login + register
        globals.css            Tailwind v4 theme tokens, .field/.card/.btn
      components/
        Nav.tsx, Footer.tsx
        PosterPreview.tsx      in-browser mirror of the backend's Puppeteer render
        PhotoUploader.tsx      drag & drop, per-photo upload state, slot limit
        TemplateCard.tsx       template grid item
        PosterCard.tsx         history grid item
        ui/                    Button, Field, Badge, Skeleton, EmptyState, ErrorBanner, Spinner
      hooks/
        useRequireAuth.ts       redirects to /login without a session
        useAuthState.ts         live "is logged in" via useSyncExternalStore
      lib/
        api.ts                  typed client for every backend route
        session.ts              JWT storage + auth-change event
      types/
        index.ts                Poster, Template, PosterForm, Occasion, ...

## Backend contract notes

- Auth, templates, upload, and poster endpoints match the Express routes in
  `routes.ts` exactly (`/auth`, `/templates`, `/upload`, `/posters`).
- `/api/templates` currently projects only `_id, title, occasionType,
  thumbnailUrl` (see `template.controller.ts`). The frontend's `Template` type
  also has an optional `layoutConfig` (colors + `photoSlots`) — if that
  projection is extended to include it, `PosterPreview` and `PhotoUploader`
  will automatically use the template's real palette and photo-slot limit
  instead of the current default (flag green/red, 3 slots) with no frontend
  changes needed.
- Regenerating a poster only resends `formData` (`poster.controller.ts`), so
  the original photos can't be swapped afterwards — the create page locks the
  photo uploader once a poster exists, to match that behavior.
```

## File: tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017", "lib": ["dom", "dom.iterable", "esnext"], "allowJs": false, "skipLibCheck": true,
    "strict": true, "noEmit": true, "esModuleInterop": true, "module": "esnext", "moduleResolution": "bundler",
    "resolveJsonModule": true, "isolatedModules": true, "jsx": "preserve", "incremental": true,
    "plugins": [{ "name": "next" }], "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
