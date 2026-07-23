import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccountGate } from "@/components/onboarding/AccountGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { dashboardPathForRole } from "@/lib/hub-auth";

export const Route = createFileRoute("/invite-family")({
  head: () => ({
    meta: [
      { title: "Accept family invitation — L2R" },
      { name: "description", content: "Claim your student or parent account for your family on L2R." },
    ],
  }),
  component: InviteFamilyPage,
});

function InviteFamilyPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"student" | "parent" | null>(null);

  useEffect(() => {
    const t = new URL(window.location.href).searchParams.get("token");
    setToken(t);
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  async function claim() {
    if (!token) return;
    setStatus("working");
    setError(null);
    try {
      const { data, error } = await supabase.rpc(
        "claim_family_invitation" as never,
        { _token: token } as never,
      );
      if (error) throw error;
      const claimed = data as { kind: "student" | "parent" } | null;
      setKind(claimed?.kind ?? null);
      setStatus("ok");
      setTimeout(() => {
        navigate({
          to: dashboardPathForRole(claimed?.kind === "parent" ? "parent" : "student") as never,
          replace: true,
        });
      }, 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md p-8 text-center space-y-3">
          <h1 className="text-xl font-semibold">No invitation token</h1>
          <p className="text-sm text-muted-foreground">This link is missing a token. Ask the family member who invited you to share the full URL.</p>
        </Card>
      </div>
    );
  }

  if (authed === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Join your family on L2R</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an account (or sign in) with the email address your family invited.
            </p>
          </div>
          <AccountGate
            title="Sign in to accept"
            description="Use the same email that received this invitation."
            onAuthenticated={() => setAuthed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {status === "ok" ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-xl font-semibold">You're linked in</h1>
            <p className="text-sm text-muted-foreground">
              Taking you to your {kind === "parent" ? "Family" : "Student"} Dashboard…
            </p>
          </>
        ) : status === "error" ? (
          <>
            <h1 className="text-xl font-semibold">Couldn't accept the invitation</h1>
            <p className="text-sm text-destructive whitespace-pre-wrap break-words">{error}</p>
            <Button variant="outline" onClick={() => { setStatus("idle"); setError(null); }}>Try again</Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Accept your family invitation</h1>
            <p className="text-sm text-muted-foreground">Click below to link this account to your family.</p>
            <Button onClick={claim} disabled={status === "working"}>
              {status === "working" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Accept invitation
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}