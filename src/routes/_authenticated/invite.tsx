import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, dashboardPathForRole } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { alog, aerr, describeError } from "@/lib/auth-log";

export const Route = createFileRoute("/_authenticated/invite")({
  head: () => ({ meta: [{ title: "Accept invitation — L2R" }] }),
  component: InvitePage,
});

function InvitePage() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "no-token" | "invalid" | "ok" | "error">("working");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const url = new URL(window.location.href);
      const token =
        url.searchParams.get("token") ||
        url.searchParams.get("invite") ||
        url.searchParams.get("invitation") ||
        url.searchParams.get("invitation_token");
      if (!token) {
        alog("invite:no-token");
        setStatus("no-token");
        return;
      }
      try {
        const { data: claimed, error: claimErr } = await supabase.rpc("claim_instructor_invitation");
        alog("invite:claim-result", { claimed, error: claimErr?.message });
        if (claimErr) {
          aerr("invite:claim", claimErr);
          setError(describeError(claimErr));
          setStatus("error");
          return;
        }
        if (claimed === true) {
          setStatus("ok");
          navigate({ to: dashboardPathForRole("instructor") as never });
          return;
        }
        setStatus("invalid");
      } catch (e) {
        aerr("invite:throw", e);
        setError(describeError(e));
        setStatus("error");
      }
    })();
  }, [user, loading, navigate]);

  if (loading || status === "working") {
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
        {status === "no-token" && <p className="text-sm text-muted-foreground">No invitation token was provided in the link.</p>}
        {status === "invalid" && <p className="text-sm text-muted-foreground">This invitation is not valid for your account, or it has already been used.</p>}
        {status === "error" && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={() => navigate({ to: "/onboarding" as never })}>Continue</Button>
      </Card>
    </div>
  );
}