import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearDraft, loadDraft, saveDraft } from "@/lib/onboarding-storage";
import { StepShell } from "@/components/onboarding/StepShell";
import { AccountGate } from "@/components/onboarding/AccountGate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { useAdmissionsProgress } from "@/lib/admissions";
import { AlreadyCompleted } from "@/components/admissions/AlreadyCompleted";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Journey — Learning Profile" },
      {
        name: "description",
        content: "A guided multi-step form to capture the student's learning profile.",
      },
    ],
  }),
  component: StudentJourney,
});

const STEP_KEYS = ["identity", "school", "learning", "reflection"] as const;
const TOTAL_STEPS = STEP_KEYS.length;

type FormState = {
  full_name: string;
  date_of_birth: string;
  email: string;
  grade_level: string;
  school_name: string;
  preferred_subjects: string[];
  learning_style: string;
  motivation: string;
  strengths: string;
  struggles: string;
  goals: string;
};

const INITIAL: FormState = {
  full_name: "",
  date_of_birth: "",
  email: "",
  grade_level: "",
  school_name: "",
  preferred_subjects: [],
  learning_style: "",
  motivation: "",
  strengths: "",
  struggles: "",
  goals: "",
};

const SUBJECTS = [
  "Math",
  "Science",
  "Reading",
  "Writing",
  "Art",
  "Music",
  "PE / Sports",
  "History",
  "Coding",
  "Languages",
];

