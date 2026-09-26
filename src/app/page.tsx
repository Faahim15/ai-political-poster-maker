"use client";
import { useEffect, useState } from "react";
import { FileEdit, Sparkles, Download } from "lucide-react";
import { api } from "@/lib/api";
import {
  OCCASIONS,
  type Occasion,
  type LayoutConfig,
  type PosterForm,
  type Template,
} from "@/types";
import PosterPreview from "@/components/PosterPreview";
import TemplateCard from "@/components/TemplateCard";
import ErrorBanner from "@/components/ui/ErrorBanner";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";

// Mirrors the 5 templates in backend/src/scripts/seedTemplates.ts — update both
// together if a template's background/positions change. Cycling through the
// real designs here (instead of one static gradient) shows visitors what the
// product actually produces, before they've picked anything.
const SAMPLES: { form: PosterForm; layoutConfig: LayoutConfig }[] = [
  {
    form: {
      name: "আপনার নাম",
      designation: "সভাপতি",
      party: "ইউনিয়ন কমিটি",
      area: "চট্টগ্রাম",
      occasionType: "victory",
      headline: "মহান বিজয় দিবস",
    },
    layoutConfig: {
      primaryColor: "#006a4e",
      secondaryColor: "#004d39",
      accentColor: "#e8383d",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790405320/poster-photos/g89zfoqyxdmbmdwxwqhw.jpg",
      photoSlotPosition: {
        xPct: 35,
        yPct: 36,
        widthPct: 30,
        heightPct: 29,
        borderRadiusPx: 24,
      },
      headlineYPct: 76,
      headlineTextColor: "white",
    },
  },
  {
    form: {
      name: "আপনার নাম",
      designation: "সাধারণ সম্পাদক",
      party: "শুভেচ্ছা বিনিময়",
      area: "ঢাকা",
      occasionType: "greeting",
      headline: "শুভ নববর্ষ",
    },
    layoutConfig: {
      primaryColor: "#123056",
      secondaryColor: "#0d213d",
      accentColor: "#1e4a7a",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790426674/poster-photos/t67l49eoig8uyjoopadv.jpg",
      photoSlotPosition: {
        xPct: 30,
        yPct: 45,
        widthPct: 40,
        heightPct: 35,
        borderRadiusPx: 20,
      },
      headlineYPct: 28,
      headlineTextColor: "dark",
    },
  },
  {
    form: {
      name: "আপনার নাম",
      designation: "প্রার্থী",
      party: "ইউনিয়ন পরিষদ",
      area: "চট্টগ্রাম",
      occasionType: "campaign",
      headline: "জাগো বাংলাদেশ",
    },
    layoutConfig: {
      primaryColor: "#0b5ea8",
      secondaryColor: "#08406f",
      accentColor: "#e8383d",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427193/poster-photos/xdvqjvtcquuhfble2ptj.jpg",
      photoSlotPosition: {
        xPct: 8,
        yPct: 15,
        widthPct: 41,
        heightPct: 17,
        borderRadiusPx: 12,
      },
      headlineYPct: 67,
      headlineTextColor: "dark",
      textZones: { name: { topPct: 79, heightPct: 8, textColor: "dark" } },
    },
  },
  {
    form: {
      name: "আপনার নাম",
      designation: "সভাপতি",
      party: "ঈদ শুভেচ্ছা",
      area: "সিলেট",
      occasionType: "festival",
      headline: "ঈদ মোবারক",
    },
    layoutConfig: {
      primaryColor: "#b46b35",
      secondaryColor: "#8a5027",
      accentColor: "#fabd66",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427238/poster-photos/dmourfo1tolocaxj7gt0.jpg",
      photoSlotPosition: {
        xPct: 26,
        yPct: 38,
        widthPct: 48,
        heightPct: 24,
        borderRadiusPx: 30,
      },
      headlineYPct: 14,
      headlineTextColor: "dark",
    },
  },
  {
    form: {
      name: "আপনার নাম",
      designation: "সদস্য",
      party: "ইউনিয়ন কমিটি",
      area: "রাজশাহী",
      occasionType: "condolence",
      headline: "গভীর শোক প্রকাশ",
    },
    layoutConfig: {
      primaryColor: "#8a8a8a",
      secondaryColor: "#2b2b2b",
      accentColor: "#5a5a5a",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427271/poster-photos/rnm01ftyvvjdeee38chy.jpg",
      photoSlotPosition: {
        xPct: 30.5,
        yPct: 25,
        widthPct: 39,
        heightPct: 39,
        borderRadiusPx: 20,
      },
      headlineYPct: 10,
      headlineTextColor: "white",
      textZones: {
        name: { topPct: 71, heightPct: 16, textColor: "white" },
        sub: { topPct: 88, heightPct: 8, textColor: "white" },
      },
    },
  },
];

