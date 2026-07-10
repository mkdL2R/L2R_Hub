import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Bookmark, BookOpen, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { fmtDate, type Article, type Episode } from "@/lib/hub-content";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/hub/bookmarks")({ component: BookmarksTab });

function BookmarksTab() {
  const { user, loading: authLoading } = useAuthUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: saved } = await supabase
        .from("hub_saved_items")
        .select("item_id, item_type")
        .eq("user_id", user.id);
      const aIds = (saved ?? []).filter((s) => s.item_type === "article").map((s) => s.item_id);
      const pIds = (saved ?? []).filter((s) => s.item_type === "podcast").map((s) => s.item_id);
      const [{ data: a }, { data: e }] = await Promise.all([
        aIds.length ? supabase.from("hub_articles").select("*").in("id", aIds) : Promise.resolve({ data: [] as Article[] }),
        pIds.length ? supabase.from("hub_podcast_episodes").select("*").in("id", pIds) : Promise.resolve({ data: [] as Episode[] }),
      ]);
      setArticles((a ?? []) as Article[]);
      setEpisodes((e ?? []) as Episode[]);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center space-y-4">
        <Bookmark className="h-8 w-8 mx-auto text-primary" />
        <h1 className="text-3xl font-serif">Save what matters.</h1>
        <p className="text-muted-foreground">Sign in to bookmark articles and podcasts you want to revisit.</p>
        <Link to="/auth" className="inline-block rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
          <Bookmark className="h-3 w-3" /> Your library
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">Saved for later.</h1>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : articles.length + episodes.length === 0 ? (
        <Card className="rounded-3xl border-dashed p-12 text-center text-muted-foreground">Nothing saved yet.</Card>
      ) : (
        <>
          {articles.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-serif inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Articles</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {articles.map((a) => (
                  <Link key={a.id} to="/hub/articles/$slug" params={{ slug: a.slug }}>
                    <Card className="rounded-2xl border-border/60 p-4 h-full">
                      <Badge variant="outline" className="rounded-full text-[10px] mb-2">{a.category}</Badge>
                      <h3 className="font-serif leading-snug line-clamp-2">{a.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2">{fmtDate(a.publish_at)}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {episodes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-serif inline-flex items-center gap-2"><Headphones className="h-4 w-4 text-primary" /> Podcasts</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {episodes.map((e) => (
                  <Link key={e.id} to="/hub/podcasts/$slug" params={{ slug: e.slug }}>
                    <Card className="rounded-2xl border-border/60 p-4 h-full">
                      <Badge variant="outline" className="rounded-full text-[10px] mb-2">{e.category}</Badge>
                      <h3 className="font-serif leading-snug line-clamp-2">{e.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2">{fmtDate(e.publish_at)}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}