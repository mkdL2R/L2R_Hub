import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Target,
  Flame,
  NotebookPen,
  MessageSquare,
  Calendar,
  ArrowRight,
  Sparkles,
  Compass,
} from "lucide-react";

export function WidgetCard({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 rounded-xl border-border ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center">
            {icon}
          </div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function Placeholder({ text, ctaLabel, ctaTo }: { text: string; ctaLabel?: string; ctaTo?: string }) {
  return (
    <div className="text-sm text-muted-foreground">
      <p>{text}</p>
      {ctaLabel && ctaTo ? (
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link to={ctaTo}>
            {ctaLabel} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export function TodaysFocus() {
  return (
    <WidgetCard
      title="Today's Learning Focus"
      icon={<Sparkles className="h-4 w-4" />}
      className="bg-gradient-to-br from-primary/5 to-transparent"
    >
      <p className="text-base font-medium">Reflect on one thing you learned yesterday.</p>
      <p className="text-sm text-muted-foreground mt-1">
        A small, honest note beats a long, polished one. Aim for 3 sentences.
      </p>
      <Button asChild size="sm" className="mt-4">
        <Link to="/student-dashboard/reflection">
          Start today's reflection <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </WidgetCard>
  );
}

export function LearningPlanWidget({ hasPlan }: { hasPlan: boolean }) {
  return (
    <WidgetCard
      title="Current Learning Plan"
      icon={<BookOpen className="h-4 w-4" />}
      action={
        <Button asChild size="sm" variant="ghost">
          <Link to="/student-dashboard/learning-plan">Open</Link>
        </Button>
      }
    >
      {hasPlan ? (
        <>
          <div className="text-sm font-medium">Term Plan · In progress</div>
          <div className="text-xs text-muted-foreground mt-1">
            Current milestone · Next goal appear here as your instructor adds them.
          </div>
        </>
      ) : (
        <Placeholder
          text="No learning plan yet. Your instructor will build one after your Alignment Meeting."
          ctaLabel="Book alignment meeting"
          ctaTo="/alignment-meeting"
        />
      )}
    </WidgetCard>
  );
}

export function ProgressWidget({ percent }: { percent: number }) {
  return (
    <WidgetCard
      title="Progress Overview"
      icon={<Target className="h-4 w-4" />}
      action={
        <Button asChild size="sm" variant="ghost">
          <Link to="/student-dashboard/progress">Details</Link>
        </Button>
      }
    >
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold">{percent}%</span>
        <span className="text-xs text-muted-foreground">of current term</span>
      </div>
      <Progress value={percent} className="mt-3 h-2" />
      <div className="text-xs text-muted-foreground mt-3">
        Milestones you complete show up here.
      </div>
    </WidgetCard>
  );
}

export function ReflectionStreakWidget({ streak, latest }: { streak: number; latest: string | null }) {
  return (
    <WidgetCard
      title="Reflection Journal"
      icon={<NotebookPen className="h-4 w-4" />}
      action={
        <Button asChild size="sm" variant="ghost">
          <Link to="/student-dashboard/reflection">Open</Link>
        </Button>
      }
    >
      <div className="flex items-center gap-2 text-sm">
        <Flame className="h-4 w-4 text-crayon" />
        <span>
          <span className="font-semibold">{streak}</span>{" "}
          <span className="text-muted-foreground">day{streak === 1 ? "" : "s"} in a row</span>
        </span>
      </div>
      <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
        {latest ? (
          <p className="line-clamp-3 italic">"{latest}"</p>
        ) : (
          <p className="text-muted-foreground">
            No reflections yet. Your first note starts a new streak.
          </p>
        )}
      </div>
    </WidgetCard>
  );
}

export function UpcomingMilestones({ items }: { items: { label: string; due: string }[] }) {
  return (
    <WidgetCard title="Upcoming Milestones" icon={<Calendar className="h-4 w-4" />}>
      {items.length === 0 ? (
        <Placeholder text="Nothing due yet. Your instructor will add milestones after alignment." />
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((m, i) => (
            <li key={i} className="py-2 flex items-center justify-between gap-3">
              <span className="text-sm">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.due}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function InstructorFeedback({ items }: { items: { from: string; note: string; at: string }[] }) {
  return (
    <WidgetCard title="Recent Instructor Feedback" icon={<MessageSquare className="h-4 w-4" />}>
      {items.length === 0 ? (
        <Placeholder text="No feedback yet. Once your instructor leaves a note, it will appear here." />
      ) : (
        <ul className="space-y-3">
          {items.map((f, i) => (
            <li key={i} className="rounded-md border border-border/60 p-3">
              <div className="text-sm">{f.note}</div>
              <div className="text-xs text-muted-foreground mt-1">
                — {f.from} · {f.at}
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

export function NextGoal({ goal }: { goal: string | null }) {
  return (
    <WidgetCard title="Next Goal" icon={<Compass className="h-4 w-4" />}>
      {goal ? (
        <p className="text-sm">{goal}</p>
      ) : (
        <Placeholder
          text="No active goal. Set one in your Learning Plan."
          ctaLabel="Open Learning Plan"
          ctaTo="/student-dashboard/learning-plan"
        />
      )}
    </WidgetCard>
  );
}