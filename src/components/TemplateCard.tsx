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
