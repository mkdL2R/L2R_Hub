import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, Sprout, Users, BookOpen, Settings, UserCircle, TreeDeciduous, UserPlus, CalendarClock, CalendarCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";

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
  { to: "/parent", label: "Family intakes", icon: Users, desc: "Review parent flow" },
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
  const { user } = useAuthUser();
  const [rows, setRows] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("alignment_meetings")
      .select("id, scheduled_at, duration_minutes, status, meeting_notes, family_id")
      .eq("instructor_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);
    setRows((data ?? []) as Meeting[]);
    setLoading(false);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  async function setStatus(id: string, status: "confirmed" | "completed" | "cancelled") {
    const { error } = await supabase.from("alignment_meetings").update({ status }).eq("id", id);
    if (!error) refresh();
  }

  return (
    <Card className="p-6 rounded-lg border-border">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Upcoming Alignment Meetings</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No upcoming meetings. Set your <Link to="/instructor/availability" className="underline">weekly availability</Link> so families can book with you.
        </p>
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

function InstructorDashboard() {
  return (
    <DashboardShell
      roleLabel="Instructor Admin Dashboard"
      title="Welcome"
      subtitle="Administrative tools and learning library."
      items={ITEMS}
      variant="calm"
      footer={<UpcomingMeetings />}
    />
  );
}