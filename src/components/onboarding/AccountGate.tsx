import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onAuthenticated: () => void | Promise<void>;
  title?: string;
  description?: string;
}

export function AccountGate({ onAuthenticated, title, description }: Props) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void onAuthenticated();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        void onAuthenticated();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [onAuthenticated]);

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + window.location.pathname,
      });
      if (result.error) throw result.error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.href },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Check your email to confirm, then return here to save your answers.");
          setBusy(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{title ?? "Save your answers"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {description ?? "Create a free account (or sign in) to save what you've written. It only takes a moment."}
      </p>

      <Button onClick={handleGoogle} disabled={busy} variant="outline" className="mt-5 w-full">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Continue with Google
      </Button>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmail} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="ag-email">Email</Label>
          <Input id="ag-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ag-password">Password</Label>
          <Input id="ag-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          {mode === "signup" ? "Create account & save" : "Sign in & save"}
        </Button>
      </form>

      {info ? <p className="mt-3 text-sm text-primary">{info}</p> : null}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}