
No code changes needed — everything is already built. Here's how to use it.

## 1. Sign in as an instructor

1. Open the app and go to `/auth`.
2. Sign in with **gwenastone@gmail.com** (Google or email/password — same address either way).
3. On first sign-in you'll land on `/onboarding`. Your email is on the seeded `instructor_invitations` list, so `claim_instructor_invitation()` runs automatically and grants you the `instructor` role. You'll then be redirected to the instructor dashboard.

If you ever see the Parent/Student role picker instead, it means the invitation didn't claim — sign out and back in once, or ping me and I'll re-check the invitation row.

## 2. Open the CMS

- Direct URL: **`/hub/admin`**
- Or: Growth Hub (`/hub`) → the **Content Admin** link appears in the sidebar for staff (instructor/admin) accounts only.

## 3. Publish content

The admin has these tabs:

- **Articles** — Title, slug, category, cover image, then the Tiptap rich‑text editor (images upload to the `hub-media` bucket, YouTube embeds, tables, highlights). Fill SEO title/description + social share image if you want good link previews. Toggle **Published** and **Featured**, then Save.
- **Podcasts** — Episode number, title, description, cover, audio file (or Spotify / Apple / YouTube external links), transcript. Toggle Published → Save.
- **Resources / Downloads** — Upload the file (PDF, worksheet, etc.), pick a resource type + category, Save. Download counts auto‑increment.
- **Categories & Tags** — Manage the taxonomy used across articles/podcasts/resources.
- **Newsletter** — See subscribers and export them as CSV.

Anything with **Published = off** stays as a draft and is only visible to staff.

## 4. Invite other instructors

Right now instructor access is granted through the `instructor_invitations` table (one row per allowed email). There is **no in-app invite screen yet** — the two supported ways are:

1. **Tell me the emails** — I'll add them via a database migration. They'll then get instructor role automatically the first time they sign in at `/auth`.
2. **Add them yourself in the backend** — open **View Backend → Database → `instructor_invitations`** and insert a row with the invitee's email (leave `claimed_at` null). Next time they sign in, `claim_instructor_invitation()` promotes them to instructor.

<presentation-actions><presentation-open-backend>View Backend</presentation-open-backend></presentation-actions>

If you'd like, I can build a small **"Invite Instructor"** panel inside `/hub/admin` so you can add emails from the UI instead of touching the database — just say the word.
