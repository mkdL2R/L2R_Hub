import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Loader2 } from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Welcome to Left2Right Education Hub" },
      { name: "description", content: "Growing learners. Strengthening families. Building futures." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"welcome" | "email" | "reset">("welcome");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // If already signed in, jump to onboarding/dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/_authenticated/onboarding" as never });
    });
  }, [navigate]);

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/_authenticated/onboarding" as never });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (view === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setInfo("Check your email for a password reset link.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        setInfo("Account created. Check your email to verify, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/_authenticated/onboarding" as never });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40_30%_97%)] via-background to-[hsl(140_25%_96%)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 rounded-3xl shadow-lg border-border/60">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={logoAsset.url} alt="L2R" className="h-16 w-16 rounded-2xl object-cover mb-5 shadow-sm" />
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">
            Welcome to Left2Right<br />Education Hub
          </h1>
          <p className="mt-3 text-sm text-muted-foreground italic">
            Growing learners. Strengthening families. Building futures.
          </p>
        </div>

        {view === "welcome" && (
          <div className="space-y-3">
            <Button onClick={handleGoogle} disabled={busy} className="w-full rounded-full h-11 bg-[#1a73e8] hover:bg-[#1765c9] text-white">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <span className="inline-flex items-center gap-2">
                  <GoogleIcon /> Continue with Google
                </span>
              )}
            </Button>
            <Button onClick={() => setView("email")} variant="outline" className="w-full rounded-full h-11">
              <Mail className="h-4 w-4 mr-2" /> Continue with Email
            </Button>
            {error && <p className="text-sm text-destructive text-center pt-2">{error}</p>}
            <p className="pt-4 text-center text-xs text-muted-foreground">
              By continuing you agree to L2R's terms and privacy practices.
            </p>
          </div>
        )}

        {(view === "email" || view === "reset") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {view === "email" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-emerald-700">{info}</p>}
            <Button type="submit" disabled={busy} className="w-full rounded-full h-11">
              {busy ? "Please wait…" : view === "reset" ? "Send reset link" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            {view === "email" && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="hover:text-foreground">
                  {mode === "signin" ? "Create an account" : "I already have an account"}
                </button>
                <button type="button" onClick={() => { setView("reset"); setError(null); setInfo(null); }} className="hover:text-foreground">
                  Forgot password?
                </button>
              </div>
            )}
            <button type="button" onClick={() => { setView("welcome"); setError(null); setInfo(null); }} className="block mx-auto text-xs text-muted-foreground hover:text-foreground">
              ← Back to sign-in options
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Return home
          </Link>
        </div>
      </Card>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.58 2.7-3.9 2.7-6.62z"/>
      <path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.32A9 9 0 0 0 9 18z" opacity=".9"/>
      <path fill="#fff" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.82.95 4.04l3.02-2.32z" opacity=".75"/>
      <path fill="#fff" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .95 4.96L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" opacity=".6"/>
    </svg>
  );
}