import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarCheck, Loader2, Check, ArrowLeft, Clock, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/alignment-meeting")({
  head: () => ({ meta: [{ title: "Alignment Meeting — L2R" }] }),
  component: AlignmentMeetingPage,
});

type Instructor = {
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  preferred_name: string | null;
  email: string | null;
};

type Availability = {
  instructor_id: string;
  day_of_week: number;
  start_time: string; // HH:MM:SS
  end_time: string;
  slot_minutes: number;
};

type Booking = { scheduled_at: string; instructor_id: string };

// Fallback: Mon–Fri, 09:00–17:00, 30-min slots.
const DEFAULT_AVAIL: Omit<Availability, "instructor_id">[] = [1, 2, 3, 4, 5].map((d) => ({
  day_of_week: d,
  start_time: "09:00:00",
  end_time: "17:00:00",
  slot_minutes: 30,
}));

function generateSlots(date: Date, avails: Omit<Availability, "instructor_id">[]): Date[] {
  const dow = date.getDay();
  const day = avails.filter((a) => a.day_of_week === dow);
  const out: Date[] = [];
  for (const a of day) {
    const [sh, sm] = a.start_time.split(":").map(Number);
    const [eh, em] = a.end_time.split(":").map(Number);
    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);
    for (let t = start.getTime(); t + a.slot_minutes * 60_000 <= end.getTime(); t += a.slot_minutes * 60_000) {
      out.push(new Date(t));
    }
  }
  return out;
}

