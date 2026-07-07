import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, GraduationCap, ArrowRight, Compass, Sprout, LogIn, LayoutDashboard, Headphones, BookOpen, TreeDeciduous, Sparkles } from "lucide-react";
import { useAuthUser } from "@/lib/hub-auth";

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
      {/* Organic paper-shape accents */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] text-sage/40"
        viewBox="0 0 200 200"
      >
        <path
          fill="currentColor"
          d="M45,-63C56,-52,60,-34,64,-16C68,3,71,22,63,36C55,51,35,60,15,66C-5,72,-27,74,-42,64C-57,53,-66,29,-68,5C-70,-19,-64,-42,-49,-55C-34,-68,-11,-70,7,-72C25,-74,34,-74,45,-63Z"
          transform="translate(100 100)"
        />
      </svg>
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-40 top-40 h-[460px] w-[460px] text-sand/70"
        viewBox="0 0 200 200"
      >
        <path
          fill="currentColor"
          d="M42,-58C54,-49,62,-33,66,-15C70,3,70,22,60,34C51,47,32,54,13,60C-6,66,-25,72,-40,64C-55,55,-67,32,-69,9C-71,-14,-63,-37,-48,-48C-33,-59,-16,-58,1,-60C18,-62,30,-67,42,-58Z"
          transform="translate(100 100)"
        />
      </svg>

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
        {/* Hero */}
        <div className="mb-14 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sand-foreground">
            <Sparkles className="h-3.5 w-3.5 text-crayon" />
            Left2Right Education Hub
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            A warm place for <span className="italic text-primary">families</span> to grow,
            reflect, and <span className="italic text-crayon">learn together</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Two gentle intake journeys, a growing library of articles and podcasts, and tools
            that help every parent and child move forward — one thoughtful step at a time.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-5 md:grid-cols-6 md:grid-rows-2">
          <JourneyCard
            to="/parent"
            icon={<Users className="h-6 w-6" />}
            eyebrow="Parent journey"
            title="Family ecosystem"
            desc="Household basics, values, routines, and goals — captured together."
            className="md:col-span-3 md:row-span-2 bg-primary text-primary-foreground"
            variant="primary"
          />
          <JourneyCard
            to="/student"
            icon={<GraduationCap className="h-6 w-6" />}
            eyebrow="Student journey"
            title="Learning profile"
            desc="Age, subjects, learning style, reflective questions."
            className="md:col-span-3 bg-crayon text-crayon-foreground"
            variant="crayon"
          />
          <BentoLink
            to="/compass"
            icon={<Compass className="h-5 w-5" />}
            title="L2R Compass"
            desc="Your family's insights, one glance."
            className="md:col-span-2 bg-sketch text-sketch-foreground"
          />
          <BentoLink
            to="/hub"
            icon={<Sprout className="h-5 w-5" />}
            title="Growth Hub"
            desc="Articles, podcasts, resources."
            className="md:col-span-1 bg-sage text-sage-foreground"
          />
        </div>

        {/* Secondary shortcuts */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <MiniLink to="/hub/articles" icon={<BookOpen className="h-4 w-4" />} label="Read articles" />
          <MiniLink to="/hub/podcasts" icon={<Headphones className="h-4 w-4" />} label="Listen to podcasts" />
          <MiniLink to="/living-tree" icon={<TreeDeciduous className="h-4 w-4" />} label="Explore your Living Tree" />
        </div>
      </div>
    </div>
  );
}

function JourneyCard({
  to,
  icon,
  eyebrow,
  title,
  desc,
  className = "",
  variant = "primary",
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  desc: string;
  className?: string;
  variant?: "primary" | "crayon";
}) {
  return (
    <Link
      to={to}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-7 md:p-9 hover-lift ${className}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          {icon}
        </div>
        <div className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{eyebrow}</div>
        <h2 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">{title}</h2>
        <p className="mt-3 max-w-md text-sm opacity-90 md:text-base">{desc}</p>
      </div>
      <div className="mt-8 inline-flex items-center gap-1 text-sm font-medium">
        {variant === "primary" ? "Begin the family intake" : "Start the student intake"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function BentoLink({
  to,
  icon,
  title,
  desc,
  className = "",
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 hover-lift ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
        {icon}
      </div>
      <div className="mt-6">
        <div className="font-serif text-xl leading-tight">{title}</div>
        <div className="mt-1 text-xs opacity-85">{desc}</div>
      </div>
      <ArrowRight className="absolute right-5 top-5 h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function MiniLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium hover-lift"
    >
      <span className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-sand text-primary">{icon}</span>
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
