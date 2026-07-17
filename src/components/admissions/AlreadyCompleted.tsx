import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type NextAction = { to: string; label: string };

/**
 * Friendly "you've already completed this" screen shown when a user returns
 * to a journey route (Parent or Student) whose responses are already saved.
 * Avoids re-opening a stale wizard and instead points to the next steps.
 */
export function AlreadyCompleted({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions: NextAction[];
}) {
  return (
    <div className="min-h-screen px-6 py-16 max-w-xl mx-auto">
      <Card className="card-paper p-10 rounded-3xl text-center space-y-5">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-serif text-2xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((a, i) => (
            <Button key={a.to} asChild size="lg" variant={i === 0 ? "default" : "outline"}>
              <Link to={a.to as string}>
                {a.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}