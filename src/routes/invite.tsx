import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { alog, aerr, describeError } from "@/lib/auth-log";
import { dashboardPathForRole } from "@/lib/hub-auth";

export const Route = createFileRoute("/invite")({
  head: () => ({ meta: [{ title: "Instructor invitation — L2R" }] }),
  component: InvitePage,
});

const STASH_KEY = "l2r:pending_instructor_token";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const t =
    url.searchParams.get("token") ||
    url.searchParams.get("invite") ||
    url.searchParams.get("invitation") ||
    url.searchParams.get("invitation_token");
  if (t) {
    try { sessionStorage.setItem(STASH_KEY, t); } catch { /* noop */ }
    return t;
  }
  try { return sessionStorage.getItem(STASH_KEY); } catch { return null; }
}

function InvitePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "loading" | "no-token" | "needs-auth" | "claiming" | "invalid" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = readToken();
    if (!token) { setStatus("no-token"); return; }

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setStatus("needs-auth"); return; }
      await claim(token);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        const t = readToken();
        if (t) void claim(t);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function claim(token: string) {
    setStatus("claiming");
    try {
      alog("invite:claim-token", { token });
      const { data: ok, error: err } = await supabase.rpc(
        "claim_instructor_invitation_by_token" as never,
        { _token: token } as never,
      );
      if (err) throw err;
      if (ok === true) {
        try { sessionStorage.removeItem(STASH_KEY); } catch { /* noop */ }
        navigate({ to: dashboardPathForRole("instructor") as never, replace: true });
        return;
      }
      setStatus("invalid");
    } catch (e) {
      aerr("invite:claim", e);
      setError(describeError(e));
      setStatus("error");
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    try {
      const token = readToken();
      const redirect_uri = window.location.origin + "/invite" + (token ? `?token=${token}` : "");
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
      if (result.error) throw result.error;
      if (result.redirected) return;
      // Popup path: onAuthStateChange will fire and trigger claim.
    } catch (e) {
      aerr("invite:google", e);
      setError(describeError(e) || "Google sign-in failed");
      setBusy(false);
    }
  }

  if (status === "loading" || status === "claiming") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Instructor invitation</h1>
        {status === "no-token" && (
          <>
            <p className="text-sm text-muted-foreground">
              This link is missing an invitation token. Please use the exact link
              your administrator shared with you.
            </p>
            <Button asChild variant="outline"><Link to="/">Go home</Link></Button>
          </>
        )}
        {status === "needs-auth" && (
          <>
            <p className="text-sm text-muted-foreground">
              You've been invited to join Left2Right as an instructor. Sign in to
              accept your invitation.
            </p>
            <Button onClick={signInWithGoogle} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Prefer email? <Link to="/auth" className="underline">Sign in with email</Link> —
              your invitation will be applied automatically once you return here.
            </p>
          </>
        )}
        {status === "invalid" && (
          <p className="text-sm text-muted-foreground">
            This invitation is no longer valid. It may have been revoked, already
            claimed by another account, or expired.
          </p>
        )}
        {status === "error" && (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => location.reload()}>Try again</Button>
          </>
        )}
      </Card>
    </div>
  );
}