import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, GraduationCap, ArrowRight, Compass, Sprout, LogIn, LayoutDashboard } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <div className="absolute right-6 top-6">
        {user ? (
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
            <LayoutDashboard className="h-4 w-4" /> Open dashboard
          </Link>
        ) : (
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        )}
      </div>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-accent px-4 py-1 text-xs font-medium uppercase tracking-widest text-accent-foreground">
            Onboarding
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Welcome. Choose your journey.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            We run two parallel intakes — one for the family ecosystem, one for the student learning
            profile. Pick the path that fits and resume anytime.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <JourneyCard
            to="/parent"
            icon={<Users className="h-6 w-6" />}
            title="Parent Journey"
            subtitle="Family ecosystem form"
            bullets={[
              "Family & household basics",
              "Primary parent profile",
              "Values, routines & support network",
              "Goals and challenges",
            ]}
          />
          <JourneyCard
            to="/student"
            icon={<GraduationCap className="h-6 w-6" />}
            title="Student Journey"
            subtitle="Learning profile form"
            bullets={[
              "Identity & age",
              "School & grade level",
              "Subjects & learning style",
              "Reflective questions",
            ]}
          />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/compass"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Compass className="h-4 w-4 text-primary" />
            View your L2R Compass
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/hub"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <Sprout className="h-4 w-4 text-emerald-700" />
            Family Growth Hub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function JourneyCard({
  to,
  icon,
  title,
  subtitle,
  bullets,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-card-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <ul className="mt-6 space-y-2 text-sm text-card-foreground">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-8 inline-flex items-center text-sm font-medium text-primary">
        Begin
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
