import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, Sprout, BookOpen, Settings, UserCircle, TreeDeciduous, UserPlus, CalendarClock, CalendarCheck, Loader2, Users2 } from "lucide-react";
import { format } from "date-fns";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/instructor-dashboard")({
  head: () => ({ meta: [{ title: "Instructor Admin — L2R" }] }),
  component: InstructorDashboard,
});

const ITEMS: NavItem[] = [
  { to: "/people", label: "People Management", icon: UserPlus, desc: "Invite instructors" },
  { to: "/instructor/availability", label: "My Availability", icon: CalendarClock, desc: "Set weekly hours" },
  { to: "/hub/admin", label: "Content Admin", icon: Settings, desc: "Publish & manage Hub" },
  { to: "/hub", label: "Growth Hub", icon: Sprout, desc: "Library" },
  { to: "/compass", label: "Compass Summaries", icon: Compass, desc: "Family insights" },
  { to: "/living-tree", label: "Living Trees", icon: TreeDeciduous, desc: "Family timelines & notes" },
  { to: "/hub/articles", label: "Articles", icon: BookOpen, desc: "Teaching library" },
  { to: "/profile", label: "Profile", icon: UserCircle, desc: "Account & preferences" },
];

type Meeting = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_notes: string | null;
  family_id: string;
};

function UpcomingMeetings() {
  const [rows, setRows] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("alignment_meetings")
      .select("id, scheduled_at, duration_minutes, status, meeting_notes, family_id")
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(20);
    setRows((data ?? []) as Meeting[]);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function setStatus(id: string, status: "confirmed" | "completed" | "cancelled") {
    const { error } = await supabase.from("alignment_meetings").update({ status }).eq("id", id);
    if (!error) refresh();
  }

  return (
    <Card className="p-6 rounded-lg border-border">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Upcoming Alignment Meetings (team)</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            No Alignment Meetings have been booked yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Make sure your <Link to="/instructor/availability" className="underline">weekly availability</Link> is set so families can book time with you.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((m) => (
            <li key={m.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium">
                  {format(new Date(m.scheduled_at), "EEE, MMM d · h:mm a")}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {m.duration_minutes} min{m.meeting_notes ? ` · ${m.meeting_notes}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={m.status === "confirmed" ? "default" : "outline"}>{m.status}</Badge>
                {m.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "confirmed")}>Confirm</Button>
                )}
                {m.status === "confirmed" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "completed")}>Complete</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setStatus(m.id, "cancelled")}>Cancel</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

type FamilyRow = {
  family_id: string;
  family_name: string | null;
  primary_email: string | null;
  created_at: string;
  parent_name: string | null;
  student_count: number;
  compass_generated: boolean;
  parent_completed: boolean;
  student_completed: boolean;
  alignment_status: string | null;
  alignment_at: string | null;
  commitment_signed: boolean;
  final_enrolled: boolean;
};

function FamilyAdmissions() {
  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.rpc("admin_list_families").then(({ data }) => {
      setRows((data ?? []) as FamilyRow[]);
      setLoading(false);
    });
  }, []);

  function stageLabel(r: FamilyRow) {
    if (r.final_enrolled) return { text: "Enrolled", tone: "default" as const };
    if (r.commitment_signed) return { text: "Commitment signed", tone: "default" as const };
    if (r.alignment_status === "completed") return { text: "Meeting completed", tone: "secondary" as const };
    if (r.alignment_status) return { text: `Meeting ${r.alignment_status}`, tone: "secondary" as const };
    if (r.compass_generated) return { text: "Awaiting meeting", tone: "outline" as const };
    if (r.parent_completed) return { text: "Parent journey done", tone: "outline" as const };
    return { text: "In progress", tone: "outline" as const };
  }

  return (
    <Card className="p-6 rounded-lg border-border mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Users2 className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Family Admissions</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No families have started admissions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Family</th>
                <th className="py-2 pr-3">Parent</th>
                <th className="py-2 pr-3">Students</th>
                <th className="py-2 pr-3">Parent J.</th>
                <th className="py-2 pr-3">Student J.</th>
                <th className="py-2 pr-3">Compass</th>
                <th className="py-2 pr-3">Meeting</th>
                <th className="py-2 pr-3">Stage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = stageLabel(r);
                return (
                  <tr key={r.family_id} className="border-t border-border/60">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{r.family_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.primary_email ?? ""}</div>
                    </td>
                    <td className="py-2 pr-3">{r.parent_name ?? "—"}</td>
                    <td className="py-2 pr-3">{r.student_count}</td>
                    <td className="py-2 pr-3">{r.parent_completed ? "✓" : "—"}</td>
                    <td className="py-2 pr-3">{r.student_completed ? "✓" : "—"}</td>
                    <td className="py-2 pr-3">{r.compass_generated ? "✓" : "—"}</td>
                    <td className="py-2 pr-3">
                      {r.alignment_at ? format(new Date(r.alignment_at), "MMM d, h:mma") : "—"}
                    </td>
                    <td className="py-2 pr-3"><Badge variant={s.tone}>{s.text}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function InstructorDashboard() {
  return (
    <DashboardShell
      roleLabel="Instructor Admin Dashboard"
      title="Welcome"
      subtitle="Administrative tools and learning library."
      items={ITEMS}
      variant="calm"
      footer={<><UpcomingMeetings /><FamilyAdmissions /></>}
    />
  );
}