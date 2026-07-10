import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Headphones, BookOpen, Download, Sparkles } from "lucide-react";
import {
  listPublishedArticles,
  listPublishedEpisodes,
  listPublishedResources,
  type Article,
  type Episode,
  type Resource,
  fmtDate,
  fmtDuration,
} from "@/lib/hub-content";

export const Route = createFileRoute("/hub/featured")({ component: FeaturedTab });

function FeaturedTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [compassCategories, setCompassCategories] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [a, e, r] = await Promise.all([
        listPublishedArticles(),
        listPublishedEpisodes(),
        listPublishedResources(),
      ]);
      setArticles(a);
      setEpisodes(e);
      setResources(r);
      setLoading(false);
    })().catch(() => setLoading(false));

    // Lightweight recommendation seed: pull category hints from local compass cache
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("l2r:compass-hints") : null;
      if (raw) setCompassCategories(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  const featuredArticle = articles[0];
  const featuredEpisode = episodes.find((e) => e.is_featured) ?? episodes[0];
  const recent = [...articles.slice(0, 2), ...resources.slice(0, 2)].slice(0, 4);
  const recommended = compassCategories.length
    ? articles.filter((a) => compassCategories.includes(a.category)).slice(0, 3)
    : articles.slice(1, 4);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
          <Sparkles className="h-3 w-3" /> Featured
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">A library that grows with your family.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Hand-picked articles, podcasts and printable resources to support parents, students and educators across
          every season of learning.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !featuredArticle && !featuredEpisode ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            {featuredArticle && (
              <Link
                to="/hub/articles/$slug"
                params={{ slug: featuredArticle.slug }}
                className="lg:col-span-3 group block"
              >
                <Card className="overflow-hidden rounded-3xl border-border/60 h-full">
                  <div className="aspect-[16/9] bg-muted">
                    {featuredArticle.hero_image_url && (
                      <img
                        src={featuredArticle.hero_image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    )}
                  </div>
                  <div className="p-7 space-y-3">
                    <Badge variant="secondary" className="rounded-full">
                      <BookOpen className="h-3 w-3 mr-1" /> {featuredArticle.category}
                    </Badge>
                    <h2 className="text-2xl font-serif font-medium leading-snug">{featuredArticle.title}</h2>
                    {featuredArticle.excerpt && (
                      <p className="text-muted-foreground">{featuredArticle.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{featuredArticle.author ?? "L2R Editorial"}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {featuredArticle.reading_minutes} min read
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )}
            {featuredEpisode && (
              <Card className="lg:col-span-2 overflow-hidden rounded-3xl border-border/60">
                <div className="aspect-square bg-gradient-to-br from-sand to-mustard/30">
                  {featuredEpisode.cover_url && (
                    <img src={featuredEpisode.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <Badge variant="secondary" className="rounded-full">
                    <Headphones className="h-3 w-3 mr-1" /> Featured episode
                  </Badge>
                  <h3 className="text-xl font-serif font-medium">{featuredEpisode.title}</h3>
                  {featuredEpisode.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{featuredEpisode.description}</p>
                  )}
                  {featuredEpisode.audio_url && (
                    <audio controls src={featuredEpisode.audio_url} className="w-full" />
                  )}
                  <div className="text-xs text-muted-foreground">
                    {fmtDuration(featuredEpisode.duration_seconds)} · {featuredEpisode.category}
                  </div>
                </div>
              </Card>
            )}
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-medium">Recently added</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {recent.map((item) =>
                "slug" in item ? (
                  <ArticleMini key={item.id} article={item} />
                ) : (
                  <ResourceMini key={item.id} resource={item as Resource} />
                )
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-serif font-medium">
              {compassCategories.length ? "Recommended from your Compass" : "You might enjoy"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {recommended.map((a) => (
                <ArticleMini key={a.id} article={a} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ArticleMini({ article }: { article: Article }) {
  return (
    <Link to="/hub/articles/$slug" params={{ slug: article.slug }}>
      <Card className="h-full rounded-2xl border-border/60 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-[16/10] bg-muted">
          {article.hero_image_url && <img src={article.hero_image_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-4 space-y-2">
          <Badge variant="outline" className="rounded-full text-[10px]">{article.category}</Badge>
          <h3 className="font-medium leading-snug line-clamp-2">{article.title}</h3>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.reading_minutes} min · {fmtDate(article.publish_at)}
          </p>
        </div>
      </Card>
    </Link>
  );
}

function ResourceMini({ resource }: { resource: Resource }) {
  return (
    <Card className="h-full rounded-2xl border-border/60 p-5 space-y-2">
      <Badge variant="outline" className="rounded-full text-[10px]">
        <Download className="h-3 w-3 mr-1" /> {resource.category}
      </Badge>
      <h3 className="font-medium leading-snug">{resource.title}</h3>
      {resource.description && <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>}
      {resource.file_url && (
        <a
          href={resource.file_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
        >
          Download {resource.file_type ?? "file"}
        </a>
      )}
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="rounded-3xl border-dashed border-border/60 p-12 text-center space-y-3">
      <Sparkles className="h-8 w-8 mx-auto text-primary" />
      <h2 className="text-xl font-serif">Your library is just beginning.</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        No content has been published yet. L2R staff can add the first article, podcast episode or resource from the
        admin area.
      </p>
    </Card>
  );
}