function StudentJourney() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(() => loadDraft<FormState>("studentDraft") ?? INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const progress = useAdmissionsProgress();
  const submitAttemptedRef = useRef(false);

  // Note: We intentionally do NOT gate this route on prior completion.
  // Parents may return to /student to add additional children at any time.
  void progress;

  useEffect(() => { saveDraft("studentDraft", data); }, [data]);

  const canProceed = useMemo(() => stepValid(step, data), [step, data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const toggleSubject = (v: string) =>
    setData((d) => ({
      ...d,
      preferred_subjects: d.preferred_subjects.includes(v)
        ? d.preferred_subjects.filter((s) => s !== v)
        : [...d.preferred_subjects, v],
    }));

  const submitAll = useCallback(async () => {
    if (submitAttemptedRef.current) return;
    submitAttemptedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const responses: { step_key: string; question_key: string; answer: unknown }[] = [];
      STEP_KEYS.forEach((step_key, i) => {
        for (const a of collectStepAnswers(i, data)) {
          responses.push({ step_key, question_key: a.key, answer: a.value });
        }
      });
      const payload = {
        total_steps: TOTAL_STEPS,
        completed_steps: STEP_KEYS,
        student: {
          full_name: data.full_name,
          date_of_birth: data.date_of_birth || null,
          email: data.email || null,
          grade_level: data.grade_level || null,
          school_name: data.school_name || null,
          preferred_subjects: data.preferred_subjects,
          learning_style: data.learning_style || null,
        },
        reflection: {
          motivation: data.motivation || null,
          strengths: data.strengths || null,
          struggles: data.struggles || null,
          goals: data.goals || null,
        },
        responses,
      };
      const { data: studentId, error } = await supabase.rpc(
        "submit_student_journey" as never,
        { _payload: payload } as never,
      );
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[submit_student_journey] postgres error", error);
        throw new Error(
          `${error.message}${error.code ? ` (code ${error.code})` : ""}${error.details ? ` — ${error.details}` : ""}${error.hint ? ` — hint: ${error.hint}` : ""}`,
        );
      }
      clearDraft("studentDraft");
      // If a parent completed the Student Journey and provided a student email,
      // generate an invitation link so the student can claim their own account.
      if (data.email) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("primary_role, email")
            .eq("user_id", (await supabase.auth.getUser()).data.user!.id)
            .maybeSingle();
          const callerEmail = (profile?.email ?? "").toLowerCase();
          const isParent = profile?.primary_role === "parent";
          if (isParent && callerEmail !== data.email.toLowerCase()) {
            const { data: token, error: invErr } = await supabase.rpc(
              "create_family_invitation" as never,
              { _kind: "student", _email: data.email, _student_id: studentId } as never,
            );
            if (!invErr && token) {
              setInviteUrl(`${window.location.origin}/invite-family?token=${token}`);
            }
          }
        } catch {
          // non-blocking
        }
      }
      toast.success("Your answers are saved");
      setDone(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save. Please try again.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [data]);

  useEffect(() => {
    if (step !== TOTAL_STEPS) return;
    if (submitAttemptedRef.current) return;
    supabase.auth.getUser().then(({ data: u }) => {
      if (u.user && !submitAttemptedRef.current) void submitAll();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Auto-continue to Compass once saved.
  useEffect(() => {
    if (!done || inviteUrl) return; // hold if we're showing the invite link
    const t = setTimeout(() => navigate({ to: "/compass" }), 1500);
    return () => clearTimeout(t);
  }, [done, navigate, inviteUrl]);

  function handleNext() {
    if (!canProceed) return;
    setStep((s) => s + 1);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Thanks for sharing</h1>
          {inviteUrl ? (
            <div className="mt-4 space-y-3 text-left">
              <p className="text-sm text-muted-foreground">
                Send this link to <span className="font-medium">{data.email}</span> so your student can sign in with their own account:
              </p>
              <div className="flex gap-2">
                <input readOnly value={inviteUrl} className="flex-1 rounded-md border px-3 py-2 text-xs font-mono" />
                <button
                  onClick={() => { void navigator.clipboard.writeText(inviteUrl); toast.success("Copied"); }}
                  className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                >Copy</button>
              </div>
              <p className="text-xs text-muted-foreground">The invite is valid for 30 days.</p>
            </div>
          ) : (
            <p className="mt-3 text-muted-foreground">
              Your learning profile is saved. Taking you to your Family Compass…
            </p>
          )}
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/compass" })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View your L2R Compass
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === TOTAL_STEPS) {
    return (
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">One last step</h1>
          <p className="mt-3 text-muted-foreground">
            Create a free account so we can save your answers and unlock your L2R Compass.
          </p>
          {submitting ? (
            <p className="mt-8 text-sm text-muted-foreground">Saving your answers…</p>
          ) : submitError ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-left text-sm text-destructive">
                <p className="font-medium">We couldn't save your answers.</p>
                <p className="mt-1 whitespace-pre-wrap break-words font-mono text-xs">{submitError}</p>
              </div>
              <button
                onClick={() => {
                  submitAttemptedRef.current = false;
                  setSubmitError(null);
                  void submitAll();
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mt-8">
              <AccountGate onAuthenticated={submitAll} />
              <button
                onClick={() => setStep(TOTAL_STEPS - 1)}
                className="mt-4 text-sm text-muted-foreground underline underline-offset-2"
              >
                Go back and review answers
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <StepShell
      journey="Student"
      stepIndex={step}
      totalSteps={TOTAL_STEPS}
      title={STEP_TITLES[step].title}
      description={STEP_TITLES[step].description}
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
      onNext={handleNext}
      canProceed={canProceed}
      isSubmitting={submitting}
      nextLabel={step === TOTAL_STEPS - 1 ? "Finish" : undefined}
    >
      {step === 0 && (
        <div className="grid gap-4">
          <Field label="Your full name" required>
            <Input
              value={data.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="Alex Garcia"
            />
          </Field>
          <Field label="Date of birth">
            <Input
              type="date"
              value={data.date_of_birth}
              onChange={(e) => update("date_of_birth", e.target.value)}
            />
          </Field>
          <Field label="Student's primary email">
            <Input
              type="email"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="student@example.com"
            />
            <p className="text-xs text-muted-foreground">
              If a parent is filling this in, we'll create an invitation link so the student can sign in with their own account.
            </p>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grade level" required>
            <Select value={data.grade_level} onValueChange={(v) => update("grade_level", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Pre-K",
                  "K",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "10",
                  "11",
                  "12",
                  "Homeschool",
                ].map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="School name">
            <Input
              value={data.school_name}
              onChange={(e) => update("school_name", e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <Field label="Favorite subjects" required>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUBJECTS.map((s) => {
                const checked = data.preferred_subjects.includes(s);
                return (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleSubject(s)} />
                    <span>{s}</span>
                  </label>
                );
              })}
            </div>
          </Field>
          <Field label="How do you learn best?" required>
            <Select
              value={data.learning_style}
              onValueChange={(v) => update("learning_style", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {["Visual", "Auditory", "Reading/Writing", "Hands-on", "Mixed"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <Field label="What motivates you?">
            <Textarea
              rows={3}
              value={data.motivation}
              onChange={(e) => update("motivation", e.target.value)}
            />
          </Field>
          <Field label="What are your strengths?">
            <Textarea
              rows={3}
              value={data.strengths}
              onChange={(e) => update("strengths", e.target.value)}
            />
          </Field>
          <Field label="Where do you struggle?">
            <Textarea
              rows={3}
              value={data.struggles}
              onChange={(e) => update("struggles", e.target.value)}
            />
          </Field>
          <Field label="A goal you want to reach">
            <Textarea
              rows={2}
              value={data.goals}
              onChange={(e) => update("goals", e.target.value)}
            />
          </Field>
        </div>
      )}
    </StepShell>
  );
}

const STEP_TITLES = [
  { title: "About you", description: "Just the basics to get started." },
  { title: "School", description: "Where you learn day to day." },
  { title: "How you learn", description: "Your subjects and learning style." },
  { title: "Reflection", description: "A few open questions — write as much or as little as you want." },
];

function stepValid(step: number, d: FormState): boolean {
  switch (step) {
    case 0:
      return !!d.full_name.trim();
    case 1:
      return !!d.grade_level;
    case 2:
      return d.preferred_subjects.length > 0 && !!d.learning_style;
    case 3:
      return true;
    default:
      return false;
  }
}

function collectStepAnswers(step: number, d: FormState): { key: string; value: unknown }[] {
  switch (step) {
    case 0:
      return [
        { key: "full_name", value: d.full_name },
        { key: "date_of_birth", value: d.date_of_birth },
      ];
    case 1:
      return [
        { key: "grade_level", value: d.grade_level },
        { key: "school_name", value: d.school_name },
      ];
    case 2:
      return [
        { key: "preferred_subjects", value: d.preferred_subjects },
        { key: "learning_style", value: d.learning_style },
      ];
    case 3:
      return [
        { key: "motivation", value: d.motivation },
        { key: "strengths", value: d.strengths },
        { key: "struggles", value: d.struggles },
        { key: "goals", value: d.goals },
      ];
    default:
      return [];
  }
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}