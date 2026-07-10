import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones, Music, Podcast, Youtube } from "lucide-react";
import { fmtDate, fmtDuration, type Episode } from "@/lib/hub-content";

export const Route = createFileRoute("/hub/podcasts/$slug")({
  component: PodcastPage,
  notFoundComponent: () => <div className="p-16 text-center text-muted-foreground">Episode not found.</div>,
  errorComponent: () => <div className="p-16 text-center text-muted-foreground">Could not load episode.</div>,
});

function PodcastPage() {
  const { slug } = Route.useParams();
  const [ep, setEp] = useState<Episode | null>(null);
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
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;
  if (!ep) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
        <Link to="/hub/podcasts"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> All podcasts</Link>
      </Button>
      <Card className="rounded-3xl border-border/60 overflow-hidden">
        <div className="grid md:grid-cols-3 gap-6 p-6">
          <div className="aspect-square rounded-2xl bg-muted overflow-hidden">
            {ep.cover_url && <img src={ep.cover_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="md:col-span-2 space-y-3">
            <Badge className="rounded-full bg-primary hover:bg-primary/90"><Headphones className="h-3 w-3 mr-1" /> Episode {ep.episode_number ?? ""}</Badge>
            <h1 className="text-3xl font-serif">{ep.title}</h1>
            <div className="text-xs text-muted-foreground">
              {fmtDuration(ep.duration_seconds)} · {ep.category} · {fmtDate(ep.publish_at)}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {ep.spotify_url && (
                <Button asChild size="sm" variant="outline" className="rounded-full gap-1">
                  <a href={ep.spotify_url} target="_blank" rel="noreferrer"><Music className="h-3.5 w-3.5" /> Spotify</a>
                </Button>
              )}
              {ep.apple_url && (
                <Button asChild size="sm" variant="outline" className="rounded-full gap-1">
                  <a href={ep.apple_url} target="_blank" rel="noreferrer"><Podcast className="h-3.5 w-3.5" /> Apple</a>
                </Button>
              )}
              {ep.youtube_url && (
                <Button asChild size="sm" variant="outline" className="rounded-full gap-1">
                  <a href={ep.youtube_url} target="_blank" rel="noreferrer"><Youtube className="h-3.5 w-3.5" /> YouTube</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {ep.description && (
        <Card className="rounded-3xl border-border/60 p-8 space-y-3">
          <h2 className="font-serif text-xl">About this episode</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{ep.description}</p>
        </Card>
      )}

      {ep.transcript && (
        <Card className="rounded-3xl border-border/60 p-8 space-y-3">
          <h2 className="font-serif text-xl">Transcript</h2>
          <div className="prose prose-neutral max-w-none font-serif whitespace-pre-wrap">{ep.transcript}</div>
        </Card>
      )}
    </div>
  );
}