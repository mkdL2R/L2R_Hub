import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tag as TagIcon, BookOpen, Headphones, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categoryTone } from "@/lib/hub-content";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/hub/categories")({ component: CategoriesTab });

function CategoriesTab() {
  const [articles, setArticles] = useState<{ category: string }[]>([]);
  const [episodes, setEpisodes] = useState<{ category: string }[]>([]);
  const [downloads, setDownloads] = useState<{ category: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: e }, { data: r }] = await Promise.all([
        supabase.from("hub_articles").select("category").eq("status", "published"),
        supabase.from("hub_podcast_episodes").select("category").eq("status", "published"),
        supabase.from("hub_resources").select("category").eq("status", "published"),
      ]);
      setArticles((a ?? []) as { category: string }[]);
      setEpisodes((e ?? []) as { category: string }[]);
      setDownloads((r ?? []) as { category: string }[]);
    })();
  }, []);

  const counts = useMemo(() => {
    const acc: Record<string, { articles: number; podcasts: number; downloads: number }> = {};
    for (const x of articles) (acc[x.category] ??= { articles: 0, podcasts: 0, downloads: 0 }).articles++;
    for (const x of episodes) (acc[x.category] ??= { articles: 0, podcasts: 0, downloads: 0 }).podcasts++;
    for (const x of downloads) (acc[x.category] ??= { articles: 0, podcasts: 0, downloads: 0 }).downloads++;
    return acc;
  }, [articles, episodes, downloads]);

  const sorted = Object.entries(counts).sort(
    (a, b) => b[1].articles + b[1].podcasts + b[1].downloads - (a[1].articles + a[1].podcasts + a[1].downloads)
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-sage/40 bg-sage/25 px-3 py-1 text-[11px] uppercase tracking-widest text-sage-foreground">
          <TagIcon className="h-3 w-3" /> Categories
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">Browse by theme.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Every article, podcast episode and download grouped by topic — pick a theme that matches your season.
        </p>
      </header>

      {sorted.length === 0 ? (
        <Card className="rounded-3xl border-dashed p-12 text-center text-muted-foreground">
          No published content yet.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map(([cat, c]) => (
            <Link
              key={cat}
              to="/hub/search"
              search={{ q: "", cat }}
              className="block"
            >
              <Card className="rounded-2xl border-border/60 p-6 hover:shadow-md transition-shadow h-full">
                <Badge variant="outline" className={`rounded-full text-[10px] mb-3 ${categoryTone(cat)}`}>{cat}</Badge>
                <h3 className="font-serif text-xl mb-3">{cat}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {c.articles} articles</span>
                  <span className="inline-flex items-center gap-1"><Headphones className="h-3.5 w-3.5" /> {c.podcasts} episodes</span>
                  <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {c.downloads} downloads</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}