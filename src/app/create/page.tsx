"use client";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Lock, RefreshCw, Sparkles } from "lucide-react";
import { api, downloadImage } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  OCCASIONS,
  type Poster,
  type PosterForm,
  type Template,
} from "@/types";
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

  const set =
    (k: keyof PosterForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
          if (p.status === "failed")
            setError("পোস্টার তৈরি হয়নি। আবার চেষ্টা করুন।");
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
    if (photos.some((p) => !p.url))
      return setError("ছবি আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন।");

    setBusy(true);
    try {
      setPoster(
        poster
          ? await api.regenerate(poster._id, form)
          : await api.createPoster({
              templateId,
              formData: form,
              uploadedPhotoUrls: photos.map((p) => p.url!),
            }),
      );
    } catch (x) {
      setError((x as Error).message);
      setBusy(false);
    }
  }

  const done = poster?.status === "completed" && poster.generatedImageUrl;
  const noRetries = poster?.retriesLeft === 0;
  const photosLocked = !!poster;

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_400px]">
      <form onSubmit={submit} className="space-y-5">
        <h1 className="font-display text-3xl font-bold">পোস্টারের তথ্য দিন</h1>
        {!templateId && (
          <ErrorBanner>
            কোনো টেমপ্লেট বাছা হয়নি।{" "}
            <Link href="/" className="underline">
              টেমপ্লেট বেছে নিন
            </Link>
          </ErrorBanner>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="নাম" required>
            {(id) => (
              <input
                id={id}
                required
                className="field"
                value={form.name}
                onChange={set("name")}
              />
            )}
          </Field>
          <Field label="পদবি" required hint="যেমন: সাধারণ সম্পাদক">
            {(id) => (
              <input
                id={id}
                required
                className="field"
                value={form.designation}
                onChange={set("designation")}
              />
            )}
          </Field>
          <Field label="দল / সংগঠন" required>
            {(id) => (
              <input
                id={id}
                required
                className="field"
                value={form.party}
                onChange={set("party")}
              />
            )}
          </Field>
          <Field label="ইউনিয়ন / থানা / জেলা">
            {(id) => (
              <input
                id={id}
                className="field"
                value={form.area}
                onChange={set("area")}
              />
            )}
          </Field>
          <Field label="উপলক্ষ">
            {(id) => (
              <select
                id={id}
                className="field"
                value={form.occasionType}
                onChange={set("occasionType")}
              >
                {OCCASIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.bn}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            label="শিরোনাম"
            required
            hint={`${form.headline.length}/40 অক্ষর`}
          >
            {(id) => (
              <input
                id={id}
                required
                maxLength={40}
                className="field"
                value={form.headline}
                onChange={set("headline")}
                placeholder="যেমন: মহান বিজয় দিবস"
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1 flex items-center gap-1.5 font-medium">
            ছবি
            {photosLocked && (
              <Lock
                className="size-3.5 text-ink/40"
                aria-label="regenerate করলে ছবি বদলানো যাবে না"
              />
            )}
          </legend>
          <PhotoUploader
            photos={photos}
            onChange={setPhotos}
            max={template?.layoutConfig?.photoSlots ?? DEFAULT_MAX_PHOTOS}
            disabled={photosLocked}
            onError={setError}
          />
          {photosLocked && (
            <p className="mt-1 text-xs text-ink/50">
              আবার তৈরি করলে এই ছবিগুলোই থাকবে, শুধু লেখা বদলাবে।
            </p>
          )}
        </fieldset>

        <div aria-live="polite" className="min-h-6 space-y-2">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {poster && <StatusBadge status={poster.status} />}
        </div>

        <Button loading={busy} disabled={noRetries}>
          {poster ? (
            <RefreshCw className="size-4" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {poster ? "আবার তৈরি করুন" : "পোস্টার তৈরি করুন"}
        </Button>
        {poster?.retriesLeft !== undefined && (
          <p className="text-sm text-ink/60">
            {noRetries
              ? "আর নতুন করে তৈরি করার সুযোগ নেই।"
              : `আরও ${poster.retriesLeft} বার আবার তৈরি করতে পারবেন।`}
          </p>
        )}
      </form>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="mx-auto max-w-sm">
          {done ? (
            <div className="relative aspect-3/4 w-full overflow-hidden shadow-2xl ring-1 ring-black/10">
              <Image
                src={poster.generatedImageUrl!}
                alt="তৈরি পোস্টার"
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>
          ) : (
            <PosterPreview
              form={form}
              photos={photos.map((p) => p.preview)}
              layoutConfig={template?.layoutConfig}
            />
          )}
          <p className="mt-3 text-sm text-ink/60">
            {done
              ? "আপনার পোস্টার প্রস্তুত, ১২০০×১৬০০ পিক্সেল রেজোলিউশনে।"
              : "এটি আনুমানিক প্রিভিউ। চূড়ান্ত পোস্টার ছাপার মাপে তৈরি হবে।"}
          </p>
          {done && (
            <Button
              className="mt-3 w-full"
              onClick={() =>
                downloadImage(
                  poster.generatedImageUrl!,
                  `poster-${poster._id}.png`,
                )
              }
            >
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
