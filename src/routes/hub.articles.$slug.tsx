import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Headphones, Volume2, Pause, ArrowLeft, Share2, Bookmark, Eye } from "lucide-react";
import { fmtDate, type Article, type Episode } from "@/lib/hub-content";
import { useAuthUser } from "@/lib/hub-auth";

export const Route = createFileRoute("/hub/articles/$slug")({
  component: ArticlePage,
  errorComponent: () => <Center>Could not load this article.</Center>,
  notFoundComponent: () => <Center>Article not found.</Center>,
});

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-6 py-20 text-center text-muted-foreground">{children}</div>;
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { user } = useAuthUser();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hub_articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!data) {
        setLoading(false);
        throw notFound();
      }
      setArticle(data as Article);
      // Track view + reading history
      supabase.rpc("increment_article_view", { _article_id: data.id }).then(() => {});
      if (user) {
        supabase.from("hub_reading_history").upsert(
          { user_id: user.id, item_type: "article", item_id: data.id, last_viewed_at: new Date().toISOString() },
          { onConflict: "user_id,item_type,item_id" }
        ).then(() => {});
        supabase
          .from("hub_saved_items")
          .select("id")
          .eq("user_id", user.id)
          .eq("item_type", "article")
          .eq("item_id", data.id)
          .maybeSingle()
          .then(({ data: s }) => setSaved(!!s));
      }
      const [{ data: rel }, { data: eps }] = await Promise.all([
        supabase
          .from("hub_articles")
          .select("*")
          .eq("category", data.category)
          .neq("id", data.id)
          .eq("status", "published")
          .limit(3),
        supabase
          .from("hub_podcast_episodes")
          .select("*")
          .eq("category", data.category)
          .eq("status", "published")
          .limit(2),
      ]);
      setRelated((rel ?? []) as Article[]);
      setEpisodes((eps ?? []) as Episode[]);
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [slug, user]);

  async function toggleSave() {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (!article) return;
    if (saved) {
      await supabase.from("hub_saved_items").delete().match({ user_id: user.id, item_type: "article", item_id: article.id });
      setSaved(false);
    } else {
      await supabase.from("hub_saved_items").insert({ user_id: user.id, item_type: "article", item_id: article.id });
      setSaved(true);
    }
  }

  async function share() {
    if (!article) return;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: article.title, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* noop */ }
  }

  function toggleListen() {
    if (!article || typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(`${article.title}. ${article.content}`);
    utter.rate = 1;
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }

  if (loading) return <Center>Loading…</Center>;
  if (!article) return <Center>Article not found.</Center>;

  return (
    <article className="pb-20">
      <div className="relative h-[44vh] min-h-[280px] w-full bg-muted">
        {article.hero_image_url && (
          <img src={article.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
        <div className="absolute top-4 left-4">
          <Button asChild variant="secondary" size="sm" className="rounded-full">
            <Link to="/hub/articles"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Articles</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 -mt-20 relative">
        <Card className="rounded-3xl border-border/60 p-8 md:p-12 shadow-lg">
          <Badge variant="secondary" className="rounded-full mb-4">{article.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{article.author ?? "L2R Editorial"}</span>
            <span>·</span>
            <span>{fmtDate(article.publish_at)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {article.reading_minutes} min read
            </span>
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={toggleListen} variant="outline" className="rounded-full gap-2">
                {speaking ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {speaking ? "Stop listening" : "Listen to this article"}
              </Button>
              <Button onClick={toggleSave} variant="outline" size="sm" className="rounded-full gap-2">
                <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-primary text-primary" : ""}`} />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button onClick={share} variant="outline" size="sm" className="rounded-full gap-2">
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
              {typeof article.view_count === "number" && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1 ml-auto">
                  <Eye className="h-3.5 w-3.5" /> {article.view_count} views
                </span>
              )}
            </div>
          </div>

          {article.excerpt && (
            <p className="mt-8 text-lg italic text-muted-foreground border-l-2 border-primary/40 pl-4">
              {article.excerpt}
            </p>
          )}

          <div
            className="prose prose-neutral mt-8 max-w-none font-serif text-[17px] leading-relaxed prose-headings:font-serif prose-img:rounded-xl prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content ?? "", { USE_PROFILES: { html: true } }) }}
          />

          <p className="mt-10 text-xs text-muted-foreground italic">
            Comments are intentionally disabled — this is a space for reflection, not reaction.
          </p>
        </Card>

        {episodes.length > 0 && (
          <section className="mt-12 space-y-4">
            <h2 className="text-xl font-serif font-medium inline-flex items-center gap-2">
              <Headphones className="h-4 w-4" /> Related podcast episodes
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {episodes.map((e) => (
                <Card key={e.id} className="rounded-2xl border-border/60 p-5">
                  <h3 className="font-medium">{e.title}</h3>
                  {e.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
                  {e.audio_url && <audio controls src={e.audio_url} className="w-full mt-3" />}
                </Card>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12 space-y-4">
            <h2 className="text-xl font-serif font-medium">Continue reading</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} to="/hub/articles/$slug" params={{ slug: r.slug }}>
                  <Card className="rounded-2xl border-border/60 overflow-hidden h-full">
                    <div className="aspect-[16/10] bg-muted">
                      {r.hero_image_url && (
                        <img src={r.hero_image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium leading-snug line-clamp-2">{r.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2">{r.reading_minutes} min read</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}