import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, FileText, Search } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/hub-auth";
import { fmtDate, listPublishedResources, categoryTone, type Resource } from "@/lib/hub-content";

export const Route = createFileRoute("/hub/resources/")({ component: ResourcesTab });

function ResourcesTab() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");

  useEffect(() => {
    listPublishedResources().then((r) => {
      setItems(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const matchC = cat === "All" || r.category === cat;
      const matchQ =
        !q || r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q);
      return matchC && matchQ;
    });
  }, [items, query, cat]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-mustard/40 bg-mustard/20 px-3 py-1 text-[11px] uppercase tracking-widest text-mustard-foreground">
          <Download className="h-3 w-3" /> Resources
        </div>
        <h1 className="text-4xl font-serif font-medium tracking-tight">Print, plan, reflect.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Downloadable guides, worksheets, planners and reflection journals to use at home or in the classroom.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources…" className="pl-9 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...RESOURCE_CATEGORIES] as const).map((c) => (
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

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="rounded-3xl border-dashed p-12 text-center text-muted-foreground">No resources yet.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="rounded-2xl border-border/60 p-6 flex flex-col gap-3">
              <Link to="/hub/resources/$id" params={{ id: r.id }} className="flex items-start justify-between gap-3">
                <div className="h-10 w-10 rounded-xl bg-sage/25 text-forest flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                {r.file_type && (
                  <Badge variant="outline" className="rounded-full text-[10px] uppercase border-crayon/30 text-crayon">{r.file_type}</Badge>
                )}
              </Link>
              <Badge variant="outline" className={`rounded-full text-[10px] w-fit ${categoryTone(r.category)}`}>{r.category}</Badge>
              <Link to="/hub/resources/$id" params={{ id: r.id }}>
                <h3 className="font-serif text-lg leading-snug hover:text-primary transition-colors">{r.title}</h3>
              </Link>
              {r.description && <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>}
              <div className="text-xs text-muted-foreground">
                {r.age_group && <>For: {r.age_group} · </>}
                {fmtDate(r.publish_at)}
              </div>
              <div className="mt-auto flex gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full gap-2">
                  <Link to="/hub/resources/$id" params={{ id: r.id }}>Open</Link>
                </Button>
                {r.file_url && (
                  <Button asChild variant="ghost" size="sm" className="rounded-full gap-2">
                    <a href={r.file_url} target="_blank" rel="noreferrer" download>
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}