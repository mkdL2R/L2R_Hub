import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearDraft, loadDraft, saveDraft } from "@/lib/onboarding-storage";
import { StepShell } from "@/components/onboarding/StepShell";
import { AccountGate } from "@/components/onboarding/AccountGate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { useAdmissionsProgress } from "@/lib/admissions";

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [
      { title: "Parent Journey — Family Ecosystem" },
      {
        name: "description",
        content: "A guided multi-step form to capture your family ecosystem profile.",
      },
    ],
  }),
  component: ParentJourney,
});

const STEP_KEYS = [
  "family_basics",
  "household",
  "primary_parent",
  "values_ecosystem",
  "goals_challenges",
] as const;
const TOTAL_STEPS = STEP_KEYS.length;

type FormState = {
  // step 1
  family_name: string;
  primary_email: string;
  primary_phone: string;
  household_size: string;
  // step 2
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  household_languages: string[];
  // step 3
  parent_full_name: string;
  relationship: string;
  parent_email: string;
  parent_phone: string;
  occupation: string;
  education_level: string;
  // step 4
  parenting_style: string;
  values_summary: string;
  cultural_background: string;
  support_network: string;
  tech_usage: string;
  // step 5
  goals: string[];
  challenges: string[];
  notes: string;
};

const INITIAL: FormState = {
  family_name: "",
  primary_email: "",
  primary_phone: "",
  household_size: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  household_languages: [],
  parent_full_name: "",
  relationship: "",
  parent_email: "",
  parent_phone: "",
  occupation: "",
  education_level: "",
  parenting_style: "",
  values_summary: "",
  cultural_background: "",
  support_network: "",
  tech_usage: "",
  goals: [],
  challenges: [],
  notes: "",
};

const LANGUAGES = ["English", "Spanish", "French", "Mandarin", "Arabic", "Hindi", "Portuguese", "Other"];
const GOAL_OPTIONS = [
  "Academic excellence",
  "Emotional wellbeing",
  "Social skills",
  "Creativity",
  "Independence",
  "Physical health",
];
const CHALLENGE_OPTIONS = [
  "Screen time",
  "Focus & attention",
  "Anxiety / stress",
  "Sleep",
  "Peer relationships",
  "Motivation",
];

