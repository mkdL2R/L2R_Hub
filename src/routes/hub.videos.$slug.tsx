import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Youtube, Music, Podcast as PodcastIcon } from "lucide-react";
import { fmtDate, fmtDuration, type Episode } from "@/lib/hub-content";

export const Route = createFileRoute("/hub/videos/$slug")({
  component: VideoDetail,
  notFoundComponent: () => (
    <div className="p-16 text-center text-muted-foreground">Video not found.</div>
  ),
  errorComponent: () => (
    <div className="p-16 text-center text-muted-foreground">Could not load video.</div>
  ),
});

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function VideoDetail() {
  const { slug } = Route.useParams();
  const [ep, setEp] = useState<Episode | null>(null);
  const [related, setRelated] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hub_podcast_episodes")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!data) {
        setLoading(false);
        throw notFound();
      }
      setEp(data as Episode);
      const { data: rel } = await supabase
        .from("hub_podcast_episodes")
        .select("*")
        .eq("category", data.category)
        .eq("status", "published")
        .not("youtube_url", "is", null)
        .neq("id", data.id)
        .order("publish_at", { ascending: false })
        .limit(3);
      setRelated((rel ?? []) as Episode[]);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;
  if (!ep) return null;

  const ytId = ep.youtube_url ? extractYouTubeId(ep.youtube_url) : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
        <Link to="/hub/videos"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> All videos</Link>
      </Button>

      <Card className="rounded-3xl border-border/60 overflow-hidden">
        <div className="aspect-video bg-black">
          {ytId ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${ytId}`}
              title={ep.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : ep.cover_url ? (
            <img src={ep.cover_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-6 space-y-3">
          <Badge className="rounded-full bg-primary hover:bg-primary/90"><Video className="h-3 w-3 mr-1" /> Video</Badge>
          <h1 className="text-3xl font-serif">{ep.title}</h1>
          <div className="text-xs text-muted-foreground">
            {fmtDuration(ep.duration_seconds)} · {ep.category} · {fmtDate(ep.publish_at)}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {ep.youtube_url && (
              <Button asChild size="sm" variant="outline" className="rounded-full gap-1">
                <a href={ep.youtube_url} target="_blank" rel="noreferrer"><Youtube className="h-3.5 w-3.5" /> Watch on YouTube</a>
              </Button>
            )}
            {ep.spotify_url && (
              <Button asChild size="sm" variant="outline" className="rounded-full gap-1">
                <a href={ep.spotify_url} target="_blank" rel="noreferrer"><Music className="h-3.5 w-3.5" /> Spotify</a>
              </Button>
            )}
            {ep.apple_url && (
              <Button asChild size="sm" variant="outline" className="rounded-full gap-1">
                <a href={ep.apple_url} target="_blank" rel="noreferrer"><PodcastIcon className="h-3.5 w-3.5" /> Apple</a>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {ep.description && (
        <Card className="rounded-3xl border-border/60 p-8 space-y-3">
          <h2 className="font-serif text-xl">About this video</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{ep.description}</p>
        </Card>
      )}

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl">Related videos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to="/hub/videos/$slug" params={{ slug: r.slug }}>
                <Card className="rounded-2xl border-border/60 overflow-hidden h-full">
                  <div className="aspect-video bg-muted">
                    {r.cover_url && <img src={r.cover_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-4 space-y-1">
                    <Badge variant="outline" className="rounded-full text-[10px]">{r.category}</Badge>
                    <h3 className="font-serif leading-snug line-clamp-2">{r.title}</h3>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}