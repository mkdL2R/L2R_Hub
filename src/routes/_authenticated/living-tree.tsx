import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  Loader2, Plus, Search, ArrowLeft, TreeDeciduous,
  Sprout, Compass as CompassIcon, Handshake, BookOpen, Backpack, Tent,
  Target, Trophy, Book, Headphones, Heart, Leaf, Palette, ScrollText,
  PartyPopper, Puzzle, Image as ImageIcon, Microscope, Mountain, Sparkles,
  Lightbulb, Brain, Globe, GraduationCap,
  type LucideIcon,
} from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/living-tree")({
  head: () => ({ meta: [{ title: "The Living Tree — L2R" }] }),
  component: LivingTreePage,
});

type Entry = {
  id: string;
  family_id: string;
  student_id: string | null;
  entry_type: string;
  occurred_on: string;
  title: string;
  description: string | null;
  content: Record<string, unknown>;
  attachments: unknown[];
  author_user_id: string | null;
  created_at: string;
};

type Goal = {
  id: string;
  family_id: string;
  year: number;
  title: string;
  description: string | null;
  status: string;
  progress_notes: { note: string; at: string }[];
};

type Family = {
  id: string;
  family_name: string | null;
  family_motto: string | null;
  family_photo_url: string | null;
  created_at: string;
};

const ENTRY_TYPES: { value: string; label: string; icon: LucideIcon; group: "timeline" | "portfolio" | "memory" | "instructor" }[] = [
  { value: "admission", label: "Admission Completed", icon: Sprout, group: "timeline" },
  { value: "compass", label: "Compass Generated", icon: CompassIcon, group: "timeline" },
  { value: "alignment", label: "Family Alignment Meeting", icon: Handshake, group: "timeline" },
  { value: "enrolled", label: "Student Enrolled", icon: BookOpen, group: "timeline" },
  { value: "new_year", label: "New Academic Year", icon: Backpack, group: "timeline" },
  { value: "core_life", label: "Core Life Studies Experience", icon: Tent, group: "timeline" },
  { value: "goal_created", label: "Personal Goal Created", icon: Target, group: "timeline" },
  { value: "goal_achieved", label: "Goal Achieved", icon: Trophy, group: "timeline" },
  { value: "article_read", label: "Article Read", icon: Book, group: "timeline" },
  { value: "podcast_done", label: "Podcast Completed", icon: Headphones, group: "timeline" },
  { value: "wellness", label: "Wellness Session", icon: Heart, group: "timeline" },
  { value: "community", label: "Community Project", icon: Leaf, group: "timeline" },
  { value: "creative", label: "Creative Portfolio", icon: Palette, group: "portfolio" },
  { value: "certificate", label: "Certificate Earned", icon: ScrollText, group: "timeline" },
  { value: "celebration", label: "Celebration", icon: PartyPopper, group: "timeline" },
  { value: "portfolio_project", label: "Project", icon: Puzzle, group: "portfolio" },
  { value: "portfolio_photo", label: "Photo / Artwork", icon: ImageIcon, group: "portfolio" },
  { value: "portfolio_research", label: "Research", icon: Microscope, group: "portfolio" },
  { value: "memory", label: "Memory / Field Trip", icon: Mountain, group: "memory" },
  { value: "instructor_note", label: "Instructor Note", icon: Sparkles, group: "instructor" },
];

const GROWTH_AREAS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "curiosity", label: "Curiosity", icon: Sprout },
  { key: "communication", label: "Communication", icon: Handshake },
  { key: "creativity", label: "Creativity", icon: Lightbulb },
  { key: "critical_thinking", label: "Critical Thinking", icon: Brain },
  { key: "emotional_intelligence", label: "Emotional Intelligence", icon: Heart },
  { key: "responsibility", label: "Responsibility", icon: Target },
  { key: "citizenship", label: "Citizenship", icon: Globe },
  { key: "learning_habits", label: "Learning Habits", icon: GraduationCap },
];

function typeMeta(t: string) {
  return ENTRY_TYPES.find((e) => e.value === t) ?? { value: t, label: t, icon: Leaf, group: "timeline" as const };
}

function monthKey(d: string) {
  return d.slice(0, 7);
}