const STEPS = [
  {
    icon: Sparkles,
    title: "টেমপ্লেট বেছে নিন",
    body: "উপলক্ষ অনুযায়ী একটি ডিজাইন পছন্দ করুন।",
  },
  {
    icon: FileEdit,
    title: "তথ্য ও ছবি দিন",
    body: "নাম, পদবি, দল আর সর্বোচ্চ ৩টি ছবি আপলোড করুন।",
  },
  {
    icon: Download,
    title: "ডাউনলোড করুন",
    body: "ছাপার উপযোগী ১২০০×১৬০০ পিক্সেল PNG পেয়ে যান।",
  },
];

type Result = { occ?: Occasion; items?: Template[]; err?: string };

export default function Home() {
  const [occ, setOcc] = useState<Occasion>();
  const [result, setResult] = useState<Result | null>(null);
  const [sampleIdx, setSampleIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .templates(occ)
      .then((items) => {
        if (!cancelled) setResult({ occ, items });
      })
      .catch((e) => {
        if (!cancelled) setResult({ occ, err: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [occ]);

  // Rotate the hero sample through all 5 real templates.
  useEffect(() => {
    const timer = setInterval(
      () => setSampleIdx((i) => (i + 1) % SAMPLES.length),
      4000,
    );
    return () => clearInterval(timer);
  }, []);

  const current = result?.occ === occ ? result : null;
  const items = current?.items ?? null;
  const err = current?.err ?? "";
  const activeSample = SAMPLES[sampleIdx];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h1 className="animate-rise-in-1 font-display text-4xl font-extrabold leading-tight md:text-6xl">
            এক মিনিটে ছাপার উপযোগী পোস্টার
          </h1>
          <p className="animate-rise-in-2 mt-5 max-w-lg text-lg text-ink/75">
            নাম, পদবি আর ছবি দিন। বিজয় দিবস, শোক, প্রচার বা শুভেচ্ছা — বাংলা
            লেখা ঠিক যেমন লিখবেন তেমনই বসবে, AI শুধু রং আর সাজ ঠিক করে দেয়।
          </p>
          <a href="#templates" className="btn animate-rise-in-3 mt-7">
            পোস্টার বানান
          </a>
        </div>

        <div className="animate-rise-in-2 mx-auto w-full max-w-xs">
          <div className="animate-float transition-transform duration-300 hover:-translate-y-1">
            <div key={sampleIdx} className="animate-fade-swap">
              <PosterPreview
                form={activeSample.form}
                photos={[]}
                layoutConfig={activeSample.layoutConfig}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-1.5">
            {SAMPLES.map((_, i) => (
              <button
                key={i}
                aria-label={`নমুনা ${i + 1} দেখুন`}
                onClick={() => setSampleIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === sampleIdx
                    ? "w-5 bg-flag"
                    : "w-1.5 bg-line hover:bg-flag/40"
                }`}
              />
            ))}
          </div>
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
                occ === o.id
                  ? "bg-flag text-white ring-flag"
                  : "bg-white ring-line hover:ring-flag"
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
                <li key={t._id}>
                  <TemplateCard template={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
