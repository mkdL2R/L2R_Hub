import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onboardingStore } from "@/lib/onboarding-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sprout,
  Compass,
  Loader2,
  AlertCircle,
  Home,
  MessagesSquare,
  Target,
} from "lucide-react";

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

type EcosystemInsights = {
  rhythm: string;
  values: string;
  environment: string;
  summary: string;
};

type CommunicationInsights = {
  style: string;
  conflict: string;
  safety: string;
  summary: string;
};

type GoalsInsights = {
  parentGoals: string[];
  studentAspirations: string;
  narrative: string;
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

function deriveEcosystem(rows: AnswerRow[]): EcosystemInsights {
  const parentingStyle = pickAnswer(rows, "parenting_style");
  const values = pickAnswer(rows, "values_summary");
  const support = pickAnswer(rows, "support_network");
  const tech = pickAnswer(rows, "tech_usage");
  const languages = pickArray(rows, "household_languages");
  const culture = pickAnswer(rows, "cultural_background");

  const rhythm = [
    parentingStyle && `A ${parentingStyle.toLowerCase()} parenting rhythm`,
    support && `supported by ${support.toLowerCase()}`,
    tech && `with a ${tech.toLowerCase()} approach to technology`,
  ]
    .filter(Boolean)
    .join(", ") || "A balanced daily rhythm shaped by shared routines";

  const valuesText =
    values ||
    (culture
      ? `Rooted in ${culture} traditions and shared family values`
      : "Guided by shared family values and lived experience");

  const environment =
    languages.length > 1
      ? `A multilingual home (${languages.join(", ")}) that nurtures curiosity across cultures`
      : languages.length === 1
        ? `A ${languages[0]}-speaking home that encourages learning through everyday life`
        : "A home environment that encourages learning through everyday life";

  const summary =
    "This family ecosystem is rooted in " +
    (values ? `${values.toLowerCase().replace(/\.$/, "")}` : "shared care and intention") +
    ". The home environment encourages both autonomy and support, with daily rhythms that make space for growth.";

  return { rhythm, values: valuesText, environment, summary };
}

function deriveCommunication(
  parentRows: AnswerRow[],
  studentRows: AnswerRow[],
): CommunicationInsights {
  const parentingStyle = pickAnswer(parentRows, "parenting_style").toLowerCase();
  const support = pickAnswer(parentRows, "support_network").toLowerCase();
  const notes = pickAnswer(parentRows, "notes").toLowerCase();
  const challenges = pickArray(parentRows, "challenges").map((c) => c.toLowerCase());
  const struggles = pickAnswer(studentRows, "struggles").toLowerCase();
  const motivation = pickAnswer(studentRows, "motivation").toLowerCase();

  const style = /authoritative|collaborative|democratic|gentle/.test(parentingStyle)
    ? "Warm and collaborative — conversations tend to be two-way and respectful"
    : /strict|structured|firm/.test(parentingStyle)
      ? "Clear and structured — communication leans on consistency and direction"
      : /relax|permissive|free/.test(parentingStyle)
        ? "Open and flexible — conversation flows freely with room for self-expression"
        : "Caring and adaptive — communication shifts to meet the moment";

  const conflict = challenges.some((c) => /anxiety|stress|peer|focus/.test(c))
    ? "Approaches tension with patience, leaning on connection before correction"
    : /talk|listen|together|family/.test(support + " " + notes)
      ? "Resolves friction through dialogue, with space for everyone to be heard"
      : "Works through disagreements steadily, prioritising understanding over winning";

  const safety =
    /quiet|shy|afraid|nervous|anxious/.test(struggles)
      ? "Expression is gentle; the learner may need extra reassurance to share openly"
      : /share|talk|express|open|confident/.test(motivation + " " + struggles)
        ? "Expression feels safe — the learner is comfortable sharing thoughts and feelings"
        : "Expression is steady, with growing confidence to share when invited";

  const summary =
    "Communication here is grounded in care. " +
    "Conversations honor each person's voice, and emotional safety is treated as part of learning, not separate from it.";

  return { style, conflict, safety, summary };
}

function deriveGoals(parentRows: AnswerRow[], studentRows: AnswerRow[]): GoalsInsights {
  const parentGoals = pickArray(parentRows, "goals");
  const studentGoals = pickAnswer(studentRows, "goals");
  const studentStrengths = pickAnswer(studentRows, "strengths");
  const studentMotivation = pickAnswer(studentRows, "motivation");

  const aspirationParts = [studentGoals, studentMotivation, studentStrengths]
    .map((s) => s.trim())
    .filter(Boolean);
  const studentAspirations =
    aspirationParts[0] || "A growing sense of curiosity and self-direction";

  const narrative = parentGoals.length
    ? "There is a strong alignment between family aspirations and the learner's interests, creating a healthy foundation for future growth. " +
      `The family hopes to nurture ${parentGoals.slice(0, 3).join(", ").toLowerCase()}, while the learner is drawn toward ${studentAspirations.toLowerCase().slice(0, 140)}.`
    : "Family hopes and the learner's own aspirations are beginning to take shape together, creating space for shared goals over time.";

  return { parentGoals, studentAspirations, narrative };
}

function CompassPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [responses, setResponses] = useState<AnswerRow[]>([]);
  const [parentResponses, setParentResponses] = useState<AnswerRow[]>([]);
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
        const [{ data: stu }, { data: resp }, { data: presp }] = await Promise.all([
          supabase.from("students").select("full_name").eq("id", sid).maybeSingle(),
          supabase
            .from("student_responses")
            .select("question_key,step_key,answer")
            .eq("student_id", sid),
          fid
            ? supabase
                .from("parent_responses")
                .select("question_key,step_key,answer")
                .eq("family_id", fid)
            : Promise.resolve({ data: [] as AnswerRow[] }),
        ]);
        setStudentName(stu?.full_name ?? "");
        setResponses((resp ?? []) as AnswerRow[]);
        setParentResponses((presp ?? []) as AnswerRow[]);
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
  const ecosystem = useMemo(
    () => (parentResponses.length ? deriveEcosystem(parentResponses) : null),
    [parentResponses],
  );
  const communication = useMemo(
    () =>
      parentResponses.length || responses.length
        ? deriveCommunication(parentResponses, responses)
        : null,
    [parentResponses, responses],
  );
  const goals = useMemo(
    () =>
      parentResponses.length || responses.length
        ? deriveGoals(parentResponses, responses)
        : null,
    [parentResponses, responses],
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
              ecosystem,
              communication,
              goals,
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
  }, [insights, ecosystem, communication, goals, familyId, saved]);

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
          <div className="space-y-8">
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

            {ecosystem && (
              <SectionCard
                icon={<Home className="h-5 w-5" />}
                title="Family Ecosystem 🏡"
                subtitle="The shape of daily life at home"
                summary={ecosystem.summary}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <Trait label="Household rhythm" value={ecosystem.rhythm} />
                  <Trait label="Family values" value={ecosystem.values} />
                  <Trait label="Home learning environment" value={ecosystem.environment} />
                </div>
              </SectionCard>
            )}

            {communication && (
              <SectionCard
                icon={<MessagesSquare className="h-5 w-5" />}
                title="Communication Dynamics 🤝"
                subtitle="How connection and conversation flow"
                summary={communication.summary}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <Trait label="Communication style" value={communication.style} />
                  <Trait label="Conflict resolution style" value={communication.conflict} />
                  <Trait label="Expression safety level" value={communication.safety} />
                </div>
              </SectionCard>
            )}

            {goals && (
              <SectionCard
                icon={<Target className="h-5 w-5" />}
                title="Goals & Aspirations 🎯"
                subtitle="Where the family and learner are heading"
                summary={goals.narrative}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Parent goals for the child
                    </p>
                    {goals.parentGoals.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {goals.parentGoals.map((g) => (
                          <Badge key={g} variant="secondary" className="rounded-full px-3 py-1">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Goals will appear here once the parent journey is completed.
                      </p>
                    )}
                  </div>
                  <Trait
                    label="Student aspirations and dreams"
                    value={goals.studentAspirations}
                  />
                </div>
              </SectionCard>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  summary,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader className="border-b border-border/60 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-8">
        <p className="text-lg leading-relaxed text-foreground">{summary}</p>
        {children}
      </CardContent>
    </Card>
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