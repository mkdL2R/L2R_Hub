import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Archive, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useUserRoles, ARTICLE_CATEGORIES, PODCAST_CATEGORIES, RESOURCE_CATEGORIES } from "@/lib/hub-auth";
import { fmtDate } from "@/lib/hub-content";
import { FileDropzone } from "@/components/admin/FileDropzone";
import { TiptapEditor } from "@/components/editor/TiptapEditor";

export const Route = createFileRoute("/hub/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) {
      throw redirect({ to: "/auth" });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const staffRoles = new Set(["admin", "editor", "administrator"]);
    const isStaff = (roles ?? []).some((r) => staffRoles.has(r.role as string));
    if (!isStaff) {
      throw redirect({ to: "/hub/featured" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const { user, loading: userLoading } = useAuthUser();
  const { isStaff, loading: rolesLoading } = useUserRoles(user?.id);

  if (userLoading || rolesLoading) return <Center>Loading…</Center>;
  if (!user) {
    return (
      <Center>
        Please <Link to="/auth" className="text-primary underline">sign in</Link> to access administration.
      </Center>
    );
  }
  if (!isStaff) {
    return (
      <Center>
        Your account doesn't have staff access yet.
        <div className="mt-4 text-xs">
          Ask an administrator to grant your user the <code>admin</code> or <code>editor</code> role.
        </div>
      </Center>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-serif font-medium tracking-tight">Manage content</h1>
        <p className="text-muted-foreground text-sm mt-1">Publish, schedule, edit and archive Growth Hub content.</p>
      </header>
      <Tabs defaultValue="articles">
        <TabsList className="rounded-full">
          <TabsTrigger value="articles" className="rounded-full">Articles</TabsTrigger>
          <TabsTrigger value="podcasts" className="rounded-full">Podcasts</TabsTrigger>
          <TabsTrigger value="resources" className="rounded-full">Downloads</TabsTrigger>
          <TabsTrigger value="newsletter" className="rounded-full">Newsletter</TabsTrigger>
        </TabsList>
        <TabsContent value="articles" className="mt-6"><ArticlesAdmin /></TabsContent>
        <TabsContent value="podcasts" className="mt-6"><PodcastsAdmin /></TabsContent>
        <TabsContent value="resources" className="mt-6"><ResourcesAdmin /></TabsContent>
        <TabsContent value="newsletter" className="mt-6"><NewsletterAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-6 py-20 text-center text-muted-foreground">{children}</div>;
}

function StatusBadge({ status, when }: { status: string; when: string }) {
  const scheduled = status === "published" && new Date(when) > new Date();
  const label = scheduled ? "scheduled" : status;
  const color: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-800",
    draft: "bg-amber-100 text-amber-800",
    scheduled: "bg-sky-100 text-sky-800",
    archived: "bg-muted text-muted-foreground",
  };
  return <Badge className={`rounded-full ${color[label] ?? ""}`}>{label}</Badge>;
}

// --------- Articles admin ---------
type ArticleRow = {
  id: string; slug: string; title: string; excerpt: string | null; content: string;
  hero_image_url: string | null; author: string | null; category: string;
  reading_minutes: number; status: string; publish_at: string;
  seo_title?: string | null; seo_description?: string | null;
  og_image_url?: string | null; is_featured?: boolean;
};

function ArticlesAdmin() {
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [editing, setEditing] = useState<ArticleRow | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase.from("hub_articles").select("*").order("updated_at", { ascending: false });
    setRows((data ?? []) as ArticleRow[]);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this article?")) return;
    await supabase.from("hub_articles").delete().eq("id", id);
    load();
  }
  async function archive(id: string) {
    await supabase.from("hub_articles").update({ status: "archived" }).eq("id", id);
    load();
  }

  return (
    <Card className="rounded-2xl border-border/60 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Articles ({rows.length})</h2>
        <Button size="sm" className="rounded-full gap-1" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((r) => (
          <div key={r.id} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.category} · {fmtDate(r.publish_at)}</div>
            </div>
            <StatusBadge status={r.status} when={r.publish_at} />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(r); setOpen(true); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive(r.id)}>
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No articles yet.</p>}
      </div>
      <ArticleForm open={open} onOpenChange={setOpen} initial={editing} onSaved={() => { setOpen(false); load(); }} />
    </Card>
  );
}

function ArticleForm({
  open, onOpenChange, initial, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; initial: ArticleRow | null; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<ArticleRow>>({});
  useEffect(() => {
    setForm(initial ?? { category: ARTICLE_CATEGORIES[0], status: "draft", reading_minutes: 5, publish_at: new Date().toISOString() });
  }, [initial, open]);
  function set<K extends keyof ArticleRow>(k: K, v: ArticleRow[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    const payload = {
      slug: form.slug || (form.title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      title: form.title ?? "",
      excerpt: form.excerpt ?? null,
      content: form.content ?? "",
      hero_image_url: form.hero_image_url ?? null,
      author: form.author ?? null,
      category: form.category ?? ARTICLE_CATEGORIES[0],
      reading_minutes: Number(form.reading_minutes ?? 5),
      status: form.status ?? "draft",
      publish_at: form.publish_at ?? new Date().toISOString(),
      seo_title: form.seo_title ?? null,
      seo_description: form.seo_description ?? null,
      og_image_url: form.og_image_url ?? form.hero_image_url ?? null,
      is_featured: !!form.is_featured,
    };
    if (initial) {
      await supabase.from("hub_articles").update(payload).eq("id", initial.id);
    } else {
      await supabase.from("hub_articles").insert(payload);
    }
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Title"><Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Slug (auto if blank)"><Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></Field>
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ARTICLE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Author"><Input value={form.author ?? ""} onChange={(e) => set("author", e.target.value)} /></Field>
            <Field label="Reading minutes"><Input type="number" value={form.reading_minutes ?? 5} onChange={(e) => set("reading_minutes", Number(e.target.value))} /></Field>
          </div>
          <FileDropzone
            label="Hero image"
            kind="image"
            folder="articles"
            value={form.hero_image_url ?? null}
            onChange={(url) => set("hero_image_url", url)}
          />
          <Field label="Excerpt"><Textarea value={form.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} /></Field>
          <Field label="Content">
            <TiptapEditor
              value={form.content ?? ""}
              onChange={(_json, html) => set("content", html)}
              placeholder="Write your article — drag images in, embed YouTube, add tables…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SEO title (optional)"><Input value={form.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} /></Field>
            <Field label="SEO description (optional)"><Input value={form.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} /></Field>
          </div>
          <FileDropzone
            label="Social share image (optional — defaults to hero)"
            kind="image"
            folder="articles/og"
            value={form.og_image_url ?? null}
            onChange={(url) => set("og_image_url", url)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
            Feature this article on the Hub homepage
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft", "published", "archived"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Publish at">
              <Input
                type="datetime-local"
                value={form.publish_at ? new Date(form.publish_at).toISOString().slice(0, 16) : ""}
                onChange={(e) => set("publish_at", new Date(e.target.value).toISOString())}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: set status to <b>published</b> with a future publish date to schedule.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

// --------- Podcasts admin ---------
type EpisodeRow = {
  id: string; slug: string; title: string; description: string | null;
  cover_url: string | null; audio_url: string | null; duration_seconds: number | null;
  category: string; status: string; is_featured: boolean; publish_at: string;
  episode_number?: number | null;
  spotify_url?: string | null; apple_url?: string | null; youtube_url?: string | null;
  transcript?: string | null;
};

function PodcastsAdmin() {
  const [rows, setRows] = useState<EpisodeRow[]>([]);
  const [editing, setEditing] = useState<EpisodeRow | null>(null);
  const [open, setOpen] = useState(false);
  async function load() {
    const { data } = await supabase.from("hub_podcast_episodes").select("*").order("updated_at", { ascending: false });
    setRows((data ?? []) as EpisodeRow[]);
  }
  useEffect(() => { load(); }, []);
  async function archive(id: string) { await supabase.from("hub_podcast_episodes").update({ status: "archived" }).eq("id", id); load(); }
  async function remove(id: string) { if (!confirm("Delete?")) return; await supabase.from("hub_podcast_episodes").delete().eq("id", id); load(); }
  return (
    <Card className="rounded-2xl border-border/60 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Podcast episodes ({rows.length})</h2>
        <Button size="sm" className="rounded-full gap-1" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((r) => (
          <div key={r.id} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{r.title} {r.is_featured && <Badge variant="secondary" className="ml-2 rounded-full">featured</Badge>}</div>
              <div className="text-xs text-muted-foreground">{r.category} · {fmtDate(r.publish_at)}</div>
            </div>
            <StatusBadge status={r.status} when={r.publish_at} />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive(r.id)}><Archive className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No episodes yet.</p>}
      </div>
      <EpisodeForm open={open} onOpenChange={setOpen} initial={editing} onSaved={() => { setOpen(false); load(); }} />
    </Card>
  );
}

function EpisodeForm({
  open, onOpenChange, initial, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; initial: EpisodeRow | null; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<EpisodeRow>>({});
  useEffect(() => {
    setForm(initial ?? { category: PODCAST_CATEGORIES[0], status: "draft", is_featured: false, publish_at: new Date().toISOString() });
  }, [initial, open]);
  function set<K extends keyof EpisodeRow>(k: K, v: EpisodeRow[K]) { setForm((f) => ({ ...f, [k]: v })); }
  async function save() {
    const payload = {
      slug: form.slug || (form.title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      title: form.title ?? "",
      description: form.description ?? null,
      cover_url: form.cover_url ?? null,
      audio_url: form.audio_url ?? null,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      category: form.category ?? PODCAST_CATEGORIES[0],
      status: form.status ?? "draft",
      is_featured: !!form.is_featured,
      publish_at: form.publish_at ?? new Date().toISOString(),
      episode_number: form.episode_number ? Number(form.episode_number) : null,
      spotify_url: form.spotify_url ?? null,
      apple_url: form.apple_url ?? null,
      youtube_url: form.youtube_url ?? null,
      transcript: form.transcript ?? null,
    };
    if (initial) await supabase.from("hub_podcast_episodes").update(payload).eq("id", initial.id);
    else await supabase.from("hub_podcast_episodes").insert(payload);
    onSaved();
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit episode" : "New episode"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Title"><Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Slug (auto if blank)"><Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></Field>
          <Field label="Description"><Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Episode number"><Input type="number" value={form.episode_number ?? ""} onChange={(e) => set("episode_number", Number(e.target.value))} /></Field>
            <div />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Spotify URL"><Input value={form.spotify_url ?? ""} onChange={(e) => set("spotify_url", e.target.value)} /></Field>
            <Field label="Apple Podcasts URL"><Input value={form.apple_url ?? ""} onChange={(e) => set("apple_url", e.target.value)} /></Field>
            <Field label="YouTube URL"><Input value={form.youtube_url ?? ""} onChange={(e) => set("youtube_url", e.target.value)} /></Field>
          </div>
          <Field label="Transcript (optional)">
            <Textarea rows={6} value={form.transcript ?? ""} onChange={(e) => set("transcript", e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <FileDropzone
              label="Cover art"
              kind="image"
              folder="podcasts/covers"
              value={form.cover_url ?? null}
              onChange={(url) => set("cover_url", url)}
            />
            <FileDropzone
              label="Audio file (optional — external links preferred)"
              kind="audio"
              folder="podcasts/audio"
              value={form.audio_url ?? null}
              onChange={(url, meta) => {
                set("audio_url", url);
                if (meta?.durationSeconds) set("duration_seconds", meta.durationSeconds);
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Duration (s)"><Input type="number" value={form.duration_seconds ?? ""} onChange={(e) => set("duration_seconds", Number(e.target.value))} /></Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PODCAST_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["draft","published","archived"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Publish at">
              <Input type="datetime-local" value={form.publish_at ? new Date(form.publish_at).toISOString().slice(0, 16) : ""}
                onChange={(e) => set("publish_at", new Date(e.target.value).toISOString())} />
            </Field>
            <label className="flex items-end gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
              Feature this episode
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --------- Resources admin ---------
type ResourceRow = {
  id: string; title: string; description: string | null; file_url: string | null;
  file_type: string | null; category: string; age_group: string | null;
  status: string; publish_at: string;
  resource_type?: string | null;
};

function ResourcesAdmin() {
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const [open, setOpen] = useState(false);
  async function load() {
    const { data } = await supabase.from("hub_resources").select("*").order("updated_at", { ascending: false });
    setRows((data ?? []) as ResourceRow[]);
  }
  useEffect(() => { load(); }, []);
  async function archive(id: string) { await supabase.from("hub_resources").update({ status: "archived" }).eq("id", id); load(); }
  async function remove(id: string) { if (!confirm("Delete?")) return; await supabase.from("hub_resources").delete().eq("id", id); load(); }
  return (
    <Card className="rounded-2xl border-border/60 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Resources ({rows.length})</h2>
        <Button size="sm" className="rounded-full gap-1" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((r) => (
          <div key={r.id} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.category} · {r.file_type ?? "—"} · {fmtDate(r.publish_at)}</div>
            </div>
            <StatusBadge status={r.status} when={r.publish_at} />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archive(r.id)}><Archive className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No resources yet.</p>}
      </div>
      <ResourceForm open={open} onOpenChange={setOpen} initial={editing} onSaved={() => { setOpen(false); load(); }} />
    </Card>
  );
}

function ResourceForm({
  open, onOpenChange, initial, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; initial: ResourceRow | null; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<ResourceRow>>({});
  useEffect(() => {
    setForm(initial ?? { category: RESOURCE_CATEGORIES[0], status: "draft", publish_at: new Date().toISOString() });
  }, [initial, open]);
  function set<K extends keyof ResourceRow>(k: K, v: ResourceRow[K]) { setForm((f) => ({ ...f, [k]: v })); }
  async function save() {
    const payload = {
      title: form.title ?? "",
      description: form.description ?? null,
      file_url: form.file_url ?? null,
      file_type: form.file_type ?? null,
      category: form.category ?? RESOURCE_CATEGORIES[0],
      age_group: form.age_group ?? null,
      status: form.status ?? "draft",
      publish_at: form.publish_at ?? new Date().toISOString(),
      resource_type: form.resource_type ?? null,
    };
    if (initial) await supabase.from("hub_resources").update(payload).eq("id", initial.id);
    else await supabase.from("hub_resources").insert(payload);
    onSaved();
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit resource" : "New resource"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Title"><Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Description"><Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <FileDropzone
            label="Downloadable file"
            kind="doc"
            folder="resources"
            value={form.file_url ?? null}
            onChange={(url, meta) => {
              set("file_url", url);
              if (meta?.fileType) set("file_type", meta.fileType.toUpperCase());
            }}
          />
          <Field label="File type (auto-detected)"><Input placeholder="PDF, DOCX…" value={form.file_type ?? ""} onChange={(e) => set("file_type", e.target.value)} /></Field>
          <Field label="Resource type">
            <Select value={form.resource_type ?? ""} onValueChange={(v) => set("resource_type", v)}>
              <SelectTrigger><SelectValue placeholder="Choose type" /></SelectTrigger>
              <SelectContent>
                {["Workbook", "Guide", "Checklist", "Presentation", "Printable", "Template"].map((s) =>
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESOURCE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Age group"><Input placeholder="6–10, Teens…" value={form.age_group ?? ""} onChange={(e) => set("age_group", e.target.value)} /></Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["draft","published","archived"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Publish at">
            <Input type="datetime-local" value={form.publish_at ? new Date(form.publish_at).toISOString().slice(0, 16) : ""}
              onChange={(e) => set("publish_at", new Date(e.target.value).toISOString())} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// --------- Newsletter admin ---------
function NewsletterAdmin() {
  const [rows, setRows] = useState<{ email: string; created_at: string; source: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("hub_newsletter_subscribers")
      .select("email, created_at, source")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as { email: string; created_at: string; source: string | null }[]);
        setLoading(false);
      });
  }, []);
  function exportCsv() {
    const csv = ["email,source,subscribed_at", ...rows.map((r) => `${r.email},${r.source ?? ""},${r.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card className="rounded-2xl border-border/60 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">Newsletter subscribers ({rows.length})</h2>
        <Button size="sm" variant="outline" className="rounded-full" onClick={exportCsv} disabled={rows.length === 0}>
          Export CSV
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No subscribers yet.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {rows.map((r) => (
            <div key={r.email} className="py-2 flex items-center justify-between text-sm">
              <span>{r.email}</span>
              <span className="text-xs text-muted-foreground">{r.source ?? "hub"} · {fmtDate(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
