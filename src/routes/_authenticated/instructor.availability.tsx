import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useUserRoles } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/instructor/availability")({
  head: () => ({ meta: [{ title: "My Availability — L2R" }] }),
  component: AvailabilityPage,
});

type Slot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
};

const DAYS = [
  { v: 1, l: "Monday" },
  { v: 2, l: "Tuesday" },
  { v: 3, l: "Wednesday" },
  { v: 4, l: "Thursday" },
  { v: 5, l: "Friday" },
  { v: 6, l: "Saturday" },
  { v: 0, l: "Sunday" },
];

function AvailabilityPage() {
  const { user, loading } = useAuthUser();
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);
  const navigate = useNavigate();
  const isInstructor =
    roles.includes("instructor") || roles.includes("administrator") || roles.includes("admin");

  const [rows, setRows] = useState<Slot[]>([]);
  const [fetching, setFetching] = useState(true);
  const [day, setDay] = useState<number>(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [minutes, setMinutes] = useState<number>(30);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || rolesLoading) return;
    if (!isInstructor) navigate({ to: "/dashboard" as never, replace: true });
  }, [loading, rolesLoading, isInstructor, navigate]);

  async function refresh() {
    if (!user) return;
    setFetching(true);
    const { data } = await supabase
      .from("instructor_availability")
      .select("id, day_of_week, start_time, end_time, slot_minutes")
      .eq("instructor_id", user.id)
      .order("day_of_week")
      .order("start_time");
    setRows((data ?? []) as Slot[]);
    setFetching(false);
  }

  useEffect(() => {
    if (isInstructor && user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, user?.id]);

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (end <= start) {
      toast.error("End time must be after start time.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("instructor_availability").insert({
      instructor_id: user.id,
      day_of_week: day,
      start_time: `${start}:00`,
      end_time: `${end}:00`,
      slot_minutes: minutes,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Availability added.");
      refresh();
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("instructor_availability").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  }

  if (loading || rolesLoading || !isInstructor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory py-10 px-6">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/instructor-dashboard">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Link>
        </Button>
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Availability</h1>
            <p className="text-sm text-muted-foreground">
              Add weekly time blocks. Families will only see slots that fall inside these blocks.
            </p>
          </div>
        </div>

        <Card className="p-6 rounded-2xl border-border/60 mb-8">
          <h2 className="font-semibold mb-4">Add availability block</h2>
          <form onSubmit={addBlock} className="grid gap-4 sm:grid-cols-5 items-end">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Day</Label>
              <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.v} value={String(d.v)}>{d.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Slot</Label>
              <Select value={String(minutes)} onValueChange={(v) => setMinutes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90].map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-5">
              <Button type="submit" disabled={busy} className="rounded-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1.5" /> Add block</>}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 rounded-2xl border-border/60">
          <h2 className="font-semibold mb-4">Weekly schedule</h2>
          {fetching ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No availability yet. Add blocks above so families can book alignment meetings with you.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{DAYS.find((d) => d.v === r.day_of_week)?.l ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)} · {r.slot_minutes} min slots
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}