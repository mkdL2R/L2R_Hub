import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

interface StepShellProps {
  journey: "Parent" | "Student";
  stepIndex: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isSubmitting?: boolean;
  canProceed?: boolean;
}

export function StepShell({
  journey,
  stepIndex,
  totalSteps,
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel,
  isSubmitting,
  canProceed = true,
}: StepShellProps) {
  const pct = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const isLast = stepIndex === totalSteps - 1;
  return (
    <div className="relative min-h-screen overflow-hidden">
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-32 h-[420px] w-[420px] text-sand/60"
        viewBox="0 0 200 200"
      >
        <path
          fill="currentColor"
          d="M42,-58C54,-49,62,-33,66,-15C70,3,70,22,60,34C51,47,32,54,13,60C-6,66,-25,72,-40,64C-55,55,-67,32,-69,9C-71,-14,-63,-37,-48,-48C-33,-59,-16,-58,1,-60C18,-62,30,-67,42,-58Z"
          transform="translate(100 100)"
        />
      </svg>
      <header className="relative border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium tracking-tight text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Onboarding
          </Link>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {journey} Journey · Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <div className="mx-auto max-w-3xl px-6 pb-4">
          <Progress value={pct} className="h-1.5" />
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-3 text-lg text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="card-paper rounded-3xl p-6 sm:p-9">
          {children}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={!onBack || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isLast ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {nextLabel ?? (isLast ? "Finish" : "Continue")}
            {!isLast && !isSubmitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      </main>
    </div>
  );
}