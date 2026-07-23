import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { NotebookPen, Flame } from "lucide-react";
import { Placeholder } from "@/components/student/widgets";

export const Route = createFileRoute("/_authenticated/student-dashboard/reflection")({
  head: () => ({ meta: [{ title: "Reflection Journal — L2R" }] }),
  component: ReflectionPage,
});

function ReflectionPage() {
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<{ text: string; at: string }[]>([]);

  function save() {
    const text = note.trim();
    if (!text) return;
    setEntries((prev) => [{ text, at: new Date().toLocaleString() }, ...prev]);
    setNote("");
    toast.success("Reflection saved for today");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Reflection Journal</div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Today's reflection</h1>
        <p className="text-muted-foreground mt-1">
          Three honest sentences beat a polished essay.
        </p>
      </header>
      <Card className="p-6 rounded-xl border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-crayon" />
          <span>Streak: {entries.length} day{entries.length === 1 ? "" : "s"}</span>
        </div>
        <Textarea
          className="mt-3 min-h-32"
          placeholder="What did I learn? What tripped me up? What's the next small step?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={save} disabled={!note.trim()}>
            <NotebookPen className="h-4 w-4 mr-1.5" /> Save reflection
          </Button>
        </div>
      </Card>
      <Card className="p-6 rounded-xl border-border">
        <h3 className="font-semibold">Previous entries</h3>
        <div className="mt-3">
          {entries.length === 0 ? (
            <Placeholder text="Nothing here yet. Your first note will start your streak." />
          ) : (
            <ul className="space-y-3">
              {entries.map((e, i) => (
                <li key={i} className="rounded-md border border-border/60 p-3">
                  <div className="text-sm whitespace-pre-wrap">{e.text}</div>
                  <div className="text-xs text-muted-foreground mt-1">{e.at}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}