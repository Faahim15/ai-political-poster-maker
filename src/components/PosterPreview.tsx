import type { LayoutConfig, PosterForm } from "@/types";
import { DEFAULT_DECORATION, OCCASION_LABEL } from "@/types";

interface Props {
  form: PosterForm;
  photos: string[];
  layoutConfig?: LayoutConfig;
}

export default function PosterPreview({ form, photos, layoutConfig }: Props) {
  const decoration = layoutConfig ?? DEFAULT_DECORATION;
  const maxSlots = layoutConfig?.photoSlots ?? 3;
  const subLine = [form.designation, form.party, form.area]
    .filter(Boolean)
    .join(", ");

  if (layoutConfig?.backgroundImageUrl) {
    const slot = layoutConfig.photoSlotPosition ?? {
      xPct: 35,
      yPct: 36,
      widthPct: 30,
      heightPct: 29,
      borderRadiusPx: 24,
    };
    const headlineYPct = layoutConfig.headlineYPct ?? 76;
    const headlineColor =
      layoutConfig.headlineTextColor === "dark" ? "#10231b" : "white";
    const zones = layoutConfig.textZones;
    const usesPositionedZones = !!(zones?.name || zones?.sub);
    const photo = photos[0] ?? "";

    return (
      <div className="@container">
        <div
          role="img"
          aria-label="পোস্টারের প্রিভিউ"
          className="relative aspect-3/4 w-full overflow-hidden shadow-2xl ring-1 ring-black/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={layoutConfig.backgroundImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />

          <div
            style={{
              left: `${slot.xPct}%`,
              top: `${slot.yPct}%`,
              width: `${slot.widthPct}%`,
              height: `${slot.heightPct}%`,
              borderRadius: slot.borderRadiusPx,
            }}
            className="absolute overflow-hidden bg-white/60 shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo && (
              <img src={photo} alt="" className="size-full object-cover" />
            )}
          </div>

          <h2
            style={{ top: `${headlineYPct}%`, color: headlineColor }}
            className="absolute inset-x-0 wrap-break-word px-[6cqw] text-center font-display text-[7cqw] font-extrabold leading-[1.15] drop-shadow-lg"
          >
            {form.headline || "আপনার শিরোনাম"}
          </h2>

          {zones?.name && (
            <div
              style={{
                top: `${zones.name.topPct}%`,
                height: `${zones.name.heightPct}%`,
                color: zones.name.textColor === "dark" ? "#10231b" : "white",
              }}
              className="absolute inset-x-0 flex items-center justify-center px-[5cqw] text-center"
            >
              <p className="text-[4.6cqw] font-bold leading-tight">
                {form.name || "আপনার নাম"}
              </p>
            </div>
          )}
          {zones?.sub && (
            <div
              style={{
                top: `${zones.sub.topPct}%`,
                height: `${zones.sub.heightPct}%`,
                color: zones.sub.textColor === "dark" ? "#10231b" : "white",
              }}
              className="absolute inset-x-0 flex items-center justify-center px-[5cqw] text-center opacity-90"
            >
              <p className="text-[3.2cqw]">
                {subLine || OCCASION_LABEL[form.occasionType]}
              </p>
            </div>
          )}

          {!usesPositionedZones && (
            <div className="absolute inset-x-0 bottom-0 bg-white px-[5cqw] py-[3cqw] text-center text-ink">
              <p className="text-[4.6cqw] font-bold leading-tight">
                {form.name || "আপনার নাম"}
              </p>
              <p className="text-[3.2cqw] text-ink/70">
                {subLine || OCCASION_LABEL[form.occasionType]}
              </p>
              <p
                style={{ color: decoration.primaryColor }}
                className="mt-[1cqw] text-[2.8cqw] font-semibold"
              >
                প্রচারে: {form.name || "—"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const slots = (photos.length ? photos : [""]).slice(0, maxSlots);
  return (
    <div className="@container">
      <div
        role="img"
        aria-label="পোস্টারের প্রিভিউ"
        style={{
          background: `linear-gradient(to bottom, ${decoration.secondaryColor}, ${decoration.primaryColor})`,
        }}
        className="relative flex aspect-3/4 w-full flex-col overflow-hidden text-white shadow-2xl ring-1 ring-black/10"
      >
        <div
          style={{ background: decoration.accentColor }}
          className="absolute right-[-14%] top-[-9%] size-[52%] rounded-full"
          aria-hidden
        />
        <div className="relative flex justify-center gap-[3cqw] px-[6cqw] pt-[7cqw]">
          {slots.map((u, i) => (
            <div
              key={i}
              className="aspect-4/5 w-[27cqw] overflow-hidden rounded-t-full bg-white/15 ring-[0.6cqw] ring-white/80"
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
          <p className="text-[4.6cqw] font-bold leading-tight">
            {form.name || "আপনার নাম"}
          </p>
          <p className="text-[3.2cqw] text-ink/70">
            {subLine || OCCASION_LABEL[form.occasionType]}
          </p>
          <p
            style={{ color: decoration.primaryColor }}
            className="mt-[1cqw] text-[2.8cqw] font-semibold"
          >
            প্রচারে: {form.name || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
