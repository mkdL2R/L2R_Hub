import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { Placeholder } from "@/components/student/widgets";

export const Route = createFileRoute("/_authenticated/student-dashboard/learning-plan")({
  head: () => ({ meta: [{ title: "Learning Plan — L2R" }] }),
  component: LearningPlanPage,
});

function LearningPlanPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Learning Plan</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Your Learning Plan</h1>
        <p className="text-muted-foreground mt-1">
          Built together with your instructor after your Alignment Meeting.
        </p>
      </header>
      <Card className="p-6 rounded-xl border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary grid place-items-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">No plan yet</h2>
            <p className="text-sm text-muted-foreground">
              Milestones, goals, and weekly focus appear here once your instructor sets them up.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline">
            <Link to="/alignment-meeting">
              Book alignment meeting <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/hub/resources">Browse resources meanwhile</Link>
          </Button>
        </div>
      </Card>
      <Card className="p-6 rounded-xl border-border">
        <h3 className="font-semibold">Weekly focus</h3>
        <div className="mt-3">
          <Placeholder text="Your instructor will pin a weekly focus here each Monday." />
        </div>
      </Card>
    </div>
  );
}