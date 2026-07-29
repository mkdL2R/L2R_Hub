import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Compass, Sprout, BookOpen, TreeDeciduous, ArrowRight, PartyPopper,
  LayoutDashboard, Users, GraduationCap, CalendarClock, MessageSquare,
  Library, Settings, UserCircle, LogOut, Loader2, Bell, Sparkles,
  Target, ChevronRight, PlusCircle, Pencil, Check, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/lib/identity";
import { useAdmissionsProgress } from "@/lib/admissions";
import { AdmissionsProgress } from "@/components/admissions/AdmissionsProgress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/family-dashboard")({
  head: () => ({ meta: [{ title: "Family Dashboard — L2R" }] }),
  component: FamilyDashboard,
});

type Student = {
  id: string;
  full_name: string;
  grade_level: string | null;
  preferred_subjects: string[] | null;
  learning_style: string | null;
  user_id: string | null;
};

type Meeting = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  instructor_id: string;
  meeting_notes: string | null;
};

type EcosystemProfile = {
  parenting_style: string | null;
  values_summary: string | null;
  support_network: string | null;
  goals: string[] | null;
  challenges: string[] | null;
  notes: string | null;
  daily_routine: Record<string, unknown> | null;
};

type LivingTreeEntry = {
  id: string;
  entry_type: string;
  title: string;
  description: string | null;
  occurred_on: string;
};

type InstructorMini = { user_id: string; preferred_name: string | null; email: string | null };

const SIDEBAR: { to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/family-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/compass", label: "Family Compass", icon: Compass },
  { to: "/living-tree", label: "Living Tree", icon: TreeDeciduous },
  { to: "/student", label: "Add Child", icon: GraduationCap },
  { to: "/alignment-meeting", label: "Alignment Meetings", icon: CalendarClock },
  { to: "/hub", label: "Growth Hub", icon: Sprout },
  { to: "/hub/bookmarks", label: "Saved Resources", icon: Library },
];

