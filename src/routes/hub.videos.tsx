import { createFileRoute } from "@tanstack/react-router";
import { Video, Youtube } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/hub-content";

export const Route = createFileRoute("/hub/videos")({ component: VideosTab });

type Ep = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  youtube_url: string | null;
  category: string;
  publish_at: string;
};

function VideosTab() {
  const [rows, setRows] = useState<Ep[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("hub_podcast_episodes")
      .select("id, slug, title, description, cover_url, youtube_url, category, publish_at")
      .eq("status", "published")
      .not("youtube_url", "is", null)
      .order("publish_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as Ep[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
          <Video className="h-3 w-3" /> Videos
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">Watch, learn, discuss.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Video conversations, workshops and interviews. Featured video content will appear here as we publish.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="rounded-3xl border-dashed p-12 text-center space-y-3">
          <Video className="h-8 w-8 mx-auto text-primary" />
          <h2 className="font-serif text-xl">Videos coming soon.</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            When our team publishes a video (via a podcast episode with a YouTube link), it will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((v) => (
            <Card key={v.id} className="rounded-2xl border-border/60 overflow-hidden">
              <div className="aspect-video bg-muted">
                {v.cover_url && <img src={v.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-5 space-y-2">
                <Badge variant="outline" className="rounded-full text-[10px]">{v.category}</Badge>
                <h3 className="font-serif text-lg leading-snug">{v.title}</h3>
                {v.description && <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{fmtDate(v.publish_at)}</span>
                  {v.youtube_url && (
                    <Button asChild size="sm" variant="outline" className="rounded-full gap-1">
                      <a href={v.youtube_url} target="_blank" rel="noreferrer">
                        <Youtube className="h-3.5 w-3.5" /> Watch
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}