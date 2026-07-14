import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Compass,
  Sprout,
  LogIn,
  LayoutDashboard,
  Headphones,
  BookOpen,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { useAuthUser } from "@/lib/hub-auth";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";
import { Mascot } from "@/components/mascots/Mascot";
import { SketchDivider } from "@/components/sketch/SketchDivider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Left2Right — Discover your child's unique learning ecosystem" },
      {
        name: "description",
        content:
          "An artisanal digital learning journal for families, students, and mentors. Apply to L2R, sign in, or explore the Growth Hub.",
      },
      { property: "og:title", content: "Left2Right — Learning Journal" },
      {
        property: "og:description",
        content: "Where families, students, and mentors grow together.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuthUser();
  return (
    <div className="relative min-h-screen overflow-hidden grain">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-[380px] w-[380px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--sun) 40%, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-16 h-[360px] w-[360px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--stamp) 22%, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute left-1/3 bottom-0 h-[340px] w-[340px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--leaf) 25%, transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute right-1/4 -bottom-16 h-[320px] w-[320px] rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--cobalt) 22%, transparent)" }} />

      <div className="absolute right-6 top-6 z-10">
        {user ? (
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full ink-border bg-card px-4 py-2 text-sm font-semibold hover-lift">
            <LayoutDashboard className="h-4 w-4" /> Open dashboard
          </Link>
        ) : (
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full ink-border bg-card px-4 py-2 text-sm font-semibold hover-lift">
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        )}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
        {/* Hero */}
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full ink-border bg-card/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-stamp" />
              A learning journal, not a dashboard
            </span>
            <h1 className="mt-5 font-serif text-6xl leading-[0.95] tracking-tight text-foreground sm:text-7xl">
              Discover your child's{" "}
              <span className="relative inline-block">
                <span className="relative z-10">unique</span>
                <span aria-hidden className="absolute -bottom-1 left-0 right-0 h-3 bg-sun/80 -rotate-1 rounded-full" />
              </span>{" "}
              learning ecosystem.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-foreground/75">
              Left2Right is a warm, artisanal space where families, students, and mentors
              grow together — one page of your journal at a time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/parent" className="inline-flex h-11 items-center gap-2 rounded-[12px] border-[1.5px] border-ink/60 bg-stamp px-6 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0_rgba(27,27,27,0.35)] hover:-translate-y-0.5 transition-transform">
                <Lightbulb className="h-4 w-4" /> Apply to L2R
              </Link>
              <Link to="/auth" className="inline-flex h-11 items-center gap-2 rounded-[12px] ink-border bg-card px-6 text-sm font-semibold hover:-translate-y-0.5 transition-transform">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
              <Link to="/hub/featured" className="inline-flex h-11 items-center gap-2 rounded-[12px] border-[1.5px] border-ink/60 bg-leaf px-6 text-sm font-semibold text-forest-foreground shadow-[2px_2px_0_rgba(27,27,27,0.35)] hover:-translate-y-0.5 transition-transform">
                <Sprout className="h-4 w-4" /> Explore Growth Hub
              </Link>
            </div>
          </div>

          {/* Logo + mascot cluster */}
          <div className="relative mx-auto h-[340px] w-full max-w-md">
            <div aria-hidden className="absolute inset-6 rounded-[2rem] rotate-[-3deg] bg-sun/60 ink-border" />
            <div aria-hidden className="absolute inset-6 rounded-[2rem] rotate-[2deg] bg-card ink-border" />
            <img
              src={logoAsset.url}
              alt="Left2Right"
              className="absolute inset-14 h-[calc(100%-7rem)] w-[calc(100%-7rem)] object-cover rounded-2xl ink-border"
            />
            <div className="absolute -left-4 -top-4"><Mascot shape="star" color="yellow" size={72} float mood="wow" /></div>
            <div className="absolute -right-6 top-6"><Mascot shape="circle" color="red" size={64} float /></div>
            <div className="absolute -bottom-4 left-10"><Mascot shape="drop" color="blue" size={64} float mood="wink" /></div>
            <div className="absolute -bottom-6 right-6"><Mascot shape="triangle" color="green" size={68} float /></div>
          </div>
        </div>

        <SketchDivider className="my-14 h-3 w-full text-ink/30" />

        {/* Three primary actions — journal pages */}
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

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <MiniLink to="/hub/articles" tone="blue" icon={<BookOpen className="h-4 w-4" />} label="Read articles" />
          <MiniLink to="/hub/podcasts" tone="yellow" icon={<Headphones className="h-4 w-4" />} label="Listen to podcasts" />
          <MiniLink to="/compass" tone="red" icon={<Compass className="h-4 w-4" />} label="About the L2R Compass" />
        </div>

        <div className="mt-12 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <Mascot shape="drop" color="green" size={28} />
          Instructors join by invitation only. Open your invite from your email.
        </div>
      </div>
    </div>
  );
}

type Tone = "blue" | "green" | "red" | "yellow";

const TONE: Record<Tone, { wash: string; ink: string; solid: string; solidFg: string; chip: string }> = {
  blue:   { wash: "bg-sketch-soft",  ink: "text-cobalt",  solid: "bg-cobalt",  solidFg: "text-primary-foreground",   chip: "bg-cobalt/15 text-cobalt" },
  green:  { wash: "bg-sage-soft",    ink: "text-leaf",    solid: "bg-leaf",    solidFg: "text-forest-foreground",    chip: "bg-leaf/15 text-leaf" },
  red:    { wash: "bg-crayon-soft",  ink: "text-stamp",   solid: "bg-stamp",   solidFg: "text-primary-foreground",   chip: "bg-stamp/15 text-stamp" },
  yellow: { wash: "bg-mustard-soft", ink: "text-mustard-foreground", solid: "bg-sun", solidFg: "text-mustard-foreground", chip: "bg-sun/40 text-mustard-foreground" },
};

function PrimaryAction({
  to, tone, icon, eyebrow, title, desc, cta,
}: { to: string; tone: Tone; icon: React.ReactNode; eyebrow: string; title: string; desc: string; cta: string }) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className={`group relative flex flex-col overflow-hidden rounded-[18px] ink-border ${t.wash} p-7 hover-lift`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-[12px] ink-border ${t.solid} ${t.solidFg}`}>
        {icon}
      </div>
      <div className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${t.ink}`}>{eyebrow}</div>
      <h3 className="mt-1 font-serif text-3xl leading-[1.05] text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground/75">{desc}</p>
      <div className={`mt-6 inline-flex items-center gap-1 text-sm font-medium ${t.ink}`}>
        {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function MiniLink({ to, tone, icon, label }: { to: string; tone: Tone; icon: React.ReactNode; label: string }) {
  const t = TONE[tone];
  return (
    <Link to={to} className="group flex items-center justify-between rounded-[14px] ink-border bg-card px-5 py-4 text-sm font-semibold hover-lift">
      <span className="flex items-center gap-3">
        <span className={`grid h-8 w-8 place-items-center rounded-[8px] ink-border ${t.chip}`}>{icon}</span>
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}