function ParentJourney() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(() => loadDraft<FormState>("parentDraft") ?? INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Persist draft on every change
  useEffect(() => { saveDraft("parentDraft", data); }, [data]);

  const canProceed = useMemo(() => stepValid(step, data), [step, data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const toggleArr = (key: "household_languages" | "goals" | "challenges", value: string) => {
    setData((d) => {
      const arr = d[key];
      return {
        ...d,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const buildPayload = useCallback((state: FormState) => {
    const responses: { step_key: string; question_key: string; answer: unknown }[] = [];
    STEP_KEYS.forEach((step_key, i) => {
      for (const a of collectStepAnswers(i, state)) {
        responses.push({ step_key, question_key: a.key, answer: a.value });
      }
    });
    return {
      total_steps: TOTAL_STEPS,
      completed_steps: STEP_KEYS,
      family: {
        family_name: state.family_name || null,
        primary_email: state.primary_email || null,
        primary_phone: state.primary_phone || null,
        household_size: state.household_size ? parseInt(state.household_size, 10) : null,
        address: state.address || null,
        city: state.city || null,
        state: state.state || null,
        postal_code: state.postal_code || null,
        country: state.country || null,
        household_languages: state.household_languages,
      },
      parent: {
        full_name: state.parent_full_name,
        relationship: state.relationship || null,
        email: state.parent_email || null,
        phone: state.parent_phone || null,
        occupation: state.occupation || null,
        education_level: state.education_level || null,
      },
      ecosystem: {
        parenting_style: state.parenting_style || null,
        values_summary: state.values_summary || null,
        cultural_background: state.cultural_background || null,
        support_network: state.support_network || null,
        tech_usage: state.tech_usage || null,
        goals: state.goals,
        challenges: state.challenges,
        notes: state.notes || null,
      },
      responses,
    };
  }, []);

  const submitAll = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildPayload(data);
      const { error } = await supabase.rpc(
        "submit_parent_journey" as never,
        { _payload: payload } as never,
      );
      if (error) throw error;
      clearDraft("parentDraft");
      toast.success("Your answers are saved");
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, data]);

  // If already signed in when landing on the completion step, submit automatically.
  useEffect(() => {
    if (step !== TOTAL_STEPS) return;
    supabase.auth.getUser().then(({ data: u }) => {
      if (u.user && !submitting && !done) void submitAll();
    });
  }, [step, submitAll, submitting, done]);

  function handleNext() {
    if (!canProceed) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">All set, thank you</h1>
          <p className="mt-3 text-muted-foreground">
            Your family ecosystem profile is saved. You can now invite the student to complete their
            learning profile.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/student" })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start student journey
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
            Create a free account so we can save your answers and give you access to your L2R Compass.
          </p>
          {submitting ? (
            <p className="mt-8 text-sm text-muted-foreground">Saving your answers…</p>
          ) : (
            <div className="mt-8">
              <AccountGate onAuthenticated={submitAll} />
              {submitError ? (
                <p className="mt-4 text-sm text-destructive">{submitError}</p>
              ) : null}
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
      journey="Parent"
      stepIndex={step}
      totalSteps={TOTAL_STEPS}
      title={STEP_TITLES[step].title}
      description={STEP_TITLES[step].description}
      onBack={step > 0 ? handleBack : undefined}
      onNext={handleNext}
      canProceed={canProceed}
      isSubmitting={submitting}
      nextLabel={step === TOTAL_STEPS - 1 ? "Finish" : undefined}
    >
      {step === 0 && (
        <div className="grid gap-4">
          <Field label="Family / household name" required>
            <Input
              value={data.family_name}
              onChange={(e) => update("family_name", e.target.value)}
              placeholder="The Garcia Household"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary email" required>
              <Input
                type="email"
                value={data.primary_email}
                onChange={(e) => update("primary_email", e.target.value)}
              />
            </Field>
            <Field label="Primary phone">
              <Input
                value={data.primary_phone}
                onChange={(e) => update("primary_phone", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Household size">
            <Input
              type="number"
              min={1}
              value={data.household_size}
              onChange={(e) => update("household_size", e.target.value)}
              placeholder="4"
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4">
          <Field label="Street address">
            <Input value={data.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <Input value={data.city} onChange={(e) => update("city", e.target.value)} />
            </Field>
            <Field label="State / region">
              <Input value={data.state} onChange={(e) => update("state", e.target.value)} />
            </Field>
            <Field label="Postal code">
              <Input
                value={data.postal_code}
                onChange={(e) => update("postal_code", e.target.value)}
              />
            </Field>
            <Field label="Country" required>
              <Input value={data.country} onChange={(e) => update("country", e.target.value)} />
            </Field>
          </div>
          <Field label="Languages spoken at home">
            <CheckboxGrid
              options={LANGUAGES}
              selected={data.household_languages}
              onToggle={(v) => toggleArr("household_languages", v)}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <Field label="Full name" required>
            <Input
              value={data.parent_full_name}
              onChange={(e) => update("parent_full_name", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Relationship to child" required>
              <Select
                value={data.relationship}
                onValueChange={(v) => update("relationship", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Mother", "Father", "Guardian", "Grandparent", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Education level">
              <Select
                value={data.education_level}
                onValueChange={(v) => update("education_level", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "High school",
                    "Some college",
                    "Bachelor's",
                    "Master's",
                    "Doctorate",
                    "Other",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={data.parent_email}
                onChange={(e) => update("parent_email", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={data.parent_phone}
                onChange={(e) => update("parent_phone", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Occupation">
            <Input
              value={data.occupation}
              onChange={(e) => update("occupation", e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <Field label="Parenting style">
            <Select
              value={data.parenting_style}
              onValueChange={(v) => update("parenting_style", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {["Authoritative", "Authoritarian", "Permissive", "Uninvolved", "Mixed"].map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Family values, in your words">
            <Textarea
              rows={3}
              value={data.values_summary}
              onChange={(e) => update("values_summary", e.target.value)}
              placeholder="Curiosity, honesty, persistence…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cultural background">
              <Input
                value={data.cultural_background}
                onChange={(e) => update("cultural_background", e.target.value)}
              />
            </Field>
            <Field label="Tech usage at home">
              <Select value={data.tech_usage} onValueChange={(v) => update("tech_usage", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Minimal", "Moderate", "High", "Heavy / always-on"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Support network">
            <Textarea
              rows={2}
              value={data.support_network}
              onChange={(e) => update("support_network", e.target.value)}
              placeholder="Extended family, friends, community, professionals…"
            />
          </Field>
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-4">
          <Field label="Goals for your child" required>
            <CheckboxGrid
              options={GOAL_OPTIONS}
              selected={data.goals}
              onToggle={(v) => toggleArr("goals", v)}
            />
          </Field>
          <Field label="Current challenges">
            <CheckboxGrid
              options={CHALLENGE_OPTIONS}
              selected={data.challenges}
              onToggle={(v) => toggleArr("challenges", v)}
            />
          </Field>
          <Field label="Anything else we should know?">
            <Textarea
              rows={4}
              value={data.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Field>
        </div>
      )}
    </StepShell>
  );
}

const STEP_TITLES = [
  { title: "Family basics", description: "Tell us about your household at a high level." },
  { title: "Where you live", description: "Address and languages spoken at home." },
  { title: "Primary parent", description: "The person filling out this form today." },
  { title: "Values & ecosystem", description: "How your family operates day to day." },
  { title: "Goals & challenges", description: "What you hope to achieve and what's hard right now." },
];

function stepValid(step: number, d: FormState): boolean {
  switch (step) {
    case 0:
      return !!d.family_name.trim() && /\S+@\S+\.\S+/.test(d.primary_email);
    case 1:
      return !!d.country.trim();
    case 2:
      return !!d.parent_full_name.trim() && !!d.relationship;
    case 3:
      return true;
    case 4:
      return d.goals.length > 0;
    default:
      return false;
  }
}

function collectStepAnswers(step: number, d: FormState): { key: string; value: unknown }[] {
  switch (step) {
    case 0:
      return [
        { key: "family_name", value: d.family_name },
        { key: "primary_email", value: d.primary_email },
        { key: "primary_phone", value: d.primary_phone },
        { key: "household_size", value: d.household_size },
      ];
    case 1:
      return [
        { key: "address", value: d.address },
        { key: "city", value: d.city },
        { key: "state", value: d.state },
        { key: "postal_code", value: d.postal_code },
        { key: "country", value: d.country },
        { key: "household_languages", value: d.household_languages },
      ];
    case 2:
      return [
        { key: "full_name", value: d.parent_full_name },
        { key: "relationship", value: d.relationship },
        { key: "email", value: d.parent_email },
        { key: "phone", value: d.parent_phone },
        { key: "occupation", value: d.occupation },
        { key: "education_level", value: d.education_level },
      ];
    case 3:
      return [
        { key: "parenting_style", value: d.parenting_style },
        { key: "values_summary", value: d.values_summary },
        { key: "cultural_background", value: d.cultural_background },
        { key: "tech_usage", value: d.tech_usage },
        { key: "support_network", value: d.support_network },
      ];
    case 4:
      return [
        { key: "goals", value: d.goals },
        { key: "challenges", value: d.challenges },
        { key: "notes", value: d.notes },
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

function CheckboxGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((o) => {
        const checked = selected.includes(o);
        return (
          <label
            key={o}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
              checked
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            <Checkbox checked={checked} onCheckedChange={() => onToggle(o)} />
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}