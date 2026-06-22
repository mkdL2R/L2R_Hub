import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { onboardingStore } from "@/lib/onboarding-storage";
import { StepShell } from "@/components/onboarding/StepShell";
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
  const [data, setData] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const sid = onboardingStore.get("student");
    if (!sid) return;
    (async () => {
      const { data: stu } = await supabase.from("students").select("*").eq("id", sid).maybeSingle();
      if (stu) {
        setData((d) => ({
          ...d,
          full_name: stu.full_name ?? "",
          date_of_birth: stu.date_of_birth ?? "",
          grade_level: stu.grade_level ?? "",
          school_name: stu.school_name ?? "",
          preferred_subjects: stu.preferred_subjects ?? [],
          learning_style: stu.learning_style ?? "",
        }));
      }
      const stid = onboardingStore.get("studentStatus");
      if (stid) {
        const { data: st } = await supabase
          .from("onboarding_status")
          .select("current_step,status")
          .eq("id", stid)
          .maybeSingle();
        if (st && st.status !== "completed") setStep(Math.min(st.current_step, TOTAL_STEPS - 1));
      }
    })();
  }, []);

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

  async function persistStep(currentStep: number): Promise<{ studentId: string }> {
    let studentId = onboardingStore.get("student") ?? "";
    const familyId = onboardingStore.get("family") ?? null;

    if (currentStep === 0) {
      const payload = {
        family_id: familyId,
        full_name: data.full_name,
        date_of_birth: data.date_of_birth || null,
      };
      if (studentId) {
        await supabase.from("students").update(payload).eq("id", studentId).throwOnError();
      } else {
        const { data: row } = await supabase
          .from("students")
          .insert(payload)
          .select("id")
          .single()
          .throwOnError();
        studentId = row!.id;
        onboardingStore.set("student", studentId);
      }
    } else if (studentId && currentStep === 1) {
      await supabase
        .from("students")
        .update({
          grade_level: data.grade_level || null,
          school_name: data.school_name || null,
        })
        .eq("id", studentId)
        .throwOnError();
    } else if (studentId && currentStep === 2) {
      await supabase
        .from("students")
        .update({
          preferred_subjects: data.preferred_subjects.length ? data.preferred_subjects : null,
          learning_style: data.learning_style || null,
        })
        .eq("id", studentId)
        .throwOnError();
    }

    if (studentId) {
      const stepKey = STEP_KEYS[currentStep];
      const answers = collectStepAnswers(currentStep, data);
      if (answers.length) {
        await supabase
          .from("student_responses")
          .insert(
            answers.map((a) => ({
              student_id: studentId,
              step_key: stepKey,
              question_key: a.key,
              answer: a.value as never,
            })),
          )
          .throwOnError();
      }
    }

    return { studentId };
  }

  async function bumpStatus(studentId: string, currentStep: number, finished: boolean) {
    const statusId = onboardingStore.get("studentStatus");
    const familyId = onboardingStore.get("family") ?? null;
    const completed_steps = STEP_KEYS.slice(0, currentStep + 1);
    const payload = {
      family_id: familyId,
      student_id: studentId,
      journey: "student" as const,
      current_step: finished ? TOTAL_STEPS : currentStep + 1,
      total_steps: TOTAL_STEPS,
      completed_steps,
      status: finished ? "completed" : "in_progress",
      completed_at: finished ? new Date().toISOString() : null,
    };
    if (statusId) {
      await supabase.from("onboarding_status").update(payload).eq("id", statusId).throwOnError();
    } else {
      const { data: row } = await supabase
        .from("onboarding_status")
        .insert(payload)
        .select("id")
        .single()
        .throwOnError();
      onboardingStore.set("studentStatus", row!.id);
    }
  }

  async function handleNext() {
    if (!canProceed) return;
    setSubmitting(true);
    try {
      const { studentId } = await persistStep(step);
      const isLast = step === TOTAL_STEPS - 1;
      await bumpStatus(studentId, step, isLast);
      if (isLast) {
        setDone(true);
        toast.success("Student onboarding complete");
      } else {
        setStep((s) => s + 1);
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not save this step");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Thanks for sharing</h1>
          <p className="mt-3 text-muted-foreground">
            Your learning profile is saved. We'll use it to personalize your experience.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Back to home
            </button>
          </div>
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