function FamilyDashboard() {
  const { identity, loading: idLoading } = useIdentity();
  const admissions = useAdmissionsProgress();
  const [students, setStudents] = useState<Student[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [ecosystem, setEcosystem] = useState<EcosystemProfile | null>(null);
  const [entries, setEntries] = useState<LivingTreeEntry[]>([]);
  const [instructors, setInstructors] = useState<Record<string, InstructorMini>>({});
  const [loading, setLoading] = useState(true);

  const familyId = identity?.family_id ?? null;

  useEffect(() => {
    if (idLoading) return;
    if (!familyId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [studs, mts, eco, ents] = await Promise.all([
        supabase.from("students")
          .select("id,full_name,grade_level,preferred_subjects,learning_style,user_id")
          .eq("family_id", familyId).order("created_at", { ascending: true }),
        supabase.from("alignment_meetings")
          .select("id,scheduled_at,duration_minutes,status,instructor_id,meeting_notes")
          .eq("family_id", familyId).order("scheduled_at", { ascending: true }),
        supabase.from("ecosystem_profiles")
          .select("parenting_style,values_summary,support_network,goals,challenges,notes,daily_routine")
          .eq("family_id", familyId).maybeSingle(),
        supabase.from("living_tree_entries")
          .select("id,entry_type,title,description,occurred_on")
          .eq("family_id", familyId).order("occurred_on", { ascending: false }).limit(5),
      ]);
      setStudents((studs.data ?? []) as Student[]);
      setMeetings((mts.data ?? []) as Meeting[]);
      setEcosystem((eco.data ?? null) as EcosystemProfile | null);
      setEntries((ents.data ?? []) as LivingTreeEntry[]);

      const instructorIds = Array.from(new Set((mts.data ?? []).map((m) => m.instructor_id).filter(Boolean)));
      if (instructorIds.length) {
        const { data: profs } = await supabase.from("profiles")
          .select("user_id,preferred_name,email").in("user_id", instructorIds);
        const map: Record<string, InstructorMini> = {};
        (profs ?? []).forEach((p) => { map[p.user_id] = p as InstructorMini; });
        setInstructors(map);
      }
      setLoading(false);
    })();
  }, [familyId, idLoading]);

  if (idLoading || (familyId && loading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const parentName = identity?.profile?.preferred_name?.split(" ")[0] ?? null;
  const family = identity?.family as { family_name?: string | null } | null;
  const familyName = family?.family_name ?? "Your family";
  const enrolled = admissions.enrolled;
  const nextStep = admissions.nextStep;
  const now = Date.now();
  const upcomingMeetings = meetings.filter((m) => new Date(m.scheduled_at).getTime() >= now && m.status !== "cancelled");
  const nextMeeting = upcomingMeetings[0] ?? null;
  const assignedInstructor = nextMeeting ? instructors[nextMeeting.instructor_id] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <TopBar name={parentName} />
          <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
            {!familyId ? (
              <EmptyFamily />
            ) : (
              <>
                <HeroWelcome
                  familyName={familyName}
                  parentName={parentName}
                  enrolled={enrolled}
                  nextStep={nextStep}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                  <FamilyOverviewCard
                    familyName={familyName}
                    students={students}
                    enrolled={enrolled}
                    membership={identity?.profile?.membership_status ?? "applicant"}
                    instructor={assignedInstructor}
                    nextMeeting={nextMeeting}
                  />
                  <NotificationsCard
                    nextMeeting={nextMeeting}
                    instructor={assignedInstructor}
                    admissionsNext={nextStep}
                  />
                  <AdmissionsCard admissions={admissions} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <CompassCard ecosystem={ecosystem} />
                  <LivingTreeCard entries={entries} />
                </div>

                <ChildrenCard students={students} />

                <div className="grid gap-6 lg:grid-cols-2">
                  <UpcomingCard meetings={upcomingMeetings} instructors={instructors} entries={entries} />
                  <ResourcesCard />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ------------- Layout ---------------

function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-border/60 bg-card/40 backdrop-blur min-h-screen sticky top-0 flex-col">
      <Link to="/" className="flex items-center gap-3 px-6 py-5 border-b border-border/50">
        <img src={logoAsset.url} alt="L2R" className="h-9 w-9 rounded-xl object-cover" />
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">L2R</div>
          <div className="text-sm font-semibold">Family</div>
        </div>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {SIDEBAR.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            activeOptions={{ exact: it.to === "/family-dashboard" }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors data-[status=active]:bg-primary/10 data-[status=active]:text-primary data-[status=active]:font-medium"
          >
            <it.icon className="h-4 w-4" />{it.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-border/50">
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
          <Settings className="h-4 w-4" />Settings
        </Link>
      </div>
    </aside>
  );
}

function TopBar({ name }: { name: string | null }) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  return (
    <div className="border-b border-border/50 bg-background/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {name ? <>Signed in as <span className="text-foreground font-medium">{name}</span></> : "Signed in"}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/profile"><UserCircle className="h-4 w-4 mr-1.5" />Profile</Link></Button>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1.5" />Sign out</Button>
        </div>
      </div>
    </div>
  );
}

// ------------- Sections ---------------

function HeroWelcome({
  familyName, parentName, enrolled, nextStep,
}: { familyName: string; parentName: string | null; enrolled: boolean; nextStep: ReturnType<typeof useAdmissionsProgress>["nextStep"] }) {
  return (
    <div className="card-paper rounded-3xl p-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back{parentName ? `, ${parentName}` : ""}</div>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">{familyName}</h1>
        <p className="mt-2 text-muted-foreground">Your family's home for the L2R journey.</p>
      </div>
      {enrolled ? (
        <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1.5">
          <PartyPopper className="h-3.5 w-3.5" /> Enrolled
        </Badge>
      ) : nextStep ? (
        <Button asChild size="lg"><Link to={nextStep.to as string}>Continue: {nextStep.label} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      ) : null}
    </div>
  );
}

function FamilyOverviewCard({
  familyName, students, enrolled, membership, instructor, nextMeeting,
}: {
  familyName: string; students: Student[]; enrolled: boolean;
  membership: string; instructor: InstructorMini | null; nextMeeting: Meeting | null;
}) {
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <SectionHeader icon={Users} title="Family Overview" />
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="Family"><span className="font-medium">{familyName}</span></Row>
        <Row label="Children">{students.length ? `${students.length} on file` : "None added yet"}</Row>
        <Row label="Status">
          <Badge variant="outline" className="capitalize">{enrolled ? "Enrolled" : membership}</Badge>
        </Row>
        <Row label="Instructor">{instructor?.preferred_name ?? instructor?.email ?? "Not yet assigned"}</Row>
        <Row label="Alignment">
          {nextMeeting ? (
            <span>{new Date(nextMeeting.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
          ) : "No meeting scheduled"}
        </Row>
      </dl>
    </Card>
  );
}

function AdmissionsCard({ admissions }: { admissions: ReturnType<typeof useAdmissionsProgress> }) {
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <SectionHeader icon={Target} title="Admissions Progress" />
      <div className="mt-4">
        {admissions.loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <AdmissionsProgress steps={admissions.steps} />
        )}
      </div>
    </Card>
  );
}

function NotificationsCard({
  nextMeeting, instructor, admissionsNext,
}: { nextMeeting: Meeting | null; instructor: InstructorMini | null; admissionsNext: ReturnType<typeof useAdmissionsProgress>["nextStep"] }) {
  const items: { icon: typeof Bell; text: string; to?: string }[] = [];
  if (nextMeeting) {
    items.push({
      icon: CalendarClock,
      text: `Alignment meeting ${new Date(nextMeeting.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} with ${instructor?.preferred_name ?? "your instructor"}`,
      to: "/alignment-meeting",
    });
  }
  if (admissionsNext) {
    items.push({ icon: Sparkles, text: `Next admissions step: ${admissionsNext.label}`, to: admissionsNext.to });
  }
  if (!items.length) items.push({ icon: Bell, text: "You're all caught up. No new notifications." });
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <SectionHeader icon={Bell} title="Notifications" />
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3">
            <it.icon className="h-4 w-4 text-primary mt-0.5" />
            {it.to ? <Link to={it.to} className="hover:text-primary">{it.text}</Link> : <span className="text-muted-foreground">{it.text}</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CompassCard({ ecosystem }: { ecosystem: EcosystemProfile | null }) {
  const compass = (ecosystem?.daily_routine as { compass?: Record<string, unknown> } | null)?.compass ?? null;
  const compassStrengths = Array.isArray((compass as { strengths?: unknown })?.strengths)
    ? ((compass as { strengths: string[] }).strengths)
    : [];
  const compassGrowth = Array.isArray((compass as { growth?: unknown })?.growth)
    ? ((compass as { growth: string[] }).growth)
    : [];
  const pathway = (compass as { pathway?: { summary?: string; recommendations?: string[] } } | null)?.pathway ?? null;
  const strengths = compassStrengths.length ? compassStrengths : (ecosystem?.goals ?? []);
  const growth = compassGrowth.length ? compassGrowth : (ecosystem?.challenges ?? []);
  const summary = pathway?.summary ?? ecosystem?.values_summary ?? null;
  const recommendations = Array.isArray(pathway?.recommendations) && pathway!.recommendations!.length
    ? pathway!.recommendations!
    : (ecosystem?.notes ? [ecosystem.notes] : []);
  const hasCompass = !!(compass || ecosystem?.values_summary || strengths.length || growth.length);
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <div className="flex items-center justify-between">
        <SectionHeader icon={Compass} title="Family Compass" />
        <Button asChild variant="ghost" size="sm"><Link to="/compass">Open <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
      </div>
      {hasCompass ? (
        <div className="mt-4 space-y-4 text-sm">
          {summary ? (
            <p className="text-muted-foreground italic">"{summary}"</p>
          ) : null}
          {strengths.length ? (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Strengths & goals</div>
              <div className="flex flex-wrap gap-1.5">{strengths.map((g) => <Badge key={g} variant="secondary">{g}</Badge>)}</div>
            </div>
          ) : null}
          {growth.length ? (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Growth areas</div>
              <div className="flex flex-wrap gap-1.5">{growth.map((g) => <Badge key={g} variant="outline">{g}</Badge>)}</div>
            </div>
          ) : null}
          {recommendations.length ? (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Recommendations</div>
              <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                {recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Your Family Compass hasn't been generated yet.</p>
          <Button asChild size="sm" variant="outline"><Link to="/compass">Generate Compass</Link></Button>
        </div>
      )}
    </Card>
  );
}

function LivingTreeCard({ entries }: { entries: LivingTreeEntry[] }) {
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <div className="flex items-center justify-between">
        <SectionHeader icon={TreeDeciduous} title="Living Tree" />
        <Button asChild variant="ghost" size="sm"><Link to="/living-tree">Open <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
      </div>
      {entries.length ? (
        <ul className="mt-4 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="border-l-2 border-primary/30 pl-3">
              <div className="text-xs text-muted-foreground">{new Date(e.occurred_on).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
              <div className="text-sm font-medium">{e.title}</div>
              {e.description ? <div className="text-xs text-muted-foreground line-clamp-2">{e.description}</div> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Your family's timeline will appear here as milestones are recorded.</p>
      )}
    </Card>
  );
}

function ChildrenCard({ students }: { students: Student[] }) {
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <div className="flex items-center justify-between">
        <SectionHeader icon={GraduationCap} title="Children" />
        <Button asChild variant="ghost" size="sm"><Link to="/student"><PlusCircle className="h-4 w-4 mr-1.5" />Add child</Link></Button>
      </div>
      {students.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link
              key={s.id}
              to={s.user_id ? "/student-dashboard" : "/people"}
              className="rounded-2xl border border-border/60 p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {s.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.full_name}</div>
                  <div className="text-xs text-muted-foreground">{s.grade_level ?? "Grade —"}</div>
                </div>
              </div>
              {s.preferred_subjects?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.preferred_subjects.slice(0, 3).map((sub) => (
                    <Badge key={sub} variant="secondary" className="text-[10px]">{sub}</Badge>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 text-xs text-muted-foreground">
                {s.user_id ? "Learner account active" : "Awaiting invite acceptance"}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">No children added yet. Start a Student Journey to add one.</p>
          <Button asChild className="mt-4"><Link to="/student">Add a child</Link></Button>
        </div>
      )}
    </Card>
  );
}

function UpcomingCard({
  meetings, instructors, entries,
}: { meetings: Meeting[]; instructors: Record<string, InstructorMini>; entries: LivingTreeEntry[] }) {
  const items: { when: string; label: string; sub: string; to: string; icon: typeof CalendarClock }[] = [];
  meetings.slice(0, 3).forEach((m) => items.push({
    when: new Date(m.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    label: `Alignment meeting${instructors[m.instructor_id]?.preferred_name ? ` with ${instructors[m.instructor_id].preferred_name}` : ""}`,
    sub: `${m.duration_minutes} min · ${m.status}`,
    to: "/alignment-meeting",
    icon: CalendarClock,
  }));
  entries.filter((e) => ["goal_created", "new_year", "core_life", "celebration"].includes(e.entry_type))
    .slice(0, 2).forEach((e) => items.push({
      when: new Date(e.occurred_on).toLocaleDateString(),
      label: e.title,
      sub: "Milestone",
      to: "/living-tree",
      icon: Target,
    }));
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <SectionHeader icon={CalendarClock} title="Upcoming Activities" />
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((it, i) => (
            <li key={i}>
              <Link to={it.to} className="flex items-start gap-3 rounded-lg p-2 hover:bg-accent">
                <it.icon className="h-4 w-4 text-primary mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{it.label}</div>
                  <div className="text-xs text-muted-foreground">{it.when} · {it.sub}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No upcoming activities. Book an alignment meeting to plan next steps.</p>
      )}
      <div className="mt-4 flex gap-2">
        <Button asChild size="sm" variant="outline"><Link to="/alignment-meeting">Book meeting</Link></Button>
        <Button asChild size="sm" variant="ghost"><Link to="/living-tree">View milestones</Link></Button>
      </div>
    </Card>
  );
}

function ResourcesCard() {
  const items = [
    { to: "/hub", label: "Growth Hub", desc: "Articles, podcasts, guides", icon: Sprout },
    { to: "/hub/bookmarks", label: "Saved Resources", desc: "Bookmarks & downloads", icon: Library },
    { to: "/hub/articles", label: "Parent Guides", desc: "Recommended reading", icon: BookOpen },
    { to: "/hub/featured", label: "Featured", desc: "Recommended this week", icon: Sparkles },
  ];
  return (
    <Card className="card-paper p-6 rounded-3xl">
      <SectionHeader icon={Library} title="Resources" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="rounded-xl border border-border/60 p-4 hover:border-primary/40 hover:shadow-sm transition-all flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <it.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">{it.label}</div>
              <div className="text-xs text-muted-foreground">{it.desc}</div>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground italic">Instructor messaging is coming soon — feedback will appear here.</p>
    </Card>
  );
}

function EmptyFamily() {
  return (
    <Card className="card-paper p-10 rounded-3xl text-center">
      <Sprout className="h-8 w-8 text-primary mx-auto" />
      <h2 className="mt-4 text-xl font-semibold">Let's begin your family's journey</h2>
      <p className="mt-2 text-muted-foreground">Complete the Parent Journey to unlock your Family Dashboard.</p>
      <Button asChild className="mt-6"><Link to="/parent">Start Parent Journey</Link></Button>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof LayoutDashboard; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-serif text-lg">{title}</h3>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-sm text-right">{children}</dd>
    </div>
  );
}