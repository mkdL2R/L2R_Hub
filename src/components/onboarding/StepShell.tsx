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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight text-foreground">
            ← Onboarding
          </Link>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {journey} Journey · Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <div className="mx-auto max-w-3xl px-6 pb-4">
          <Progress value={pct} className="h-1.5" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-2 text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
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