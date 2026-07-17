import { Link } from "@tanstack/react-router";
import { Check, Circle, Lock } from "lucide-react";
import type { AdmissionsStep } from "@/lib/admissions";

export function AdmissionsProgress({
  steps,
  compact = false,
}: {
  steps: AdmissionsStep[];
  compact?: boolean;
}) {
  return (
    <ol className={compact ? "grid gap-2" : "grid gap-3"}>
      {steps.map((s, i) => {
        const Icon = s.state === "completed" ? Check : s.state === "current" ? Circle : Lock;
        const badgeCls =
          s.state === "completed"
            ? "bg-primary text-primary-foreground"
            : s.state === "current"
            ? "bg-primary/10 text-primary ring-2 ring-primary/40"
            : "bg-muted text-muted-foreground";
        const row = (
          <div
            className={`flex items-center gap-3 rounded-xl border border-border/60 p-3 ${
              s.state === "current" ? "bg-primary/5" : "bg-background/40"
            } ${s.state === "locked" ? "opacity-70" : ""}`}
          >
            <div className={`h-8 w-8 rounded-full grid place-items-center ${badgeCls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Step {i + 1}
                </span>
                {s.state === "current" && (
                  <span className="text-[10px] uppercase tracking-widest text-primary font-medium">
                    Current
                  </span>
                )}
              </div>
              <div className="font-medium truncate">{s.label}</div>
              {!compact && (
                <div className="text-xs text-muted-foreground truncate">{s.description}</div>
              )}
            </div>
          </div>
        );
        return (
          <li key={s.key}>
            {s.state === "locked" ? row : <Link to={s.to as string}>{row}</Link>}
          </li>
        );
      })}
    </ol>
  );
}