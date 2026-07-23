import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  TodaysFocus,
  LearningPlanWidget,
  ProgressWidget,
  ReflectionStreakWidget,
  UpcomingMilestones,
  InstructorFeedback,
  NextGoal,
} from "@/components/student/widgets";

export const Route = createFileRoute("/_authenticated/student-dashboard/")({
  head: () => ({ meta: [{ title: "Student Home — L2R" }] }),
  component: StudentHome,
});

function StudentHome() {
  const { user } = useAuthUser();
  const [name, setName] = useState<string | null>(null);
  const [hasStudent, setHasStudent] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: fm }] = await Promise.all([
        supabase.from("profiles").select("preferred_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("family_members").select("family_id").eq("user_id", user.id).maybeSingle(),
      ]);
      setName(profile?.preferred_name ?? null);
      if (fm?.family_id) {
        const { data: stu } = await supabase
          .from("students").select("id").eq("family_id", fm.family_id).limit(1).maybeSingle();
        setHasStudent(!!stu);
      }
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Welcome back
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Hi{name ? `, ${name}` : ""}.
          </h1>
          <p className="text-muted-foreground mt-1">
            Your learning home — a small step every day.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/student-dashboard/learning-plan">
            Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodaysFocus />
        </div>
        <ProgressWidget percent={0} />
        <LearningPlanWidget hasPlan={hasStudent} />
        <NextGoal goal={null} />
        <ReflectionStreakWidget streak={0} latest={null} />
        <UpcomingMilestones items={[]} />
        <div className="lg:col-span-2">
          <InstructorFeedback items={[]} />
        </div>
      </div>
    </div>
  );
}