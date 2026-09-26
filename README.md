# পোস্টার ঘর — Frontend (Next.js + TypeScript + Tailwind v4)

## Run

    cp .env.example .env.local     # point this at the Express backend
    npm install
    npm run dev                    # http://localhost:3000

Run the backend alongside it (`npm run dev` in the backend repo, default
`http://localhost:5000`) and make sure its `CORS_ORIGIN` env var matches this
app's origin (`http://localhost:3000` by default).

## Structure

    src/
      app/                  routes (App Router)
        layout.tsx            fonts, <Nav/>, <Footer/>
        page.tsx              home: hero, "how it works", template library
        create/page.tsx        poster form, live preview, generate/regenerate, download
        history/page.tsx       saved posters
        login/page.tsx         login + register
        globals.css            Tailwind v4 theme tokens, .field/.card/.btn
      components/
        Nav.tsx, Footer.tsx
        PosterPreview.tsx      in-browser mirror of the backend's Puppeteer render
        PhotoUploader.tsx      drag & drop, per-photo upload state, slot limit
        TemplateCard.tsx       template grid item
        PosterCard.tsx         history grid item
        ui/                    Button, Field, Badge, Skeleton, EmptyState, ErrorBanner, Spinner
      hooks/
        useRequireAuth.ts       redirects to /login without a session
        useAuthState.ts         live "is logged in" via useSyncExternalStore
      lib/
        api.ts                  typed client for every backend route
        session.ts              JWT storage + auth-change event
      types/
        index.ts                Poster, Template, PosterForm, Occasion, ...

## Backend contract notes

- Auth, templates, upload, and poster endpoints match the Express routes in
  `routes.ts` exactly (`/auth`, `/templates`, `/upload`, `/posters`).
- `/api/templates` currently projects only `_id, title, occasionType,
  thumbnailUrl` (see `template.controller.ts`). The frontend's `Template` type
  also has an optional `layoutConfig` (colors + `photoSlots`) — if that
  projection is extended to include it, `PosterPreview` and `PhotoUploader`
  will automatically use the template's real palette and photo-slot limit
  instead of the current default (flag green/red, 3 slots) with no frontend
  changes needed.
- Regenerating a poster only resends `formData` (`poster.controller.ts`), so
  the original photos can't be swapped afterwards — the create page locks the
  photo uploader once a poster exists, to match that behavior.
