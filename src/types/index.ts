export type Occasion =
  | "victory"
  | "condolence"
  | "campaign"
  | "greeting"
  | "festival";

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

export interface PhotoSlotPosition {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  borderRadiusPx: number;
}

export interface TextZone {
  topPct: number;
  heightPct: number;
  textColor: "white" | "dark";
}

export interface LayoutConfig extends Decoration {
  photoSlots: number;
  backgroundImageUrl?: string;
  photoSlotPosition?: PhotoSlotPosition;
  headlineYPct?: number;
  headlineTextColor?: "white" | "dark";
  textZones?: {
    name?: TextZone;
    sub?: TextZone;
  };
}

export interface Template {
  _id: string;
  title: string;
  occasionType: Occasion;
  thumbnailUrl: string;
  layoutConfig?: LayoutConfig;
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
