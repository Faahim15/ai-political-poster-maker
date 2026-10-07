# পোস্টার ঘর — Frontend (Next.js + TypeScript + Tailwind v4)

**Live:** https://ai-political-poster-maker-five.vercel.app

The client for the AI Political Poster Maker — template browsing, the poster form,
a live in-browser preview, generation polling, and history, talking to the Express
backend over a small typed API client.

## Run

```bash
npm install
cp .env.example .env.local   # point this at the Express backend
npm run dev                   # http://localhost:3000
```

Run the backend alongside it (`npm run dev` in the backend repo, default
`http://localhost:5000`), and make sure its `CORS_ORIGIN` matches this app's
origin exactly.

## Environment Variables

| Variable              | Example                     | Notes                                                                       |
| --------------------- | --------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | the backend's `/api` root — baked in at **build time**, not read at runtime |

> Changing `NEXT_PUBLIC_API_URL` requires a rebuild/redeploy, not just a
> restart — Next.js inlines `NEXT_PUBLIC_*` variables into the shipped
> JavaScript at build time.

## Scripts

| Command         | What it does                                      |
| --------------- | ------------------------------------------------- |
| `npm run dev`   | Starts the dev server with hot reload             |
| `npm run build` | Type-checks, lints, and builds for production     |
| `npm start`     | Runs the production build (after `npm run build`) |
| `npm run lint`  | ESLint only                                       |

## Project Structure

```
src/
├── app/                        routes (App Router)
│   ├── layout.tsx                fonts, <Nav/>, <Footer/>
│   ├── globals.css                Tailwind v4 theme tokens, .field/.card/.btn
│   ├── page.tsx                   home: hero, "how it works", template library
│   ├── create/page.tsx             poster form, live preview, generate/regenerate, download
│   ├── history/page.tsx            saved posters
│   └── login/page.tsx              login + register
├── components/
│   ├── Nav.tsx, Footer.tsx
│   ├── PosterPreview.tsx           in-browser mirror of the backend's Puppeteer render
│   ├── PhotoUploader.tsx           drag & drop, per-photo upload state, slot limit
│   ├── TemplateCard.tsx            template grid item
│   ├── PosterCard.tsx              history grid item
│   └── ui/                         Button, Field, Badge, Skeleton, EmptyState, ErrorBanner, Spinner
├── hooks/
│   ├── useRequireAuth.ts            redirects to /login without a session
│   └── useAuthState.ts              live "is logged in" via useSyncExternalStore
├── lib/
│   ├── api.ts                       typed client for every backend route
│   └── session.ts                   JWT storage + auth-change event
└── types/
    └── index.ts                     Poster, Template, PosterForm, Occasion, ...
```

## Pages Overview

| Route      | Purpose                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/`        | Hero, "how it works", template library filterable by occasion                                                               |
| `/create`  | Poster form (name/designation/party/area/headline), photo upload, live preview, generate/regenerate, download the final PNG |
| `/history` | Every poster the logged-in user has generated, re-downloadable, deletable                                                   |
| `/login`   | One page, toggles between login and register                                                                                |

## Component Library

| Component        | Role                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `ui/Button`      | The only `<button>` styling in the app — variants, sizes, built-in spinner |
| `ui/Field`       | Label + hint/error wrapper around any input/select                         |
| `ui/Badge`       | Poster status pill (draft/generating/completed/failed), with icon + color  |
| `ui/Skeleton`    | Loading placeholders (`SkeletonGrid` for template/history grids)           |
| `ui/EmptyState`  | "Nothing here yet" panel with icon, message, optional action               |
| `ui/ErrorBanner` | Consistent inline error display, `role="alert"`                            |
| `PosterPreview`  | Approximate live mockup — mirrors the backend's actual render layout       |
| `PhotoUploader`  | Drag-and-drop, per-photo upload state, slot-count limit, error callback    |

## Backend Contract Notes

- Auth, templates, upload, and poster endpoints match the Express routes
  exactly (`/auth`, `/templates`, `/upload`, `/posters`).
- `/api/templates` sends `layoutConfig` (colors + `photoSlots`) alongside the
  basic fields. `PosterPreview` and `PhotoUploader` use it automatically when
  present, falling back to a default palette and 3 slots otherwise.
- Some templates are **fixed-illustration** templates — they carry a
  `backgroundImageUrl` and `textLayout` (percent-based positions for
  headline/sub/name/photo) instead of a plain color gradient. The frontend
  doesn't need to know the difference: it just renders whatever `Template` it
  receives, and the backend's renderer picks the right pipeline.
- On every generation, the backend also asks Gemini to suggest a focal point
  for each uploaded photo, so photos aren't center-cropped blindly inside
  their frame. This happens server-side only — the live preview always shows
  a plain center-cropped photo, since the real focal point isn't known until
  generation actually runs.
- Regenerating a poster only resends `formData`, so the original photos can't
  be swapped afterwards — the create page locks the photo uploader once a
  poster exists, to match that behavior.

## Deployment

Deployed on Vercel. Two things to check after any deploy:

1. **`NEXT_PUBLIC_API_URL`** on Vercel points at the deployed backend's `/api`
   root, not `localhost` — and was set _before_ the last build (see the note
   under Environment Variables above).
2. **`next.config.ts`**'s `images.remotePatterns` includes every host actual
   photos/posters are served from (Cloudinary, and `localhost` for local dev)
   — `next/image` refuses any host not explicitly allowed.

## Troubleshooting

| Symptom                                             | Likely cause                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Works via a direct backend URL, not from this app   | `CORS_ORIGIN` on the backend doesn't match this app's exact deployed origin                 |
| Template list loads locally but not after deploying | `NEXT_PUBLIC_API_URL` was set after the last build — redeploy to pick it up                 |
| `next/image` throws a host-not-configured error     | Add that host to `images.remotePatterns` in `next.config.ts`, then restart                  |
| Hydration mismatch mentioning `data-gr-ext-*`       | Caused by the Grammarly browser extension modifying `<body>`, not this app — safe to ignore |
| "Cannot find module '@/...'"                        | Path alias mismatch — this project's `tsconfig.json` maps `@/*` to `./src/*`                |
