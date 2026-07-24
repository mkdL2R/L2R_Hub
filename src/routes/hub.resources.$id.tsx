import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { fmtDate, categoryTone, type Resource } from "@/lib/hub-content";

export const Route = createFileRoute("/hub/resources/$id")({
  component: ResourceDetail,
  notFoundComponent: () => (
    <div className="p-16 text-center text-muted-foreground">Resource not found.</div>
  ),
  errorComponent: () => (
    <div className="p-16 text-center text-muted-foreground">Could not load resource.</div>
  ),
});

function ResourceDetail() {
  const { id } = Route.useParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [related, setRelated] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hub_resources")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      if (!data) {
        setLoading(false);
        throw notFound();
      }
      setResource(data as Resource);
      const { data: rel } = await supabase
        .from("hub_resources")
        .select("*")
        .eq("category", data.category)
        .eq("status", "published")
        .neq("id", data.id)
        .order("publish_at", { ascending: false })
        .limit(3);
      setRelated((rel ?? []) as Resource[]);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [id]);

  async function trackAndOpen() {
    if (!resource?.file_url) return;
    window.open(resource.file_url, "_blank", "noopener");
    await supabase.rpc("increment_download", { _resource_id: resource.id });
  }

  if (loading) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;
  if (!resource) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
        <Link to="/hub/resources"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> All resources</Link>
      </Button>

      <Card className="rounded-3xl border-border/60 p-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sage/25 text-forest flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`rounded-full text-[10px] ${categoryTone(resource.category)}`}>
                {resource.category}
              </Badge>
              {(resource.resource_type ?? resource.file_type) && (
                <Badge variant="outline" className="rounded-full text-[10px] uppercase border-crayon/30 text-crayon">
                  {resource.resource_type ?? resource.file_type}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-serif leading-tight">{resource.title}</h1>
            <div className="text-xs text-muted-foreground">
              {resource.age_group && <>For: {resource.age_group} · </>}
              {fmtDate(resource.publish_at)}
              {typeof resource.download_count === "number" && <> · {resource.download_count} downloads</>}
            </div>
          </div>
        </div>

        {resource.description && (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{resource.description}</p>
        )}

        {resource.file_url ? (
          <Button onClick={trackAndOpen} className="rounded-full gap-2 w-fit">
            <Download className="h-4 w-4" /> Download {resource.file_type ?? "file"}
          </Button>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            The file for this resource is being prepared. Check back soon.
          </div>
        )}
      </Card>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl">Related resources</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to="/hub/resources/$id" params={{ id: r.id }}>
                <Card className="rounded-2xl border-border/60 p-4 h-full space-y-2">
                  <Badge variant="outline" className={`rounded-full text-[10px] ${categoryTone(r.category)}`}>
                    {r.category}
                  </Badge>
                  <h3 className="font-serif leading-snug line-clamp-2">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{fmtDate(r.publish_at)}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}