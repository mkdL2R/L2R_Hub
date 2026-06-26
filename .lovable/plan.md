
# Family Growth Hub — Implementation Plan

## Scope

Add a new authenticated section "🌱 Family Growth Hub" to the L2R Education Hub, with public reading access for families and an admin interface for L2R staff to manage content.

## Routing & Layout

- `/hub` — pathless layout route with a left sidebar (using shadcn Sidebar). Sidebar items:
  - Home (link back to `/`)
  - Compass (`/compass`)
  - 🌱 Family Growth Hub (active section, expands to show 4 tabs)
  - Admin (visible only to admins)
- Tabs under the Hub:
  - `/hub/featured` — featured article, featured podcast, recently added, recommended (based on Compass tags).
  - `/hub/articles` — search + category filter + grid of article cards.
  - `/hub/articles/$slug` — article detail (hero, content, "Listen to this article" using Web Speech API, related articles, related podcast episodes; comments disabled).
  - `/hub/podcasts` — featured episode + grid of episodes with play button (HTML5 audio).
  - `/hub/resources` — searchable, categorized downloadable resources.
- `/hub/admin` — staff-only CRUD for articles, podcasts, resources (publish, schedule, edit, archive).
- `/auth` — sign in / sign up (email + password + Google). Required because admin must be authenticated.

## Database (new migration)

New tables under `public` schema, all with GRANTs + RLS:

- `app_role` enum: `admin`, `editor`, `member`.
- `user_roles(user_id, role)` — standard separate-table role pattern + `has_role()` security-definer function.
- `hub_articles` — slug, title, excerpt, content (markdown), hero_image_url, author, category, reading_minutes, status (`draft|scheduled|published|archived`), publish_at, created/updated.
- `hub_podcast_episodes` — slug, title, description, cover_url, audio_url, duration_seconds, category, status, publish_at, is_featured.
- `hub_resources` — title, description, file_url, file_type, category, age_group, status, publish_at.
- `hub_saved_items` — `user_id`, `item_type` (`article|podcast|resource`), `item_id`. Per-user "save for later".
- Storage bucket `hub-media` (public read) for hero images, cover art, audio files, and resource downloads.

RLS:
- Anyone (anon + authenticated) can SELECT `status = 'published' AND publish_at <= now()` rows.
- Only admins/editors (via `has_role`) can INSERT/UPDATE/DELETE.
- `hub_saved_items`: each user manages their own rows.

## Auth

Add minimal `/auth` route with email/password + Google OAuth via the Lovable broker. Profile/role auto-seeding: a trigger creates a default `member` role on signup. First admin is bootstrapped by the user manually via a small SQL snippet I'll surface after the migration.

## Admin Interface

`/hub/admin` (gated by `_authenticated` + `has_role('admin'|'editor')`):
- Tabs: Articles, Podcasts, Resources.
- Each tab: table of existing items with status badges + edit/archive actions + "New" button opening a form (title, body, category, hero/cover/audio/file upload to `hub-media` bucket, status, publish_at).

## Design

- Soft natural palette layered on the existing warm theme (sage/sand accents added to `src/styles.css`).
- Rounded `rounded-2xl` cards, generous padding, serif display font for headings paired with the existing body font (loaded via `<link>` in `__root.tsx`).
- L2R logo in the sidebar header and on hub hero sections.

## Out of scope (not built this turn)

- Comments (explicitly disabled).
- Full-text search infra (uses simple `ilike` filters).
- Audio transcription for "Listen to this article" beyond Web Speech API TTS fallback.

## Implementation order

1. Migration (tables, roles, RLS, GRANTs, storage bucket).
2. `/auth` route + role bootstrap helper.
3. Hub layout + sidebar + 4 tab routes + article detail route.
4. Admin route with CRUD forms.
5. Wire sidebar entry from `/`, `/compass` headers.

Confirm and I'll execute, or tell me what to drop/change (e.g. skip auth/admin and ship public read-only Hub first).
