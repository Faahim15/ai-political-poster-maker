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
