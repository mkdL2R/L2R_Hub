import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Headphones, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categoryTone, fmtDate, type Article, type Episode, type Resource } from "@/lib/hub-content";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  cat: z.string().optional().catch(""),
});

export const Route = createFileRoute("/hub/search")({
  validateSearch: searchSchema,
  component: SearchTab,
});

function SearchTab() {
  const { q: qInit = "", cat: catInit = "" } = Route.useSearch();
  const [q, setQ] = useState(qInit);
  const [articles, setArticles] = useState<Article[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: e }, { data: r }] = await Promise.all([
        supabase.from("hub_articles").select("*").eq("status", "published").order("publish_at", { ascending: false }),
        supabase.from("hub_podcast_episodes").select("*").eq("status", "published").order("publish_at", { ascending: false }),
        supabase.from("hub_resources").select("*").eq("status", "published").order("publish_at", { ascending: false }),
      ]);
      setArticles((a ?? []) as Article[]);
      setEpisodes((e ?? []) as Episode[]);
      setResources((r ?? []) as Resource[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const inCat = <T extends { category: string }>(x: T) => !catInit || x.category === catInit;
    const match = (haystack: (string | null | undefined)[]) =>
      !t || haystack.some((h) => (h ?? "").toLowerCase().includes(t));
    return {
      articles: articles.filter((x) => inCat(x) && match([x.title, x.excerpt, x.author])),
      episodes: episodes.filter((x) => inCat(x) && match([x.title, x.description])),
      resources: resources.filter((x) => inCat(x) && match([x.title, x.description])),
    };
  }, [q, catInit, articles, episodes, resources]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
          <Search className="h-3 w-3" /> Search
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">Find what you need.</h1>
        {catInit && (
          <p className="text-sm text-muted-foreground">
            Filtering by category: <Badge variant="outline" className={`rounded-full ${categoryTone(catInit)}`}>{catInit}</Badge>
          </p>
        )}
      </header>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search across the library…" className="pl-9 rounded-full" />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Section title="Articles" icon={BookOpen} count={filtered.articles.length}>
            <div className="grid gap-4 md:grid-cols-3">
              {filtered.articles.map((a) => (
                <Link key={a.id} to="/hub/articles/$slug" params={{ slug: a.slug }}>
                  <Card className="rounded-2xl border-border/60 p-4 h-full">
                    <Badge variant="outline" className={`rounded-full text-[10px] mb-2 ${categoryTone(a.category)}`}>{a.category}</Badge>
                    <h3 className="font-serif leading-snug line-clamp-2">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{fmtDate(a.publish_at)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </Section>
          <Section title="Podcasts" icon={Headphones} count={filtered.episodes.length}>
            <div className="grid gap-4 md:grid-cols-3">
              {filtered.episodes.map((e) => (
                <Link key={e.id} to="/hub/podcasts/$slug" params={{ slug: e.slug }}>
                  <Card className="rounded-2xl border-border/60 p-4 h-full">
                    <Badge variant="outline" className={`rounded-full text-[10px] mb-2 ${categoryTone(e.category)}`}>{e.category}</Badge>
                    <h3 className="font-serif leading-snug line-clamp-2">{e.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{fmtDate(e.publish_at)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </Section>
          <Section title="Downloads" icon={Download} count={filtered.resources.length}>
            <div className="grid gap-4 md:grid-cols-3">
              {filtered.resources.map((r) => (
                <Card key={r.id} className="rounded-2xl border-border/60 p-4">
                  <Badge variant="outline" className={`rounded-full text-[10px] mb-2 ${categoryTone(r.category)}`}>{r.category}</Badge>
                  <h3 className="font-serif leading-snug line-clamp-2">{r.title}</h3>
                  {r.file_url && (
                    <a className="text-xs text-primary underline mt-2 inline-block" href={r.file_url} target="_blank" rel="noreferrer">Download</a>
                  )}
                </Card>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-serif inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title} <span className="text-sm text-muted-foreground">({count})</span>
      </h2>
      {children}
    </section>
  );
}