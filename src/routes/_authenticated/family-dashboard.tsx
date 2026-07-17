import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Sprout, BookOpen, UserCircle, TreeDeciduous, ArrowRight, PartyPopper } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { AdmissionsProgress } from "@/components/admissions/AdmissionsProgress";
import { useAdmissionsProgress } from "@/lib/admissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/family-dashboard")({
  head: () => ({ meta: [{ title: "Family Dashboard — L2R" }] }),
  component: FamilyDashboard,
});

const ONGOING_ITEMS: NavItem[] = [
  { to: "/compass", label: "L2R Compass", icon: Compass, desc: "Your living family guide" },
  { to: "/living-tree", label: "The Living Tree", icon: TreeDeciduous, desc: "Your family's lifelong journey" },
  { to: "/hub", label: "Family Growth Hub", icon: Sprout, desc: "Articles, podcasts, resources" },
  { to: "/student", label: "Add a child's profile", icon: BookOpen, desc: "Start a student journey" },
  { to: "/profile", label: "Profile", icon: UserCircle, desc: "Account & preferences" },
];

function FamilyDashboard() {
  const { loading, hasFamily, steps, nextStep, enrolled } = useAdmissionsProgress();

  const footer = (
    <div className="space-y-6">
      <Card className="card-paper p-6 rounded-3xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Admissions Progress
            </div>
            <h2 className="font-serif text-2xl mt-1">
              {enrolled
                ? "Admissions complete"
                : nextStep
                ? `Next: ${nextStep.label}`
                : "Let's get started"}
            </h2>
          </div>
          {enrolled ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
              <PartyPopper className="h-4 w-4" /> Enrolled family
            </div>
          ) : nextStep ? (
            <Button asChild size="lg">
              <Link to={nextStep.to as string}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading your progress…</div>
          ) : !hasFamily ? (
            <div className="text-sm text-muted-foreground">
              It looks like your admissions journey hasn't started yet.{" "}
              <Link to="/parent" className="text-primary underline">
                Begin the Parent Journey
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <AdmissionsProgress steps={steps} />
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardShell
      roleLabel="Family Dashboard"
      title="Welcome back"
      subtitle="Continue your family's journey, at your pace."
      items={enrolled ? ONGOING_ITEMS : []}
      marginNote="tend the shelf, not the score"
      footer={footer}
    />
  );
}