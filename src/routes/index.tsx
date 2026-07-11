import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, GraduationCap, ArrowRight, Compass, Sprout, LogIn, LayoutDashboard, Headphones, BookOpen, TreeDeciduous, Sparkles, Lightbulb, Heart, PencilLine } from "lucide-react";
import { useAuthUser } from "@/lib/hub-auth";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family & Student Onboarding" },
      {
        name: "description",
        content:
          "Two-track onboarding for families and students: capture ecosystem profiles and learning profiles step by step.",
      },
      { property: "og:title", content: "Family & Student Onboarding" },
      {
        property: "og:description",
        content: "Choose your journey: Parent (family ecosystem) or Student (learning profile).",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuthUser();
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Four marker-color blobs echoing the L2R logo */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--sketch) 22%, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-20 h-[380px] w-[380px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--mustard) 30%, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute left-1/3 bottom-0 h-[360px] w-[360px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--forest) 22%, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute right-1/4 -bottom-24 h-[320px] w-[320px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--crayon) 22%, transparent)" }} />

      <div className="absolute right-6 top-6 z-10">
        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover-lift"
          >
            <LayoutDashboard className="h-4 w-4" /> Open dashboard
          </Link>
        ) : (
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover-lift"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        )}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        {/* Hero — logo-forward */}
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="relative">
            <div aria-hidden className="absolute inset-0 -m-4 rounded-[2rem] rotate-[-2deg]" style={{ background: "color-mix(in oklab, var(--mustard) 28%, transparent)" }} />
            <img
              src={logoAsset.url}
              alt="Left2Right Education Hub"
              className="relative h-28 w-28 rounded-3xl object-cover shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] ring-4 ring-card"
            />
          </div>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-mustard" />
            Left2Right Education Hub
          </span>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Where <span className="italic text-sketch">curious minds</span>,{" "}
            <span className="italic text-crayon">warm families</span>, and{" "}
            <span className="italic text-forest">lifelong growth</span> meet.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            A creative studio for education — thoughtful intake journeys, a growing library of
            articles and podcasts, and a Living Tree that grows with your family.
          </p>
        </div>

        {/* Four feature cards — one per marker color */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            to="/parent"
            tone="yellow"
            icon={<Lightbulb className="h-6 w-6" />}
            eyebrow="Discover"
            title="Begin the journey"
            desc="Admissions & family intake — meet us, tell us your story."
          />
          <FeatureCard
            to="/compass"
            tone="blue"
            icon={<Compass className="h-6 w-6" />}
            eyebrow="Learn"
            title="L2R Compass"
            desc="A living guide that turns your answers into insight."
          />
          <FeatureCard
            to="/hub"
            tone="red"
            icon={<Heart className="h-6 w-6" />}
            eyebrow="Connect"
            title="Family Hub"
            desc="Articles, podcasts and resources for parents and kids."
          />
          <FeatureCard
            to="/living-tree"
            tone="green"
            icon={<TreeDeciduous className="h-6 w-6" />}
            eyebrow="Grow"
            title="The Living Tree"
            desc="Milestones, portfolios and stories that grow over time."
          />
        </div>

        {/* Journey CTAs */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <JourneyCTA
            to="/parent"
            tone="red"
            icon={<Users className="h-5 w-5" />}
            eyebrow="Parent journey"
            title="Family ecosystem"
            desc="Household basics, values, routines, and goals — captured together."
          />
          <JourneyCTA
            to="/student"
            tone="blue"
            icon={<GraduationCap className="h-5 w-5" />}
            eyebrow="Student journey"
            title="Learning profile"
            desc="Age, subjects, learning style, reflective questions."
          />
        </div>

        {/* Secondary shortcuts */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <MiniLink to="/hub/articles" tone="blue" icon={<BookOpen className="h-4 w-4" />} label="Read articles" />
          <MiniLink to="/hub/podcasts" tone="yellow" icon={<Headphones className="h-4 w-4" />} label="Listen to podcasts" />
          <MiniLink to="/hub" tone="green" icon={<Sprout className="h-4 w-4" />} label="Explore the Growth Hub" />
        </div>
      </div>
    </div>
  );
}

type Tone = "blue" | "green" | "red" | "yellow";

const TONE: Record<Tone, { wash: string; ink: string; solid: string; solidFg: string; ring: string; chip: string }> = {
  blue:   { wash: "bg-sketch-soft",  ink: "text-sketch",  solid: "bg-sketch",  solidFg: "text-sketch-foreground",  ring: "ring-sketch/30",  chip: "bg-sketch/10 text-sketch" },
  green:  { wash: "bg-sage-soft",    ink: "text-forest",  solid: "bg-forest",  solidFg: "text-forest-foreground",  ring: "ring-forest/25",  chip: "bg-forest/10 text-forest" },
  red:    { wash: "bg-crayon-soft",  ink: "text-crayon",  solid: "bg-crayon",  solidFg: "text-crayon-foreground",  ring: "ring-crayon/25",  chip: "bg-crayon/10 text-crayon" },
  yellow: { wash: "bg-mustard-soft", ink: "text-mustard-foreground", solid: "bg-mustard", solidFg: "text-mustard-foreground", ring: "ring-mustard/40", chip: "bg-mustard/25 text-mustard-foreground" },
};

function FeatureCard({
  to, tone, icon, eyebrow, title, desc,
}: { to: string; tone: Tone; icon: React.ReactNode; eyebrow: string; title: string; desc: string }) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 ${t.wash} p-6 hover-lift ring-1 ${t.ring}`}
    >
      <PencilLine aria-hidden className="absolute -right-3 -top-3 h-16 w-16 rotate-12 text-foreground/[0.04]" />
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.solid} ${t.solidFg} shadow-sm`}>
        {icon}
      </div>
      <div className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] ${t.ink}`}>{eyebrow}</div>
      <h3 className="mt-1 font-serif text-2xl leading-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <div className={`mt-5 inline-flex items-center gap-1 text-sm font-medium ${t.ink}`}>
        Enter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function JourneyCTA({
  to, tone, icon, eyebrow, title, desc,
}: { to: string; tone: Tone; icon: React.ReactNode; eyebrow: string; title: string; desc: string }) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className={`group relative flex items-start gap-5 overflow-hidden rounded-3xl ${t.solid} ${t.solidFg} p-7 hover-lift`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
        {icon}
      </div>
      <div className="relative">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-85">{eyebrow}</div>
        <div className="mt-1 font-serif text-2xl leading-tight">{title}</div>
        <p className="mt-1.5 text-sm opacity-90">{desc}</p>
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
          Begin <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function MiniLink({ to, tone, icon, label }: { to: string; tone: Tone; icon: React.ReactNode; label: string }) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium hover-lift"
    >
      <span className="flex items-center gap-3">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${t.chip}`}>{icon}</span>
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
