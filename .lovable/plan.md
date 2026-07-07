# Left2Right — Brand Refresh + Media Uploads

Two things in one pass: (1) a warm, premium visual identity across the whole app, and (2) drag-and-drop file uploads in the Content Admin so you can publish blog posts and podcast episodes without hosting files elsewhere.

---

## 1. Visual identity system

**Color tokens** (replaces the current emerald/amber palette everywhere):

| Token | Hex | Role |
|---|---|---|
| `--background` | `#F8F5EF` ivory | Page background (no more pure white) |
| `--primary` — Forest Green | `#2F6B4F` | Buttons, links, brand |
| `--accent-red` — Crayon Red | `#D95C5C` | Family / celebration highlights |
| `--accent-blue` — Sketch Blue | `#3A7CCF` | Guidance / educational tags |
| `--sage` — Soft Sage | `#A9C3A2` | Growth sections, subtle bg |
| `--sand` — Warm Sand | `#E9DFC9` | Card & secondary backgrounds |
| `--ink` | `#1F2A24` | Body text |

**Typography** — Editorial serif + clean sans, loaded via `<link>` in `__root.tsx`:
- Headings: **Fraunces** (warm literary serif)
- Body: **Inter** (crisp, readable)

**Shapes & feel**
- Rounded cards (`rounded-2xl` / `rounded-3xl`), warm sand backgrounds, subtle organic-paper shadows
- Gentle blob/paper SVG accents behind hero sections
- Bento-grid layouts for the Hub landing and dashboards
- All emoji swapped for Lucide icons (🌱 → `Sprout`, 🌳 → `TreeDeciduous`, etc.)
- Micro-interactions: hover-lift on cards, subtle fade-in on scroll

---

## 2. Pages that get restyled

Applied globally via updated `src/styles.css` tokens + targeted per-page polish:
- `/` landing (hero, feature bento, CTA)
- `/hub`, `/hub/featured`, `/hub/articles`, `/hub/podcasts`, `/hub/resources`, `/hub/articles/$slug`
- `/hub/admin` (new upload UI, see below)
- `/compass`, `/parent`, `/student`, `/auth`
- All `_authenticated` dashboards (family, instructor, student, profile, people, onboarding, living-tree)
- Sidebar + shared shells

No layout rewrites — same information architecture, refreshed skin + a bento hero on the landing and Hub featured page.

---

## 3. Built-in uploads for Blog & Podcast

**Storage:** new public `hub-media` bucket in Lovable Cloud with folders `articles/`, `podcasts/`, `resources/`. Public read, staff-only write (RLS on `storage.objects` gated by `has_role('admin'|'instructor')`).

**Admin UI changes** in `/hub/admin`:
- **Articles form:** drag-and-drop **hero image** (JPG/PNG/WebP, ≤5 MB). Replaces the "hero image URL" text field. URL is still editable as a fallback.
- **Podcasts form:** drag-and-drop **cover art** (image) + **audio file** (MP3/M4A, ≤50 MB). Auto-reads duration from the audio file. Replaces the two URL fields.
- **Resources form:** drag-and-drop **file** (PDF/DOCX/etc., ≤20 MB). Auto-detects file type.
- Upload progress bar, thumbnail preview, "Remove" button, and inline error messages.

**How it works technically:** the browser uploads directly to the bucket via the Supabase JS client, receives a public URL, and stores that URL in the existing `hub_articles.hero_image_url` / `hub_podcast_episodes.audio_url` / `hub_resources.file_url` columns. No schema changes to content tables.

---

## Technical details

- New migration: create `hub-media` bucket via `storage_create_bucket` tool + RLS policies on `storage.objects`.
- New component: `src/components/admin/FileDropzone.tsx` (reusable, handles image / audio / doc).
- Update `src/styles.css` `@theme` block with the new color/font tokens; keep shadcn `@theme inline` mapping intact.
- Update `__root.tsx` head with Fraunces + Inter `<link>` tags.
- Replace hardcoded `emerald-*` / `amber-*` Tailwind classes across hub routes with semantic tokens (`bg-primary`, `bg-sand`, `text-ink`, etc.).
- Swap emoji glyphs in labels/nav for `lucide-react` icons.

---

## Out of scope (this pass)

- No changes to auth, roles, RLS on content tables, or onboarding flow.
- No new content sections or routes.
- No dark mode (can add after if you want).

Approve and I'll ship it.
