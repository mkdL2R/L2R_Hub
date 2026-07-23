import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Placeholder } from "@/components/student/widgets";

export const Route = createFileRoute("/_authenticated/student-dashboard/progress")({
  head: () => ({ meta: [{ title: "Progress — L2R" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Progress</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Your Progress</h1>
        <p className="text-muted-foreground mt-1">
          Milestones you complete show up here. Small steps count.
        </p>
      </header>
      <Card className="p-6 rounded-xl border-border">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold">0%</span>
          <span className="text-sm text-muted-foreground">of current term</span>
        </div>
        <Progress value={0} className="mt-3 h-2" />
      </Card>
      <Card className="p-6 rounded-xl border-border">
        <h3 className="font-semibold">Milestones</h3>
        <div className="mt-3">
          <Placeholder text="No milestones yet. They will appear once your Learning Plan is set." />
        </div>
      </Card>
      <Card className="p-6 rounded-xl border-border">
        <h3 className="font-semibold">Recent activity</h3>
        <div className="mt-3">
          <Placeholder text="Reflections, completed goals, and feedback will land here." />
        </div>
      </Card>
    </div>
  );
}