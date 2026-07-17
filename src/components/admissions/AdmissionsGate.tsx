import { Link } from "@tanstack/react-router";
import { Loader2, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useAdmissionsProgress, type StepKey } from "@/lib/admissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FRIENDLY: Record<StepKey, { title: string; body: string }> = {
  parent: {
    title: "Let's begin with the Parent Journey",
    body:
      "It looks like your admissions journey hasn't started yet. Tell us about your family first — it only takes a few minutes.",
  },
  student: {
    title: "Add a student profile next",
    body: "Before we can continue, share the learner's profile through the Student Journey.",
  },
  compass: {
    title: "View your Family Compass",
    body:
      "Your Compass gathers everything you've shared into a living guide. Take a look before booking your alignment meeting.",
  },
  alignment: {
    title: "Book your Alignment Meeting",
    body:
      "The next step is a short meeting with an L2R instructor to align on your family's goals.",
  },
  commitment: {
    title: "Sign the Family Commitment",
    body: "One more step: sign the Family Commitment to complete admissions.",
  },
};

/**
 * Gate a route on admissions progress. Renders a friendly explanation with a
 * CTA to the earliest incomplete step when requirements aren't met.
 */
export function AdmissionsGate({
  require,
  children,
}: {
  /** Minimum step that must already be completed to view this page. */
  require: StepKey;
  children: ReactNode;
}) {
  const { loading, hasFamily, completed, nextStep } = useAdmissionsProgress();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ok = hasFamily && completed[require];
  if (ok) return <>{children}</>;

  // Determine what to show — earliest incomplete step, or the required step.
  const target =
    nextStep ??
    ({
      key: require,
      label: FRIENDLY[require].title,
      to: "/parent",
      description: "",
      state: "current" as const,
    });

  const copy = FRIENDLY[target.key as StepKey] ?? FRIENDLY.parent;

  return (
    <div className="min-h-screen px-6 py-16 max-w-xl mx-auto">
      <Card className="card-paper p-10 rounded-3xl text-center space-y-5">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-serif text-2xl">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.body}</p>
        <div className="pt-2">
          <Button asChild size="lg">
            <Link to={target.to as string}>Continue to {target.label}</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}