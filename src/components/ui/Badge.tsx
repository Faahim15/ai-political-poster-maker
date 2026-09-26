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
