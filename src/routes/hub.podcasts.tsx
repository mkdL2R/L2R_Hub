import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bookmark, Headphones, Search } from "lucide-react";
import { PODCAST_CATEGORIES, useAuthUser } from "@/lib/hub-auth";
import { fmtDate, fmtDuration, listPublishedEpisodes, categoryTone, type Episode } from "@/lib/hub-content";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hub/podcasts")({ component: PodcastsTab });

function PodcastsTab() {
  const [eps, setEps] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const { user } = useAuthUser();
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    listPublishedEpisodes().then((e) => {
      setEps(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("hub_saved_items")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "podcast")
      .then(({ data }) => setSaved(new Set((data ?? []).map((r) => r.item_id))));
  }, [user]);

  const featured = eps.find((e) => e.is_featured);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return eps.filter((e) => {
      const matchC = cat === "All" || e.category === cat;
      const matchQ = !q || e.title.toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q);
      return matchC && matchQ;
    });
  }, [eps, query, cat]);

  async function toggleSave(id: string) {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    const next = new Set(saved);
    if (saved.has(id)) {
      await supabase.from("hub_saved_items").delete().match({ user_id: user.id, item_type: "podcast", item_id: id });
      next.delete(id);
    } else {
      await supabase.from("hub_saved_items").insert({ user_id: user.id, item_type: "podcast", item_id: id });
      next.add(id);
    }
    setSaved(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-crayon/25 bg-crayon/10 px-3 py-1 text-[11px] uppercase tracking-widest text-crayon">
          <Headphones className="h-3 w-3" /> Podcasts
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">Conversations for the drive home.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Conversations with educators, parents and students — listen while you walk, cook, or unwind.
        </p>
      </header>

      {featured && (
        <Card className="rounded-3xl border-border/60 overflow-hidden bg-gradient-to-br from-sand to-mustard/20">
          <div className="grid md:grid-cols-3 gap-6 p-6">
            <div className="aspect-square rounded-2xl bg-muted overflow-hidden">
              {featured.cover_url && <img src={featured.cover_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="md:col-span-2 space-y-3">
              <Badge className="rounded-full bg-primary hover:bg-primary/90">
                <Headphones className="h-3 w-3 mr-1" /> Featured episode
              </Badge>
              <h2 className="text-2xl font-serif">{featured.title}</h2>
              {featured.description && <p className="text-muted-foreground">{featured.description}</p>}
              {featured.audio_url && <audio controls src={featured.audio_url} className="w-full" />}
              <div className="text-xs text-muted-foreground">
                {fmtDuration(featured.duration_seconds)} · {featured.category} · {fmtDate(featured.publish_at)}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search episodes…" className="pl-9 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...PODCAST_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} className="rounded-2xl border-border/60 overflow-hidden flex flex-col">
              <div className="aspect-square bg-gradient-to-br from-sand to-mustard/30">
                {e.cover_url && <img src={e.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                <Badge variant="outline" className={`rounded-full text-[10px] w-fit ${categoryTone(e.category)}`}>{e.category}</Badge>
                <h3 className="font-serif text-lg leading-snug">{e.title}</h3>
                {e.description && <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>}
                {e.audio_url && <audio controls src={e.audio_url} className="w-full" />}
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <span>{fmtDuration(e.duration_seconds)} · {fmtDate(e.publish_at)}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleSave(e.id)}>
                    <Bookmark className={`h-3.5 w-3.5 ${saved.has(e.id) ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}