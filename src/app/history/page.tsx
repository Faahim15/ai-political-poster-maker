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
