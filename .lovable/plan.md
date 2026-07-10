
# Growth Hub CMS — Implementation Plan

The project already has a partial Hub (`hub_articles`, `hub_podcast_episodes`, `hub_resources`, `hub_saved_items`, `hub-media` bucket, `/hub/*` routes, `/hub/admin`, staff RBAC via `is_staff` + `user_roles`). I'll extend rather than rebuild so existing content and links keep working.

## 1. Database (single migration)

Extend existing tables and add new ones. All new tables include GRANTs + RLS.

**Extend `hub_articles`** — add: `slug` (already), `featured_image_url`, `seo_title`, `seo_description`, `canonical_url`, `og_image_url`, `scheduled_at`, `is_featured`, `content_json` (jsonb, Tiptap doc), `view_count`. Extend `status` check to include `draft|published|scheduled|archived`.

**Extend `hub_podcast_episodes`** — add: `episode_number`, `spotify_url`, `apple_url`, `youtube_url`, `transcript`. Keep `audio_url` optional (unused per spec).

**Extend `hub_resources`** — add: `download_count`, `resource_type` (pdf|workbook|checklist|printable|presentation).

**New tables:**
- `hub_categories` (name, slug, description, color, kind: article|podcast|download)
- `hub_tags` (name, slug)
- `hub_article_tags` (article_id, tag_id)
- `hub_reading_history` (user_id, item_type, item_id, progress, completed, last_viewed_at)
- `hub_newsletter_subscribers` (email unique, source, subscribed_at, confirmed)

Reuse existing `hub_saved_items` for bookmarks (already supports article + podcast).

**RLS:**
- Public SELECT on published articles/podcasts/downloads/categories/tags (anon + authenticated).
- Staff (`is_staff(auth.uid())`) full CRUD on content + categories + tags.
- Bookmarks/history: owner-only (`auth.uid() = user_id`).
- Newsletter: anon INSERT allowed; SELECT staff-only.

## 2. Storage buckets

Create via storage tool: `article-images` (public), `downloads` (public read, staff write), `media` (public). Keep existing `hub-media` for backward compat. Storage RLS: staff-only write via `is_staff`, public read.

## 3. Rich Text Editor

Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `-link`, `-table`, `-task-list`, `-task-item`, `-highlight`, `-underline`, `-placeholder`, `-youtube`, `-horizontal-rule`, `lowlight` for code.

Build `src/components/editor/TiptapEditor.tsx` with toolbar (headings, bold/italic/underline/highlight, lists, checklists, quote, code block, table, image upload → `article-images`, link, YouTube embed, HR, undo/redo). Autosave draft every 5s via debounced mutation. Preview mode renders read-only.

Article renderer: `src/components/editor/ArticleRenderer.tsx` renders `content_json` via `generateHTML` for the public article page.

## 4. Routes

Keep existing route files; add new ones.

**Public / reader:**
- `/hub` (index — already, refresh to show featured article + featured podcast + latest)
- `/hub/articles` (extend existing: keyword + category + tag + sort)
- `/hub/articles/$slug` (extend: cover, tags, share buttons, related, prev/next, view tracking)
- `/hub/podcasts` (episodes list with external Listen buttons — remove inline audio player)
- `/hub/podcasts/$slug` (episode detail: artwork, description, Spotify/Apple/YouTube buttons, transcript)
- `/hub/videos` (empty state "Coming soon" — route scaffold only, per "future ready")
- `/hub/downloads` (rename/replace `hub.resources.tsx`; downloads with counter increment RPC)
- `/hub/categories` (browse by category)
- `/hub/search` (unified search across articles + podcasts + downloads)
- `/hub/bookmarks` (authenticated: saved items)

**Admin (`is_staff` gate in `hub.admin.tsx` already exists):**
- `/hub/admin` (dashboard: content counts, quick links)
- `/hub/admin/articles` (list + create/edit/delete/publish/feature)
- `/hub/admin/articles/$id` (Tiptap editor + metadata + SEO panel + status controls + preview)
- `/hub/admin/podcasts` + `/hub/admin/podcasts/$id`
- `/hub/admin/downloads` + upload via `FileDropzone`
- `/hub/admin/categories` (CRUD)
- `/hub/admin/tags` (CRUD)
- `/hub/admin/newsletter` (subscriber list)

## 5. Navigation

Update `DashboardShell` items and dashboards to expose a single "Growth Hub" entry that lands on `/hub` with a sub-nav (Articles | Podcasts | Videos | Downloads | Categories | Search | Bookmarks). Sub-nav lives in `src/routes/hub.tsx` as a sticky tab bar. Instructor dashboard gets "Growth Hub Admin" → `/hub/admin`.

## 6. Dashboards

Add "Continue Learning" (recent `hub_reading_history`) and "Featured this week" (featured article + podcast) blocks to `family-dashboard.tsx` and `student-dashboard.tsx`.

## 7. Newsletter

Footer/hero subscribe form → inserts into `hub_newsletter_subscribers` (anon INSERT policy, unique email, silent on duplicate).

## 8. Design

Keep existing warm-ivory + forest + sketch palette; new admin uses cards, rounded-2xl, Lucide icons only. No emojis. Paper-texture backgrounds via existing tokens.

## Technical Notes

- Scheduled publishing: `status='scheduled' + scheduled_at`; existing public filters use `status='published' AND publish_at <= now()` — add scheduler view as `status IN ('published','scheduled') AND publish_at <= now()` or a lightweight cron via pg_cron flipping scheduled → published (defer to pg_cron in a follow-up; MVP treats scheduled = published-when-time-passes at query time).
- View + download counters: `increment_article_view(id)` and `increment_download(id)` SECURITY DEFINER functions, granted to anon+authenticated.
- Related articles: same category, exclude self, limit 3.
- Prev/next: order by `publish_at`.
- All server data via existing browser `supabase` client (RLS covers it); no server functions required.
- Do not touch auto-generated files.

## Deliverable per turn

Single migration → then install Tiptap + implement editor + all routes + nav + dashboards + newsletter in one pass. I'll skip video ingestion (route stub only) and pg_cron (query-time scheduling).
