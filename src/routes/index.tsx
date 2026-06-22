import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, GraduationCap, ArrowRight } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background">
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
