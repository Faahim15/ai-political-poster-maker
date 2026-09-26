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
