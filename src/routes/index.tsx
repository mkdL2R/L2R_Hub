import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Compass,
  Sprout,
  LogIn,
  LayoutDashboard,
  Headphones,
  BookOpen,
  TreeDeciduous,
  Sparkles,
  Lightbulb,
  PencilLine,
} from "lucide-react";
import { useAuthUser } from "@/lib/hub-auth";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Left2Right Education Hub — Apply, Sign In, or Explore" },
      {
        name: "description",
        content:
          "One account for the whole L2R journey. Apply through the Discovery & Admission Journey, sign in, or explore the Growth Hub without an account.",
      },
      { property: "og:title", content: "Left2Right Education Hub" },
      {
        property: "og:description",
        content: "Apply to L2R, sign in, or explore the Growth Hub library — all under one account.",
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
        <div className="mb-14 flex flex-col items-center text-center">
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
            One account for everything. Apply to L2R, sign in to your dashboard, or simply
            explore the Growth Hub — no account needed to read.
          </p>
        </div>

        {/* Three primary actions */}
        <div className="grid gap-5 md:grid-cols-3">
          <PrimaryAction
            to="/parent"
            tone="yellow"
            icon={<Lightbulb className="h-6 w-6" />}
            eyebrow="Apply"
            title="Start the Discovery Journey"
            desc="Tell us your story. Save your answers with a free account at the very end — one account for parents and students."
            cta="Begin the journey"
          />
          <PrimaryAction
            to="/auth"
            tone="blue"
            icon={<LogIn className="h-6 w-6" />}
            eyebrow="Sign in"
            title="Return to your dashboard"
            desc="Already have an L2R account? Sign in to pick up where you left off, review your Compass, and tend your Living Tree."
            cta="Sign in"
          />
          <PrimaryAction
            to="/hub/featured"
            tone="green"
            icon={<Sprout className="h-6 w-6" />}
            eyebrow="Explore"
            title="Open the Growth Hub"
            desc="Browse articles, podcasts and public resources freely — no login required. Create an account later for bookmarks and personalized features."
            cta="Explore the Hub"
          />
        </div>

        {/* Secondary shortcuts — read-only entry points into the public library */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <MiniLink to="/hub/articles" tone="blue" icon={<BookOpen className="h-4 w-4" />} label="Read articles" />
          <MiniLink to="/hub/podcasts" tone="yellow" icon={<Headphones className="h-4 w-4" />} label="Listen to podcasts" />
          <MiniLink to="/compass" tone="red" icon={<Compass className="h-4 w-4" />} label="About the L2R Compass" />
        </div>

        {/* Notes */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Instructors join by invitation only. If you received an invite, open it from your email.{" "}
          <TreeDeciduous aria-hidden className="ml-1 inline h-3.5 w-3.5 text-forest" />
        </p>
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

function PrimaryAction({
  to, tone, icon, eyebrow, title, desc, cta,
}: { to: string; tone: Tone; icon: React.ReactNode; eyebrow: string; title: string; desc: string; cta: string }) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 ${t.wash} p-7 hover-lift ring-1 ${t.ring}`}
    >
      <PencilLine aria-hidden className="absolute -right-3 -top-3 h-16 w-16 rotate-12 text-foreground/[0.04]" />
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.solid} ${t.solidFg} shadow-sm`}>
        {icon}
      </div>
      <div className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] ${t.ink}`}>{eyebrow}</div>
      <h3 className="mt-1 font-serif text-2xl leading-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <div className={`mt-6 inline-flex items-center gap-1 text-sm font-medium ${t.ink}`}>
        {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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