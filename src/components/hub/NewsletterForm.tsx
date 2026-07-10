import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Check } from "lucide-react";

export function NewsletterForm({ source = "hub" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMsg("Please enter a valid email.");
      return;
    }
    setStatus("loading");
    const { error } = await supabase.rpc("subscribe_to_newsletter", {
      _email: email.trim().toLowerCase(),
      _source: source,
    });
    if (error) {
      setStatus("error");
      setMsg("Could not subscribe. Try again in a moment.");
      return;
    }
    setStatus("done");
    setMsg("You're on the list. Thank you.");
    setEmail("");
  }

  return (
    <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@family.com"
          className="pl-9 rounded-full"
        />
      </div>
      <Button type="submit" disabled={status === "loading" || status === "done"} className="rounded-full">
        {status === "done" ? <><Check className="h-4 w-4 mr-1" /> Subscribed</> : status === "loading" ? "…" : "Subscribe"}
      </Button>
      {msg && <div className={`text-xs mt-1 ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>{msg}</div>}
    </form>
  );
}