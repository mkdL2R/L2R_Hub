import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Lightbulb,
  Sparkles,
  Navigation,
  ArrowRight,
} from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";
import { useAdmissionsProgress, markCompassSeen } from "@/lib/admissions";
import { Button } from "@/components/ui/button";

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

type StrengthsInsights = { items: string[] };
type GrowthInsights = { items: string[] };
type PathwayInsights = { name: string; explanation: string };

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

function deriveStrengths(
  parentRows: AnswerRow[],
  studentRows: AnswerRow[],
): StrengthsInsights {
  const text = [
    pickAnswer(studentRows, "strengths"),
    pickAnswer(studentRows, "motivation"),
    pickAnswer(studentRows, "goals"),
    pickArray(studentRows, "preferred_subjects").join(" "),
    pickAnswer(parentRows, "values_summary"),
    pickAnswer(parentRows, "notes"),
    pickArray(parentRows, "goals").join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const catalog: Array<[string, RegExp]> = [
    ["Curiosity", /curious|explore|wonder|question|discover|interest/],
    ["Creativity", /creative|art|imagine|design|music|story|draw|build/],
    ["Responsibility", /responsib|reliable|trust|duty|care/],
    ["Perseverance", /persever|persist|effort|try again|determined|resilien/],
    ["Emotional awareness", /emotion|feeling|empath|aware|sensitive|kind/],
    ["Adaptability", /adapt|flexible|change|new situation|open/],
    ["Collaboration", /team|friend|group|together|peer|collaborat|share/],
    ["Independence", /independ|alone|self|autonom|own/],
    ["Focus", /focus|concentrate|attention|dedicated/],
    ["Curiosity for learning", /learn|study|read|practice/],
  ];

  const matched = catalog
    .filter(([, re]) => re.test(text))
    .map(([name]) => name);

  const unique = Array.from(new Set(matched));
  const items = unique.length
    ? unique.slice(0, 5)
    : ["Curiosity", "Emotional awareness", "Adaptability"];

  return { items };
}

function deriveGrowth(
  parentRows: AnswerRow[],
  studentRows: AnswerRow[],
): GrowthInsights {
  const text = [
    pickAnswer(studentRows, "struggles"),
    pickArray(parentRows, "challenges").join(" "),
    pickAnswer(parentRows, "notes"),
  ]
    .join(" ")
    .toLowerCase();

  const catalog: Array<[string, RegExp]> = [
    ["Building consistency", /routine|consisten|habit|schedule|follow through/],
    ["Strengthening focus", /focus|distract|attention|concentrate/],
    ["Developing self-confidence", /confidence|shy|nervous|doubt|self-esteem|quiet/],
    ["Improving emotional regulation", /anger|frustrat|emotion|melt|overwhelm|anxiet|stress/],
    ["Nurturing social connection", /social|friend|peer|lonely|isolat/],
    ["Expanding curiosity", /bored|uninterested|motivat/],
    ["Strengthening organisation", /organi[sz]|messy|forget|plan/],
  ];

  const matched = catalog
    .filter(([, re]) => re.test(text))
    .map(([name]) => name);

  const unique = Array.from(new Set(matched));
  const items = unique.length
    ? unique.slice(0, 4)
    : ["Building consistency", "Developing self-confidence"];

  return { items };
}

function derivePathway(
  strengths: StrengthsInsights,
  growth: GrowthInsights,
  insights: LearningInsights,
): PathwayInsights {
  const s = strengths.items.join(" ").toLowerCase();
  const g = growth.items.join(" ").toLowerCase();
  const env = insights.environment.toLowerCase();

  if (/confidence/.test(g)) {
    return {
      name: "Confidence Building Pathway",
      explanation:
        "This pathway centres on gentle, encouraging experiences that help the learner trust their own voice. Activities are paced to build small, repeated wins, with mentors who notice progress out loud. Over time, the learner is invited into slightly bolder challenges, always with a safety net of support.",
    };
  }
  if (/focus|consistency|organi/.test(g)) {
    return {
      name: "Structured Guidance Pathway",
      explanation:
        "This pathway offers a clear rhythm and steady scaffolding so the learner can develop focus and follow-through. Sessions are predictable, expectations are transparent, and mentors check in often. Structure here is a form of care, not control — a framework that frees the learner to take ownership step by step.",
    };
  }
  if (/curiosity|creativity/.test(s) && /flexible|stimulating/.test(env)) {
    return {
      name: "Exploratory Learning Pathway",
      explanation:
        "This pathway leans into the learner's natural curiosity, offering rich, open-ended experiences and time to follow interests deeply. Mentors act as guides, not gatekeepers, and projects are shaped around real questions the learner cares about. The goal is to keep wonder alive while building lasting skills.",
    };
  }
  if (/independ/.test(s)) {
    return {
      name: "Independent Growth Pathway",
      explanation:
        "This pathway gives the learner room to drive their own progress, with mentors available as thinking partners rather than directors. Goals are co-designed, reflection is built in, and the learner gradually takes on more authorship of their journey. It honours autonomy while keeping connection close.",
    };
  }
  return {
    name: "Balanced Development Pathway",
    explanation:
      "This pathway weaves together structure and freedom, individual and collaborative work, challenge and rest. It is designed for learners who flourish when their days hold a healthy mix — enough rhythm to feel grounded, enough openness to feel alive. Mentors adjust the balance as the learner grows.",
  };
}

function CompassPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextStepTo, setNextStepTo] = useState<string>("/parent");
  const [nextStepLabel, setNextStepLabel] = useState<string>("Start the Parent Journey");
  const [studentName, setStudentName] = useState<string>("");
  const [responses, setResponses] = useState<AnswerRow[]>([]);
  const [parentResponses, setParentResponses] = useState<AnswerRow[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. Authenticated user
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const user = userRes.user;
        if (!user) {
          if (cancelled) return;
          setNextStepTo("/auth");
          setNextStepLabel("Sign in to view your Compass");
          setError("Sign in to view your Family Compass.");
          setLoading(false);
          return;
        }

        // 2/3. Profile + family (family_members first, then profiles.family_id fallback)
        const [memberRes, profileRes] = await Promise.all([
          supabase
            .from("family_members")
            .select("family_id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("family_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);
        const fid: string | null =
          memberRes.data?.family_id ??
          (profileRes.data as { family_id?: string | null } | null)?.family_id ??
          null;

        if (!fid) {
          if (cancelled) return;
          setNextStepTo("/parent");
          setNextStepLabel("Start the Parent Journey");
          setError(
            "Your admissions journey hasn't started yet. Complete the Parent Journey to begin building your Compass.",
          );
          setLoading(false);
          return;
        }
        if (!cancelled) setFamilyId(fid);

        // 4. Most recent student for this family
        const { data: students } = await supabase
          .from("students")
          .select("id, full_name, created_at")
          .eq("family_id", fid)
          .order("created_at", { ascending: false })
          .limit(1);
        const student = students?.[0] ?? null;

        if (!student) {
          if (cancelled) return;
          setNextStepTo("/student");
          setNextStepLabel("Continue to the Student Journey");
          setError(
            "Add a student profile through the Student Journey to unlock your Family Compass.",
          );
          setLoading(false);
          return;
        }

        // 5. Parent + student responses (ecosystem_profiles is upserted below in a separate effect)
        const [{ data: sResp }, { data: pResp }] = await Promise.all([
          supabase
            .from("student_responses")
            .select("question_key,step_key,answer")
            .eq("student_id", student.id),
          supabase
            .from("parent_responses")
            .select("question_key,step_key,answer")
            .eq("family_id", fid),
        ]);

        if (cancelled) return;
        setStudentName(student.full_name ?? "");
        setResponses((sResp ?? []) as AnswerRow[]);
        setParentResponses((pResp ?? []) as AnswerRow[]);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not load your Compass");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
  const strengths = useMemo(
    () =>
      parentResponses.length || responses.length
        ? deriveStrengths(parentResponses, responses)
        : null,
    [parentResponses, responses],
  );
  const growth = useMemo(
    () =>
      parentResponses.length || responses.length
        ? deriveGrowth(parentResponses, responses)
        : null,
    [parentResponses, responses],
  );
  const pathway = useMemo(
    () =>
      insights && strengths && growth
        ? derivePathway(strengths, growth, insights)
        : null,
    [insights, strengths, growth],
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
              strengths,
              growth,
              pathway,
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
  }, [insights, ecosystem, communication, goals, strengths, growth, pathway, familyId, saved]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-sm font-semibold tracking-tight">
            <img
              src={logoAsset.url}
              alt="Left2Right Education Hub"
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="hidden sm:inline">Left2Right Education Hub</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            L2R Compass
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center">
          <div className="icon-badge mx-auto mb-4 h-14 w-14 text-primary">
            <Compass className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Your L2R Compass
          </h1>
          <div className="mt-3 margin-note">a living guide — not a grade</div>
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
                to={nextStepTo as string}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {nextStepLabel}
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
                    <CardTitle id="learning-profile" className="font-serif text-2xl font-medium">
                      Learning Profile
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
                title="Family Ecosystem"
                subtitle="The shape of daily life at home"
                summary={ecosystem.summary}
                tone="sage"
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
                title="Communication Dynamics"
                subtitle="How connection and conversation flow"
                summary={communication.summary}
                tone="sketch"
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
                title="Goals & Aspirations"
                subtitle="Where the family and learner are heading"
                summary={goals.narrative}
                tone="terracotta"
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

            {strengths && (
              <SectionCard
                icon={<Lightbulb className="h-5 w-5" />}
                title="Strengths"
                subtitle="Qualities that already shine through"
                summary="These are the qualities most present in the learner's story right now — strengths to lean on as the journey continues."
                tone="mustard"
              >
                <div className="flex flex-wrap gap-2">
                  {strengths.items.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="rounded-full px-4 py-1.5 text-sm"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </SectionCard>
            )}

            {growth && (
              <SectionCard
                icon={<Sparkles className="h-5 w-5" />}
                title="Growth Opportunities"
                subtitle="Gentle next steps to nurture together"
                summary="These are not weaknesses — they are invitations. Areas where attention, care, and the right support can open new chapters of growth."
                tone="sage"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {growth.items.map((g) => (
                    <div
                      key={g}
                      className="rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-foreground"
                    >
                      {g}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {pathway && (
              <SectionCard
                icon={<Navigation className="h-5 w-5" />}
                title="Recommended L2R Accompaniment"
                subtitle="A pathway shaped around this learner"
                summary={pathway.explanation}
                tone="forest"
              >
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-primary">
                    Suggested pathway
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {pathway.name}
                  </p>
                </div>
              </SectionCard>
            )}

            <div className="mt-4 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card/50 to-transparent p-8 text-center">
              <img
                src={logoAsset.url}
                alt="Left2Right Education Hub"
                className="mx-auto mb-5 h-14 w-14 rounded-xl object-cover shadow-sm"
              />
              <p className="mx-auto max-w-2xl text-lg italic leading-relaxed text-foreground">
                "This Compass is not a destination. It is a living guide that evolves as the
                learner and family continue their journey together."
              </p>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                Structure without rigidity · Autonomy without isolation · Education as a lifelong journey
              </p>
            </div>
            <CompassContinueCTA />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function CompassContinueCTA() {
  const { hasFamily, familyId, completed } = useAdmissionsProgress();
  const navigate = useNavigate();
  if (!hasFamily) return null;
  if (completed.commitment) return null;
  const label = completed.alignment
    ? "Continue to Family Commitment"
    : "Continue to Alignment Meeting";
  const to = completed.alignment ? "/family-commitment" : "/alignment-meeting";
  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Ready for the next step in your admissions journey?
      </p>
      <Button
        size="lg"
        className="mt-4"
        onClick={() => {
          markCompassSeen(familyId);
          navigate({ to });
        }}
      >
        {label} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

const TONE_STYLES = {
  forest: { chip: "bg-primary/10 text-primary", ring: "from-primary/10 via-primary/5 to-transparent", stripe: "bg-primary" },
  terracotta: { chip: "bg-crayon/10 text-crayon", ring: "from-crayon/15 via-crayon/5 to-transparent", stripe: "bg-crayon" },
  mustard: { chip: "bg-mustard/20 text-mustard-foreground", ring: "from-mustard/25 via-mustard/8 to-transparent", stripe: "bg-mustard" },
  sage: { chip: "bg-sage/25 text-sage-foreground", ring: "from-sage/25 via-sage/10 to-transparent", stripe: "bg-sage" },
  sketch: { chip: "bg-sketch/10 text-sketch", ring: "from-sketch/15 via-sketch/5 to-transparent", stripe: "bg-sketch" },
} as const;
type Tone = keyof typeof TONE_STYLES;

function SectionCard({
  icon,
  title,
  subtitle,
  summary,
  children,
  tone = "forest",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  summary: string;
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = TONE_STYLES[tone];
  return (
    <Card className="overflow-hidden border-border/60 relative">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${t.stripe}`} />
      <CardHeader className={`border-b border-border/60 bg-gradient-to-br ${t.ring}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.chip}`}>
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