function LivingTreePage() {
  const { user, loading: userLoading } = useAuthUser();
  const [family, setFamily] = useState<Family | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  async function refresh() {
    if (!user) return;
    setLoading(true);
    const { data: mem } = await supabase
      .from("family_members").select("family_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!mem?.family_id) { setLoading(false); return; }
    const [{ data: fam }, { data: ents }, { data: gs }] = await Promise.all([
      supabase.from("families").select("id,family_name,family_motto,family_photo_url,created_at").eq("id", mem.family_id).maybeSingle(),
      supabase.from("living_tree_entries").select("*").eq("family_id", mem.family_id).order("occurred_on", { ascending: false }),
      supabase.from("family_goals").select("*").eq("family_id", mem.family_id).order("year", { ascending: false }),
    ]);
    setFamily(fam as Family | null);
    setEntries((ents ?? []) as unknown as Entry[]);
    setGoals((gs ?? []) as unknown as Goal[]);
    setLoading(false);
  }

  useEffect(() => { if (!userLoading) refresh(); /* eslint-disable-next-line */ }, [user, userLoading]);

  if (userLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!family) {
    return (
      <Shell>
        <Card className="p-10 text-center rounded-3xl">
          <h2 className="text-xl font-semibold">Plant your family's tree</h2>
          <p className="mt-2 text-muted-foreground">Complete the Parent Journey to begin your Living Tree.</p>
          <Button asChild className="mt-6"><Link to="/parent">Start Parent Journey</Link></Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Overview family={family} entries={entries} />
      <Tabs value={tab} onValueChange={setTab} className="mt-10">
        <TabsList className="flex flex-wrap h-auto bg-sand/60 p-1 rounded-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reflections">Monthly</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="gallery">Memory</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewBody entries={entries} goals={goals} /></TabsContent>
        <TabsContent value="timeline" className="mt-6"><TimelineTab entries={entries} family={family} user={user!} onChange={refresh} /></TabsContent>
        <TabsContent value="reflections" className="mt-6"><ReflectionsTab entries={entries} family={family} user={user!} onChange={refresh} /></TabsContent>
        <TabsContent value="growth" className="mt-6"><GrowthTab entries={entries} /></TabsContent>
        <TabsContent value="portfolio" className="mt-6"><PortfolioTab entries={entries} family={family} user={user!} onChange={refresh} /></TabsContent>
        <TabsContent value="gallery" className="mt-6"><MemoryTab entries={entries} family={family} user={user!} onChange={refresh} /></TabsContent>
        <TabsContent value="goals" className="mt-6"><GoalsTab goals={goals} family={family} user={user!} onChange={refresh} /></TabsContent>
        <TabsContent value="search" className="mt-6"><SearchTab entries={entries} /></TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="L2R" className="h-9 w-9 rounded-xl object-cover" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">L2R Education Hub</div>
              <div className="text-sm font-semibold flex items-center gap-1.5"><TreeDeciduous className="h-3.5 w-3.5" />The Living Tree</div>
            </div>
          </Link>
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1.5" />Dashboard</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

function Overview({ family, entries }: { family: Family; entries: Entry[] }) {
  const since = new Date(family.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = new Date();
  const startYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  const academicYear = `${startYear}–${startYear + 1}`;
  const compass = entries.find((e) => e.entry_type === "compass");
  return (
    <Card className="card-paper p-8 rounded-3xl">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {family.family_photo_url ? (
          <img src={family.family_photo_url} alt="" className="h-28 w-28 rounded-2xl object-cover border border-border/60" />
        ) : (
          <div className="h-28 w-28 rounded-2xl bg-sand flex items-center justify-center text-primary">
            <TreeDeciduous className="h-12 w-12" />
          </div>
        )}
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Family</div>
          <h1 className="font-serif text-4xl font-medium tracking-tight">{family.family_name ?? "Your family"}</h1>
          {family.family_motto && <p className="mt-2 italic text-muted-foreground">"{family.family_motto}"</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" className="rounded-full">L2R member since {since}</Badge>
            <Badge variant="secondary" className="rounded-full">Academic year {academicYear}</Badge>
            {compass && (
              <Badge variant="secondary" className="rounded-full inline-flex items-center gap-1">
                <CompassIcon className="h-3 w-3" /> Compass active
              </Badge>
            )}
          </div>
          {compass?.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{compass.description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function OverviewBody({ entries, goals }: { entries: Entry[]; goals: Goal[] }) {
  const recent = entries.slice(0, 5);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold">Recent on the tree</h3>
        <ul className="mt-4 space-y-3">
          {recent.length === 0 && <li className="text-sm text-muted-foreground">No entries yet — add the first leaf in the Timeline tab.</li>}
          {recent.map((e) => {
            const m = typeMeta(e.entry_type);
            const Icon = m.icon;
            return (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-sand text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.occurred_on).toLocaleDateString()}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold">Family goals in motion</h3>
        <ul className="mt-4 space-y-3">
          {goals.length === 0 && <li className="text-sm text-muted-foreground">Set your first goal in the Goals tab.</li>}
          {goals.slice(0, 5).map((g) => (
            <li key={g.id} className="text-sm">
              <div className="font-medium">{g.title}</div>
              <div className="text-xs text-muted-foreground">{g.year} · {g.status.replace("_", " ")}</div>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-6 rounded-2xl md:col-span-2 bg-sand/40 border-dashed">
        <p className="text-sm text-center text-muted-foreground italic leading-relaxed">
          Education is not measured by grades alone. It is the lifelong story of how a learner, a family, and a community grow together.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Timeline ---------- */
function TimelineTab({ entries, family, user, onChange }: { entries: Entry[]; family: Family; user: { id: string }; onChange: () => void }) {
  const timeline = entries.filter((e) => !e.entry_type.startsWith("portfolio_") && e.entry_type !== "memory" && !e.entry_type.startsWith("monthly_") && e.entry_type !== "instructor_note");
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Timeline</h2>
        <EntryDialog family={family} user={user} onChange={onChange} defaultGroup="timeline" />
      </div>
      <div className="relative pl-8 border-l-2 border-sage">
        {timeline.length === 0 && <p className="text-sm text-muted-foreground">No milestones yet. Plant the first one.</p>}
        {timeline.map((e) => {
          const m = typeMeta(e.entry_type);
          const Icon = m.icon;
          return (
            <div key={e.id} className="relative mb-6">
              <div className="absolute -left-[42px] top-1 h-8 w-8 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <Card className="p-5 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="rounded-full text-xs">{m.label}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(e.occurred_on).toLocaleDateString()}</span>
                </div>
                <h4 className="font-semibold mt-2">{e.title}</h4>
                {e.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{e.description}</p>}
                <ReflectionsBlock content={e.content} />
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReflectionsBlock({ content }: { content: Record<string, unknown> }) {
  const fields: [string, string][] = [
    ["instructor_notes", "Instructor"],
    ["student_reflection", "Student"],
    ["parent_reflection", "Parent"],
  ];
  const present = fields.filter(([k]) => typeof content?.[k] === "string" && (content[k] as string).trim());
  if (!present.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {present.map(([k, label]) => (
        <div key={k} className="text-xs bg-sand/50 rounded-lg p-3">
          <div className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
          <div className="whitespace-pre-wrap text-foreground/80">{content[k] as string}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Add Entry Dialog ---------- */
function EntryDialog({
  family, user, onChange, defaultGroup,
}: { family: Family; user: { id: string }; onChange: () => void; defaultGroup: "timeline" | "portfolio" | "memory" | "instructor" }) {
  const [open, setOpen] = useState(false);
  const types = ENTRY_TYPES.filter((e) => e.group === defaultGroup);
  const [entryType, setEntryType] = useState(types[0]?.value ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [parentR, setParentR] = useState("");
  const [studentR, setStudentR] = useState("");
  const [instructorR, setInstructorR] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("living_tree_entries").insert({
      family_id: family.id,
      entry_type: entryType,
      occurred_on: date,
      title,
      description: description || null,
      content: {
        parent_reflection: parentR || undefined,
        student_reflection: studentR || undefined,
        instructor_notes: instructorR || undefined,
      },
      author_user_id: user.id,
    });
    setBusy(false);
    if (!error) {
      setOpen(false); setTitle(""); setDescription(""); setParentR(""); setStudentR(""); setInstructorR("");
      onChange();
    } else { alert(error.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add to the tree</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => {
                    const Ti = t.icon;
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="inline-flex items-center gap-2"><Ti className="h-3.5 w-3.5" /> {t.label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short, meaningful title" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Parent reflection (optional)</Label>
            <Textarea value={parentR} onChange={(e) => setParentR(e.target.value)} rows={2} />
            <Label className="text-xs">Student reflection (optional)</Label>
            <Textarea value={studentR} onChange={(e) => setStudentR(e.target.value)} rows={2} />
            <Label className="text-xs">Instructor notes (optional)</Label>
            <Textarea value={instructorR} onChange={(e) => setInstructorR(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy || !title.trim()}>{busy ? "Saving…" : "Add to tree"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Monthly Reflections ---------- */
function ReflectionsTab({ entries, family, user, onChange }: { entries: Entry[]; family: Family; user: { id: string }; onChange: () => void }) {
  const reflections = entries.filter((e) => e.entry_type.startsWith("monthly_"));
  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    reflections.forEach((r) => {
      const k = monthKey(r.occurred_on);
      const list = map.get(k) ?? []; list.push(r); map.set(k, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [reflections]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-2xl bg-sage/20">
        <h3 className="font-semibold">This month's reflection</h3>
        <p className="text-sm text-muted-foreground mt-1">A small pause each month becomes a chapter of your family's story.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ReflectionForm family={family} user={user} role="parent" onChange={onChange} prompt="What growth did you notice this month?" />
          <ReflectionForm family={family} user={user} role="student" onChange={onChange} prompt="What are you most proud of this month?" />
          <ReflectionForm family={family} user={user} role="instructor" onChange={onChange} prompt="What strengths became visible?" />
        </div>
      </Card>
      <div>
        <h3 className="font-semibold mb-3">Previous months</h3>
        {grouped.length === 0 && <p className="text-sm text-muted-foreground">Your monthly reflections will appear here.</p>}
        {grouped.map(([k, list]) => (
          <Card key={k} className="p-5 rounded-2xl mb-4">
            <div className="text-sm font-semibold mb-3">
              {new Date(k + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              {k === currentMonth && <Badge variant="secondary" className="ml-2 rounded-full text-xs">current</Badge>}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {list.map((r) => {
                const role = r.entry_type.replace("monthly_", "");
                return (
                  <div key={r.id} className="text-xs bg-sand/50 rounded-xl p-3">
                    <div className="font-semibold uppercase tracking-wider text-muted-foreground">{role}</div>
                    <div className="mt-1 whitespace-pre-wrap">{r.description}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReflectionForm({ family, user, role, prompt, onChange }: { family: Family; user: { id: string }; role: "parent" | "student" | "instructor"; prompt: string; onChange: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("living_tree_entries").insert({
      family_id: family.id,
      entry_type: `monthly_${role}`,
      title: `${role[0].toUpperCase()}${role.slice(1)} monthly reflection`,
      description: text,
      content: { prompt },
      author_user_id: user.id,
    });
    setBusy(false);
    if (!error) { setText(""); onChange(); } else alert(error.message);
  }
  const roleLabel = role[0].toUpperCase() + role.slice(1);
  return (
    <div className="bg-background rounded-xl p-4 border border-border/60">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{roleLabel}</div>
      <div className="text-sm mt-1 font-medium">{prompt}</div>
      <Textarea className="mt-2" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <Button size="sm" className="mt-2 rounded-full" onClick={save} disabled={busy || !text.trim()}>{busy ? "Saving…" : "Save reflection"}</Button>
    </div>
  );
}

/* ---------- Growth ---------- */
function GrowthTab({ entries }: { entries: Entry[] }) {
  const text = entries.map((e) => `${e.title} ${e.description ?? ""}`.toLowerCase()).join(" ");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {GROWTH_AREAS.map((g) => {
        const mentions = (text.match(new RegExp(g.label.toLowerCase(), "g")) || []).length;
        const narrative =
          mentions === 0 ? "A seed waiting for sunlight."
          : mentions < 3 ? "Beginning to take root."
          : mentions < 6 ? "Growing steadily, branch by branch."
          : "A flourishing branch on the tree.";
        const Icon = g.icon;
        return (
          <Card key={g.key} className="p-5 rounded-2xl text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sand text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="mt-3 font-semibold">{g.label}</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{narrative}</p>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Portfolio ---------- */
function PortfolioTab({ entries, family, user, onChange }: { entries: Entry[]; family: Family; user: { id: string }; onChange: () => void }) {
  const items = entries.filter((e) => typeMeta(e.entry_type).group === "portfolio" || e.entry_type === "creative" || e.entry_type === "certificate");
  const byYear = useMemo(() => {
    const map = new Map<string, Entry[]>();
    items.forEach((i) => {
      const y = i.occurred_on.slice(0, 4);
      const list = map.get(y) ?? []; list.push(i); map.set(y, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <EntryDialog family={family} user={user} onChange={onChange} defaultGroup="portfolio" />
      </div>
      {byYear.length === 0 && <p className="text-sm text-muted-foreground">Add projects, artwork, research, and certificates to begin a lifelong portfolio.</p>}
      {byYear.map(([y, list]) => (
        <div key={y} className="mb-6">
          <div className="text-sm font-semibold mb-2 text-muted-foreground">Year {y}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((i) => {
              const m = typeMeta(i.entry_type);
              const Icon = m.icon;
              return (
                <Card key={i.id} className="p-5 rounded-2xl">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 font-semibold text-sm">{i.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(i.occurred_on).toLocaleDateString()}</div>
                  {i.description && <p className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">{i.description}</p>}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Memory Gallery ---------- */
function MemoryTab({ entries, family, user, onChange }: { entries: Entry[]; family: Family; user: { id: string }; onChange: () => void }) {
  const items = entries.filter((e) => e.entry_type === "memory" || e.entry_type === "celebration" || e.entry_type === "community" || e.entry_type === "core_life");
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Memory Gallery</h2>
        <EntryDialog family={family} user={user} onChange={onChange} defaultGroup="memory" />
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground">Field trips, celebrations, and family activities live here.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => {
          const m = typeMeta(i.entry_type);
          const Icon = m.icon;
          return (
            <Card key={i.id} className="overflow-hidden rounded-2xl">
              <div className="h-32 bg-gradient-to-br from-sage/40 to-sand flex items-center justify-center text-primary">
                <Icon className="h-12 w-12" />
              </div>
              <div className="p-4">
                <div className="font-semibold text-sm">{i.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(i.occurred_on).toLocaleDateString()}</div>
                {i.description && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{i.description}</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Goals ---------- */
function GoalsTab({ goals, family, user, onChange }: { goals: Goal[]; family: Family; user: { id: string }; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("family_goals").insert({
      family_id: family.id, year, title, description: description || null, created_by: user.id,
    });
    setBusy(false);
    if (!error) { setOpen(false); setTitle(""); setDescription(""); onChange(); } else alert(error.message);
  }
  async function setStatus(g: Goal, status: string) {
    await supabase.from("family_goals").update({ status }).eq("id", g.id);
    onChange();
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Family Goals</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="h-4 w-4 mr-1" />New goal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Set a family goal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Year</Label><Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value || "0", 10))} /></div>
              <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Volunteer together once a month" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            </div>
            <DialogFooter><Button onClick={add} disabled={busy || !title.trim()}>{busy ? "Saving…" : "Add goal"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {goals.length === 0 && <p className="text-sm text-muted-foreground">Annual family goals — tracked through milestones, never scores.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {goals.map((g) => (
          <Card key={g.id} className="p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="rounded-full text-xs">{g.year}</Badge>
              <Select value={g.status} onValueChange={(v) => setStatus(g, v)}>
                <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="growing">Growing</SelectItem>
                  <SelectItem value="achieved">Achieved</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 font-semibold">{g.title}</div>
            {g.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{g.description}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Search ---------- */
function SearchTab({ entries }: { entries: Entry[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const years = Array.from(new Set(entries.map((e) => e.occurred_on.slice(0, 4)))).sort().reverse();
  const filtered = entries.filter((e) => {
    if (type !== "all" && e.entry_type !== type) return false;
    if (year !== "all" && !e.occurred_on.startsWith(year)) return false;
    if (q) {
      const hay = `${e.title} ${e.description ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <div className="md:col-span-2 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search keyword…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ENTRY_TYPES.map((t) => {
              const Ti = t.icon;
              return (
                <SelectItem key={t.value} value={t.value}>
                  <span className="inline-flex items-center gap-2"><Ti className="h-3.5 w-3.5" /> {t.label}</span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No matching entries.</p>}
        {filtered.map((e) => {
          const m = typeMeta(e.entry_type);
          const Icon = m.icon;
          return (
            <Card key={e.id} className="p-4 rounded-xl flex gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-sand text-primary shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{e.title}</div>
                <div className="text-xs text-muted-foreground">{m.label} · {new Date(e.occurred_on).toLocaleDateString()}</div>
                {e.description && <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{e.description}</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}