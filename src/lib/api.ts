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
