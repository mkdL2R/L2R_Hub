# L2R "Artisanal Learning Journal" Redesign

Visual + UX only. **No changes** to auth, database, RLS, RPCs, roles, routing, or business logic. Everything is a re-skin + layout refactor on top of the existing route tree.

## Phase 1 — Global design tokens (`src/styles.css`)

Replace the current L2R marker palette with the sketchbook palette:

- `--paper` (bg) `#E2BBA3` — warm terracotta paper
- `--ink` `#1B1B1B` — text/borders
- `--card` `#FBF7EE` — off-white paper card
- `--cobalt` `#1B3E8C` — secondary accent
- `--stamp-red` `#D92121` — primary action
- `--leaf` `#3B7559` — tags/education
- `--sun` `#EAD03C` — highlights
- Keep semantic tokens (`--primary`, `--background`, etc.) mapped to these so shadcn components inherit automatically.

Add:
- SVG paper-grain background layer on `body` (data-URI turbulence).
- `@utility ink-border` — irregular 1.5px charcoal outline using layered box-shadows + subtle rotate.
- `@utility marker-stroke` — thick uneven underline for progress bars/headers.
- `@utility paper-card` — off-white card with soft drop shadow + hand-drawn border.
- `@utility wavy-divider` — SVG wave separator.
- Fonts via `<link>` in `__root.tsx`: **Caveat** (handwritten headers) + **Inter** (body/data). Serif tokens rewired to Caveat only for h1/h2/display; body stays sans.

## Phase 2 — Mascot system (`src/components/mascots/`)

Four tiny SVG components — `<BlobCircle/>`, `<BlobTriangle/>`, `<BlobStar/>`, `<BlobDrop/>` — each accepting `color` (yellow/blue/red/green), `size`, `mood`. Dot eyes + U smile. A `<FloatingMascot/>` wrapper applies a gentle CSS float animation (`@keyframes float`). Used as decorative peek-behind elements on cards, progress bars, empty states.

## Phase 3 — Component style system

Restyle (not restructure) shadcn primitives already in the project:
- `Button` — stamp-red primary with slight rotate on hover, ink border variant, marker underline variant.
- `Card` — new `paper-card` default look; keep API.
- `Badge` — leaf-green tag pill with hand-drawn border.
- `Progress` — replaced visual: thick marker stroke with sun-yellow fill and red end cap. Same props.
- `Input` / `Textarea` — notebook underline style.
- New shared: `SketchDivider`, `SectionHeader` (handwritten), `StatPill`.

## Phase 4 — Navigation redesign

New `src/components/dashboard/JournalSidebar.tsx` — left vertical nav (Home, My Compass, Learning Journey, Resources, Messages, Calendar, Profile) with hand-drawn Lucide icons on charcoal, active item marked by a marker stroke. Collapsible on tablet, drawer on mobile (uses existing shadcn `Sheet`). `DashboardShell.tsx` refactored to a 2-column layout: sidebar + main. Existing NavItem prop API preserved so family/student/instructor dashboards keep working.

## Phase 5 — Dashboard layout foundation

New building blocks under `src/components/dashboard/`:
- `WelcomeBlock` — big handwritten "Welcome back, {name}", avatar, role chip, current stage, peeking mascot.
- `ActivityCard` — illustration slot, progress, description.
- `StatPillRow` — Completed / Progress / Active.
- `MarkerProgress` — the marker-stroke progress bar.
- `PlannerCalendar` — monthly grid styled like a paper planner (uses existing `react-day-picker` under the hood — no new deps unless already installed; otherwise a lightweight custom grid).
- `TimelineList` — vertical lesson/appointment cards.
- `CompassWidget` — organic-shape "map of growth" card (SVG petals for strengths/style/goals/path).
- `RecommendationsWidget` — mixed articles/podcasts/resources feed.

Applied to **family-dashboard**, **student-dashboard**, **instructor-dashboard** with role-specific copy and section mix per spec (family = Compass + child progress + resources + meetings; student = Learning Plan + achievements + reflection; instructor = Students + comms + plans + appointments).

## Phase 6 — Landing page (`src/routes/index.tsx`)

Rewrite hero: handwritten headline "Discover your child's unique learning ecosystem." Three primary CTAs preserved (Apply → `/parent`, Sign In → `/auth`, Explore → `/hub/featured`). Add mascot cluster illustration, organic blob backdrops, wavy dividers, "how it works" sketch strip. Instructors-by-invite footnote kept.

## Phase 7 — Growth Hub reskin

Apply paper-card + cover-illustration treatment to `hub.featured`, `hub.articles`, `hub.podcasts`, `hub.resources`, `hub.bookmarks`. Category tags become leaf-green hand-drawn pills; reading progress uses `MarkerProgress`; a mascot sits on saved-item cards. No data-layer changes.

## Phase 8 — Journey + Compass + Living Tree polish

`StepShell.tsx`, `parent.tsx`, `student.tsx`, `compass.tsx`, `living-tree.tsx`, `profile.tsx`, `auth.tsx`, `admin.profiles.tsx` — re-skin only: new tokens, paper cards, handwritten section titles, marker progress on step indicators. Existing state, RPCs, and `AccountGate` untouched.

## Phase 9 — Responsive pass

Sidebar → drawer under `md`. Two-column dashboard collapses to single column with mascot moved above WelcomeBlock. Calendar becomes horizontal week strip on mobile. Verified via preview at 375 / 768 / 1280.

---

## Explicitly out of scope
- Auth flows, Supabase clients, RPCs, RLS, middleware
- Route tree, role gating, invitation logic
- Database schema, migrations
- Server functions

## Technical notes
- All tokens live in `src/styles.css` under `@theme inline` so shadcn variants pick them up.
- Fonts loaded via `<link>` in `src/routes/__root.tsx` head (Tailwind v4 rule — no URL `@import`).
- Paper texture is an inline SVG data-URI (no asset requests).
- Mascots and sketch dividers are hand-authored SVG components (no image generation) to keep bundle small and edits fast.
- Motion uses CSS `@keyframes` + `prefers-reduced-motion` fallback; no new animation libs.

## Rollout order in the codebase
1. `src/styles.css` + `src/routes/__root.tsx` (tokens + fonts + paper bg)
2. `src/components/mascots/*` + sketch primitives
3. shadcn primitive restyles (Button, Card, Badge, Progress, Input)
4. `JournalSidebar` + `DashboardShell` refactor
5. Dashboard building blocks + three role dashboards
6. Landing page
7. Growth Hub pages
8. Journey / Compass / Living Tree / Profile / Auth / Admin polish
9. Responsive QA pass with Playwright screenshots at 3 breakpoints

Approve and I'll build in this order, committing each phase so you can review visually as it lands.