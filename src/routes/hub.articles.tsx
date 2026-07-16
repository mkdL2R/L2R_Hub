import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bookmark, Clock, Search, Share2, LayoutGrid, Map as MapIcon, Route as RouteIcon } from "lucide-react";
import { ARTICLE_CATEGORIES, useAuthUser } from "@/lib/hub-auth";
import { fmtDate, listPublishedArticles, categoryTone, type Article } from "@/lib/hub-content";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hub/articles")({ component: ArticlesTab });

function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const { user } = useAuthUser();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"shelf" | "map" | "paths">("shelf");

  useEffect(() => {
    if (view === "map" && typeof window !== "undefined") {
      localStorage.setItem("l2r:hub-map-seen", "1");
    }
  }, [view]);

  useEffect(() => {
    listPublishedArticles().then((a) => {
      setArticles(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("hub_saved_items")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "article")
      .then(({ data }) => setSaved(new Set((data ?? []).map((r) => r.item_id))));
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchCat = cat === "All" || a.category === cat;
      const matchQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.excerpt ?? "").toLowerCase().includes(q) ||
        (a.author ?? "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [articles, query, cat]);

  async function toggleSave(id: string) {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    const next = new Set(saved);
    if (saved.has(id)) {
      await supabase.from("hub_saved_items").delete().match({ user_id: user.id, item_type: "article", item_id: id });
      next.delete(id);
    } else {
      await supabase.from("hub_saved_items").insert({ user_id: user.id, item_type: "article", item_id: id });
      next.add(id);
    }
    setSaved(next);
  }

  async function share(a: Article) {
    const url = `${window.location.origin}/hub/articles/${a.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: a.title, url });
      else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-sketch/25 bg-sketch/10 px-3 py-1 text-[11px] uppercase tracking-widest text-sketch">
          <Bookmark className="h-3 w-3" /> Articles
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">A reading room, growing.</h1>
        <div className="margin-note">flip the shelf into a map or a path — same books, new lens</div>
        <p className="max-w-2xl text-muted-foreground">
          Reflections, research and practical guidance — organized by the themes that matter most to family life.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="pl-9 rounded-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...ARTICLE_CATEGORIES] as const).map((c) => (
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
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
          {[
            { k: "shelf", label: "Shelf", icon: LayoutGrid },
            { k: "map", label: "Map", icon: MapIcon },
            { k: "paths", label: "Paths", icon: RouteIcon },
          ].map((v) => (
            <button
              key={v.k}
              onClick={() => setView(v.k as typeof view)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                view === v.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <v.icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="rounded-3xl border-dashed p-12 text-center text-muted-foreground">No articles match.</Card>
      ) : view === "map" ? (
        <MapView articles={filtered} />
      ) : view === "paths" ? (
        <PathsView articles={filtered} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="rounded-2xl border-border/60 overflow-hidden flex flex-col">
              <Link to="/hub/articles/$slug" params={{ slug: a.slug }} className="block">
                <div className="aspect-[16/10] bg-muted">
                  {a.hero_image_url && <img src={a.hero_image_url} alt="" className="h-full w-full object-cover" />}
                </div>
              </Link>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <Badge variant="outline" className={`rounded-full text-[10px] w-fit ${categoryTone(a.category)}`}>{a.category}</Badge>
                <Link to="/hub/articles/$slug" params={{ slug: a.slug }}>
                  <h3 className="font-serif text-lg leading-snug">{a.title}</h3>
                </Link>
                {a.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>}
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {a.reading_minutes} min · {fmtDate(a.publish_at)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleSave(a.id)}>
                      <Bookmark
                        className={`h-3.5 w-3.5 ${saved.has(a.id) ? "fill-primary text-primary" : ""}`}
                      />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => share(a)}>
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByCategory(articles: Article[]): Array<{ category: string; items: Article[] }> {
  const map = new Map<string, Article[]>();
  for (const a of articles) {
    const arr = map.get(a.category) ?? [];
    arr.push(a);
    map.set(a.category, arr);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

function MapView({ articles }: { articles: Article[] }) {
  const groups = groupByCategory(articles);
  return (
    <div className="relative">
      <div className="margin-note absolute -top-6 right-2">clusters of curiosity</div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.category} className="card-paper p-5">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`rounded-full ${categoryTone(g.category)}`}>{g.category}</Badge>
              <span className="text-xs text-muted-foreground">{g.items.length} article{g.items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="relative mt-4 min-h-[180px]">
              {g.items.slice(0, 6).map((a, i) => {
                const cols = 3;
                const row = Math.floor(i / cols);
                const col = i % cols;
                const left = `${10 + col * 32 + (row % 2 ? 8 : 0)}%`;
                const top = `${row * 60}px`;
                return (
                  <Link
                    key={a.id}
                    to="/hub/articles/$slug"
                    params={{ slug: a.slug }}
                    className="group absolute h-12 w-12 -translate-x-1/2 rounded-full border border-border bg-card/80 shadow-sm backdrop-blur transition-transform hover:scale-110"
                    style={{ left, top }}
                    title={a.title}
                  >
                    <span className="sr-only">{a.title}</span>
                    <span className="absolute left-1/2 top-14 w-40 -translate-x-1/2 text-center text-[10px] leading-tight text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {a.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PathsView({ articles }: { articles: Article[] }) {
  const groups = groupByCategory(articles);
  return (
    <div className="space-y-8">
      <div className="margin-note">follow a path, one step at a time</div>
      {groups.map((g) => (
        <div key={g.category} className="card-paper p-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className={`rounded-full ${categoryTone(g.category)}`}>{g.category}</Badge>
              <h3 className="mt-2 font-serif text-xl">A path through {g.category.toLowerCase()}</h3>
            </div>
            <span className="text-xs text-muted-foreground">{g.items.length} step{g.items.length === 1 ? "" : "s"}</span>
          </div>
          <ol className="mt-5 space-y-3">
            {g.items.map((a, i) => (
              <li key={a.id}>
                <Link
                  to="/hub/articles/$slug"
                  params={{ slug: a.slug }}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur hover-lift"
                >
                  <div className="icon-badge h-9 w-9 text-primary font-semibold">{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-serif text-base leading-tight">{a.title}</div>
                    {a.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{a.excerpt}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {a.reading_minutes}m
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}