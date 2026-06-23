import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onboardingStore } from "@/lib/onboarding-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Compass, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/compass")({
  head: () => ({
    meta: [
      { title: "Your L2R Compass" },
      {
        name: "description",
        content:
          "A reflection of your family's ecosystem, designed to guide growth rather than measure performance.",
      },
    ],
  }),
  component: CompassPage,
});

type AnswerRow = { question_key: string; step_key: string; answer: unknown };

type LearningInsights = {
  approach: string;
  collaboration: string;
  energy: string;
  environment: string;
  subjects: string[];
  summary: string;
};

function pickAnswer(rows: AnswerRow[], key: string): string {
  const row = rows.find((r) => r.question_key === key);
  if (!row) return "";
  const a = row.answer;
  if (typeof a === "string") return a;
  if (Array.isArray(a)) return a.filter(Boolean).join(", ");
  if (a == null) return "";
  return String(a);
}

function pickArray(rows: AnswerRow[], key: string): string[] {
  const row = rows.find((r) => r.question_key === key);
  if (!row) return [];
  const a = row.answer;
  if (Array.isArray(a)) return a.map(String);
  if (typeof a === "string" && a) return [a];
  return [];
}

function deriveInsights(rows: AnswerRow[]): LearningInsights {
  const style = pickAnswer(rows, "learning_style") || "Mixed";
  const subjects = pickArray(rows, "preferred_subjects");
  const motivation = pickAnswer(rows, "motivation");
  const strengths = pickAnswer(rows, "strengths");
  const struggles = pickAnswer(rows, "struggles");

  const approachMap: Record<string, string> = {
    Visual: "Visual & observational — learns by seeing patterns and examples",
    Auditory: "Auditory & conversational — learns by listening and discussing",
    "Reading/Writing": "Reflective & literary — learns through reading and writing",
    "Hands-on": "Kinesthetic & experiential — learns by doing and building",
    Mixed: "Flexible & multi-modal — blends several learning channels",
  };
  const approach = approachMap[style] ?? `Prefers a ${style.toLowerCase()} approach`;

  const motivationText = motivation.toLowerCase();
  const struggleText = struggles.toLowerCase();

  const collaboration =
    /team|friend|group|with others|together|peer/.test(motivationText + " " + strengths.toLowerCase())
      ? "Energized by collaboration and shared work"
      : /alone|quiet|myself|independent/.test(motivationText)
        ? "Thrives in independent, focused work"
        : "Balances independent work with collaborative experiences";

  const energy =
    /curiosity|curious|explore|discover|interest/.test(motivationText)
      ? "Curiosity-driven — sparked by exploration and new ideas"
      : /challenge|goal|win|achieve/.test(motivationText)
        ? "Achievement-driven — motivated by clear goals and challenges"
        : /reward|praise|recognition/.test(motivationText)
          ? "Recognition-driven — encouraged by positive feedback"
          : "Balanced — draws energy from a mix of curiosity and progress";

  const environment =
    /distract|noise|loud|focus|attention/.test(struggleText)
      ? "Benefits from calm, low-distraction environments with gentle structure"
      : /bored|slow|repetitive/.test(struggleText)
        ? "Benefits from varied, stimulating environments with room to move"
        : "Benefits from environments that offer both structure and flexibility";

  const subjectLine = subjects.length
    ? ` Their curiosity leans toward ${subjects.slice(0, 3).join(", ")}.`
    : "";

  const summary =
    `This learner is ${approach.toLowerCase()}. ` +
    `${collaboration}, and is ${energy.toLowerCase()}. ` +
    `They ${environment.toLowerCase()}.${subjectLine}`;

  return { approach, collaboration, energy, environment, subjects, summary };
}

function CompassPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [responses, setResponses] = useState<AnswerRow[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sid = onboardingStore.get("student");
    const fid = onboardingStore.get("family");
    setFamilyId(fid);
    if (!sid) {
      setError("Complete the student journey first to view your Compass.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [{ data: stu }, { data: resp }] = await Promise.all([
          supabase.from("students").select("full_name").eq("id", sid).maybeSingle(),
          supabase
            .from("student_responses")
            .select("question_key,step_key,answer")
            .eq("student_id", sid),
        ]);
        setStudentName(stu?.full_name ?? "");
        setResponses((resp ?? []) as AnswerRow[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your Compass");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const insights = useMemo(
    () => (responses.length ? deriveInsights(responses) : null),
    [responses],
  );

  // Persist generated learning summary into ecosystem_profiles
  useEffect(() => {
    if (!insights || !familyId || saved) return;
    (async () => {
      try {
        const { data: existing } = await supabase
          .from("ecosystem_profiles")
          .select("daily_routine")
          .eq("family_id", familyId)
          .maybeSingle();
        const currentRoutine =
          existing?.daily_routine && typeof existing.daily_routine === "object"
            ? (existing.daily_routine as Record<string, unknown>)
            : {};
        const payload = {
          family_id: familyId,
          daily_routine: {
            ...currentRoutine,
            compass: {
              generated_at: new Date().toISOString(),
              learning_profile: insights,
            },
          },
        };
        await supabase
          .from("ecosystem_profiles")
          .upsert(payload, { onConflict: "family_id" });
        setSaved(true);
      } catch (e) {
        console.warn("Could not persist Compass output", e);
      }
    })();
  }, [insights, familyId, saved]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            ← Home
          </Link>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            L2R Compass
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            🧭 Your L2R Compass
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A reflection of your family's ecosystem, designed to guide growth rather than measure
            performance.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gathering your reflections…
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{error}</p>
              <Link
                to="/student"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Start student journey
              </Link>
            </CardContent>
          </Card>
        ) : insights ? (
          <section aria-labelledby="learning-profile">
            <Card className="overflow-hidden border-border/60">
              <CardHeader className="border-b border-border/60 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle id="learning-profile" className="text-2xl">
                      Learning Profile 🌱
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {studentName ? `${studentName}'s learning tendencies` : "Learning tendencies"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-8">
                <p className="text-lg leading-relaxed text-foreground">{insights.summary}</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Trait label="Preferred learning approach" value={insights.approach} />
                  <Trait label="Collaboration preference" value={insights.collaboration} />
                  <Trait label="Energy style" value={insights.energy} />
                  <Trait label="Environment preference" value={insights.environment} />
                </div>

                {insights.subjects.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Subjects that spark curiosity
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {insights.subjects.map((s) => (
                        <Badge key={s} variant="secondary" className="rounded-full px-3 py-1">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Trait({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}