function AlignmentMeetingPage() {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [existingMeeting, setExistingMeeting] = useState<{ id: string; scheduled_at: string; instructor_id: string; status: string } | null>(null);

  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // Instructors
      const { data: instr } = await supabase
        .from("instructor_profiles")
        .select("user_id, bio, specialties");
      const ids = (instr ?? []).map((i) => i.user_id);
      let profs: { user_id: string; preferred_name: string | null; email: string | null }[] = [];
      if (ids.length) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, preferred_name, email")
          .in("user_id", ids);
        profs = data ?? [];
      }
      const merged: Instructor[] = (instr ?? []).map((i) => {
        const p = profs.find((x) => x.user_id === i.user_id);
        return {
          user_id: i.user_id,
          bio: i.bio,
          specialties: i.specialties,
          preferred_name: p?.preferred_name ?? null,
          email: p?.email ?? null,
        };
      });
      setInstructors(merged);

      const { data: avail } = await supabase
        .from("instructor_availability")
        .select("instructor_id, day_of_week, start_time, end_time, slot_minutes");
      setAvailability(avail ?? []);

      // Existing bookings visible to this user (own family + any assigned)
      const { data: mine } = await supabase
        .from("alignment_meetings")
        .select("id, scheduled_at, instructor_id, status")
        .in("status", ["pending", "confirmed"])
        .order("scheduled_at", { ascending: true });
      const list = mine ?? [];
      setBookings(list.map((b) => ({ scheduled_at: b.scheduled_at, instructor_id: b.instructor_id })));
      const own = list[0];
      if (own) setExistingMeeting(own);

      if (merged.length === 1) setInstructorId(merged[0].user_id);
      setLoading(false);
    })();
  }, [user]);

  const slotsForDay = useMemo(() => {
    if (!date || !instructorId) return [];
    const rows = availability.filter((a) => a.instructor_id === instructorId);
    const source = rows.length > 0 ? rows : DEFAULT_AVAIL.map((a) => ({ ...a, instructor_id: instructorId }));
    const taken = new Set(
      bookings
        .filter((b) => b.instructor_id === instructorId)
        .map((b) => new Date(b.scheduled_at).toISOString()),
    );
    const now = Date.now();
    return generateSlots(date, source).filter(
      (s) => s.getTime() > now && !taken.has(s.toISOString()),
    );
  }, [date, instructorId, availability, bookings]);

  const currentInstructor = instructors.find((i) => i.user_id === instructorId) ?? null;

  async function confirmBooking() {
    if (!instructorId || !slot) return;
    setSaving(true);
    setError(null);
    const { data, error: rpcErr } = await supabase.rpc("book_alignment_meeting", {
      _instructor_id: instructorId,
      _scheduled_at: slot.toISOString(),
      _duration_minutes: 30,
      _notes: notes || undefined,
    });
    setSaving(false);
    if (rpcErr) {
      setError(rpcErr.message === "slot_taken" ? "That slot was just taken. Please pick another." : rpcErr.message);
      return;
    }
    setConfirmedId(data as string);
    setConfirmOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Success state
  if (confirmedId || existingMeeting) {
    const m = confirmedId
      ? { scheduled_at: slot!.toISOString(), instructor_id: instructorId! }
      : existingMeeting!;
    const instr = instructors.find((i) => i.user_id === m.instructor_id);
    return (
      <div className="min-h-screen mx-auto max-w-2xl px-6 py-12">
        <Link to={"/family-dashboard" as string} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <Card className="card-paper mt-6 p-10 rounded-3xl text-center">
          <div className="icon-badge mx-auto h-14 w-14 text-primary">
            <Check className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-3xl mt-6">Your alignment meeting is booked.</h1>
          <p className="mt-4 text-muted-foreground">
            {format(new Date(m.scheduled_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            with {instr?.preferred_name ?? instr?.email ?? "your instructor"}
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Status: <span className="font-medium capitalize">{confirmedId ? "pending" : existingMeeting?.status}</span>. You'll receive
            details soon.
          </p>
          <div className="mt-8">
            <Button asChild><Link to="/family-dashboard">Return to dashboard</Link></Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto max-w-4xl px-6 py-12">
      <Link to="/family-dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <div className="mt-6 flex items-center gap-4">
        <div className="icon-badge h-12 w-12 text-primary"><CalendarCheck className="h-5 w-5" /></div>
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Alignment Meeting</h1>
          <p className="text-muted-foreground mt-1">Choose an instructor, a day, and a time that works for your family.</p>
        </div>
      </div>

      {instructors.length === 0 ? (
        <Card className="card-paper mt-8 p-8 rounded-3xl">
          <p className="text-muted-foreground">No instructors are currently accepting bookings. Please check back soon.</p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          {/* Left: instructor + calendar */}
          <Card className="card-paper p-6 rounded-3xl">
            <h2 className="font-serif text-xl">1. Instructor</h2>
            <div className="mt-3 grid gap-2">
              {instructors.map((i) => (
                <button
                  key={i.user_id}
                  onClick={() => { setInstructorId(i.user_id); setSlot(null); }}
                  className={cn(
                    "text-left rounded-2xl border p-4 transition-all",
                    instructorId === i.user_id
                      ? "border-primary/60 bg-primary/5"
                      : "border-border/60 hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{i.preferred_name ?? i.email ?? "Instructor"}</div>
                      {i.specialties?.length ? (
                        <div className="text-xs text-muted-foreground">{i.specialties.join(" · ")}</div>
                      ) : null}
                    </div>
                  </div>
                  {i.bio ? <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{i.bio}</p> : null}
                </button>
              ))}
            </div>

            <h2 className="font-serif text-xl mt-8">2. Date</h2>
            <div className="mt-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setSlot(null); }}
                disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                className={cn("rounded-2xl border border-border/60 p-3 pointer-events-auto")}
              />
            </div>
          </Card>

          {/* Right: slots + notes */}
          <Card className="card-paper p-6 rounded-3xl">
            <h2 className="font-serif text-xl">3. Time</h2>
            {!instructorId || !date ? (
              <p className="mt-3 text-sm text-muted-foreground">Pick an instructor and a date to see available times.</p>
            ) : slotsForDay.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No available times on this day. Try another date.</p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {slotsForDay.map((s) => (
                  <button
                    key={s.toISOString()}
                    onClick={() => setSlot(s)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm transition-all",
                      slot?.getTime() === s.getTime()
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 hover:border-primary/40",
                    )}
                  >
                    <Clock className="inline h-3 w-3 mr-1 -mt-0.5" />
                    {format(s, "h:mm a")}
                  </button>
                ))}
              </div>
            )}

            <h2 className="font-serif text-xl mt-8">4. Notes (optional)</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you'd like the instructor to know beforehand?"
              className="mt-3"
              rows={4}
            />

            <div className="mt-8 flex items-center justify-end">
              <Button disabled={!instructorId || !slot} onClick={() => setConfirmOpen(true)}>
                Review & confirm
              </Button>
            </div>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </Card>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your alignment meeting</DialogTitle>
            <DialogDescription>Please review the details before booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Instructor:</span> {currentInstructor?.preferred_name ?? currentInstructor?.email}</div>
            <div><span className="text-muted-foreground">Date:</span> {slot ? format(slot, "EEEE, MMMM d, yyyy") : ""}</div>
            <div><span className="text-muted-foreground">Time:</span> {slot ? format(slot, "h:mm a") : ""} (30 min)</div>
            {notes ? <div><span className="text-muted-foreground">Notes:</span> {notes}</div> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={saving}>Back</Button>
            <Button onClick={confirmBooking} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Confirm booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}